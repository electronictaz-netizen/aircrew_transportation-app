# Real-Time Continuous GPS: What We Have & What We Need

This document describes the current GPS tracking implementation and what is needed to deliver full **real-time continuous GPS** (live vehicle position for dispatchers, optional ETA and geofencing).

---

## What We Already Have

### 1. Data model
- **VehicleLocation** (Amplify Data): `companyId`, `tripId`, `driverId`, `vehicleId`, `latitude`, `longitude`, `accuracy`, `speed`, `heading`, `timestamp`
- Create/read via Amplify Data API; authorization: authenticated users

### 2. Client-side location
- **gpsLocation.ts**: `getCurrentLocation()` (browser Geolocation API), error handling, `isGeolocationAvailable()`, `calculateDistance()` (Haversine)
- **gpsTracking.ts**:
  - `startGPSTracking(config)` – starts an interval (default **30 seconds**), sends location via `VehicleLocation.create()`
  - `stopGPSTracking()` – clears interval
  - `sendLocationUpdate()` – gets GPS, optionally speed/heading, creates `VehicleLocation`
  - `getActiveVehicleLocations(companyId, activeTripIds)` – latest location per active trip
  - `getTripLocationHistory(tripId)` – all points for a trip (route playback)

### 3. Driver flow
- **DriverDashboard**: When the driver has a trip in **In Progress**, `startGPSTracking()` is called automatically (trip + driver + company + optional vehicle). When there is no In Progress trip, `stopGPSTracking()` is called. Cleanup on unmount.

### 4. Dispatcher map
- **VehicleTrackingMap**: Loads active vehicle locations, shows markers with trip/driver/vehicle, auto-refresh **every 10 seconds** via `getActiveVehicleLocations()`.

### 5. Route playback
- `getTripLocationHistory(tripId)` exists; UI for “replay route” on the map can be added if not already present.

So today we already have **periodic GPS** (every 30s from driver) and **near real-time display** (dispatcher map refreshes every 10s). The gaps are: true real-time delivery to dispatchers, background tracking, geofencing, ETA, and data retention.

---

## What We Need to Implement for Full Real-Time Continuous GPS

### 1. Real-time delivery to dispatchers (high impact)

**Current:** Map polls every 10 seconds.

**Goal:** Dispatcher sees new positions within 1–2 seconds of the driver sending them.

**Options:**

| Option | Effort | Notes |
|--------|--------|--------|
| **A. Amplify Data subscriptions** | Low | Use `observeQuery` or `subscribe` on `VehicleLocation` (e.g. `onCreate`). When driver creates a `VehicleLocation`, dispatcher UI updates automatically. No new backend. |
| **B. Shorter polling** | Very low | Reduce map refresh to 3–5 seconds. More API calls, no new infra. |
| **C. API Gateway WebSocket + Lambda** | High | Custom WebSocket API; Lambda writes to connection when a new location is stored. Full control, more ops. |

**Recommendation:** Implement **Option A** first (Amplify subscriptions). If Amplify Data supports `observeQuery` on `VehicleLocation` with a filter (e.g. `companyId` and optional `tripId`), subscribe in `VehicleTrackingMap` and update state when new locations arrive; remove or lengthen the 10s polling interval.

**Concrete steps:**
1. In Amplify Data, confirm subscription/observe is enabled for `VehicleLocation` (and auth allows it).
2. In `VehicleTrackingMap` (or a wrapper hook), use `client.models.VehicleLocation.observeQuery({ filter: { companyId: { eq: companyId } } })` (and optional `tripId` filter) and merge results into “latest location per trip” for the map.
3. When subscription delivers new data, update markers; optionally keep a short polling fallback (e.g. 30s) if subscription fails.

**Implemented (Step 1):** `VehicleTrackingMap` now subscribes to `VehicleLocation.onCreate({ filter: { companyId: { eq: companyId } } })`. When the driver sends a new location (every ~30s), the dispatcher map updates immediately. The 10s polling was removed; a 60s fallback refresh remains for reconnection safety.

---

### 2. Background tracking when app is in background (high impact for “continuous”)

**Current:** Tracking runs in the foreground (setInterval + getCurrentPosition). When the driver minimizes the app or locks the phone, the browser can throttle or suspend timers, so updates may stop or become rare.

**Goal:** Location continues to be sent every 30–60 seconds while the trip is In Progress, even when the app is in the background.

**Options:**

| Option | Effort | Notes |
|--------|--------|--------|
| **A. Document “keep app open”** | None | State that for best tracking the driver should keep the app in the foreground. Accept that background updates may be unreliable in PWA. |
| **B. `watchPosition` instead of interval** | Low | Use `navigator.geolocation.watchPosition()` and send each update (throttled to ~30s) to the backend. Still subject to background throttling but can be slightly better when in foreground. |
| **C. Native app (Capacitor/Ionic, etc.)** | High | Use a background geolocation plugin (e.g. Capacitor Background Geolocation). Allows true background updates; requires building and maintaining native apps. |
| **D. Service Worker + Background Sync** | Medium | Queue location in IndexedDB; Background Sync fires when the OS allows. Still not guaranteed on all platforms; complexity is moderate. |

**Recommendation:** Short term: **A + B** (document limitation, optionally switch to `watchPosition` with throttling). Long term, for true continuous background: **C** (native app with background geolocation plugin).

**Concrete steps (B only):**
1. In `gpsTracking.ts`, replace “setInterval + getCurrentPosition” with `watchPosition` and a throttle (e.g. max one `VehicleLocation.create()` per 30s).
2. On `startGPSTracking`, call `navigator.geolocation.watchPosition`; on `stopGPSTracking`, call `navigator.geolocation.clearWatch`.
3. Update docs to say tracking works best with app in foreground; background behavior is best-effort on PWA.

---

### 3. Geofencing (arrival at pickup/dropoff) (medium impact)

**Current:** No geofencing.

**Goal:** Detect when the driver is within X meters of pickup or dropoff and optionally update trip status or send notifications (e.g. “Driver arrived at pickup”).

**Needed:**
- **Pickup/dropoff coordinates:** Either store lat/lng on Trip (e.g. `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`) or geocode from addresses once and cache.
- **Check on each location update:** In the driver app (or in a Lambda triggered by new `VehicleLocation`), compute distance from current position to pickup and dropoff (e.g. Haversine – we already have `calculateDistance` in `gpsLocation.ts`). If distance &lt; threshold (e.g. 100–200 m), trigger “arrived at pickup” or “arrived at dropoff”.
- **Actions:** Update trip (e.g. custom status or “actual pickup time” / “actual dropoff time”), and/or send push/SMS to customer (“Driver has arrived”).

**Concrete steps:**
1. Add optional `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng` to Trip (or a separate Geocode cache), and populate via geocoding when address is set.
2. In the driver flow that sends location (e.g. in `sendLocationUpdate` or in a Lambda on `VehicleLocation` create), add a “geofence check”: if within 150 m of pickup and not yet “arrived at pickup”, set arrival time and optionally notify; same for dropoff.
3. Optionally expose threshold and “notify customer on arrival” in company or trip settings.

---

**Implemented (Step 2):** Trip schema has optional pickupLat, pickupLng, dropoffLat, dropoffLng. geocodeAddress() in addressAutocomplete.ts geocodes via Nominatim. TripForm geocodes on save; ManagementDashboard passes coords into Trip.create. After each VehicleLocation.create, checkGeofenceAndUpdateTrip() runs: if within 150 m of pickup/dropoff and time not set, sets actualPickupTime/actualDropoffTime.

### 4. Live ETA (medium impact)

**Current:** No ETA from current position to destination.

**Goal:** Show dispatcher (and optionally passenger) “ETA to dropoff” based on current driver position and traffic.

**Needed:**
- **Routing API:** Google Directions, Mapbox, or similar to get driving ETA from (lat, lng) to dropoff address.
- **When to compute:** On each new vehicle location (or every N minutes) for active trips; or on demand when dispatcher opens the trip.
- **Where to show:** Dispatcher map (e.g. in trip popup) and optionally customer portal.

**Concrete steps:**
1. Choose a routing provider; add API key (env var) and server-side call (Lambda or existing backend) to avoid exposing key in the client.
2. Geocode dropoff address to lat/lng if not already stored.
3. Call routing API: origin = latest vehicle lat/lng, destination = dropoff; get duration.
4. Store or stream ETA (e.g. “ETA 14 min”) and display in VehicleTrackingMap and trip detail.

---

### 5. Data retention and cost (medium)

**Current:** Every 30s per active trip creates many `VehicleLocation` rows. No automatic cleanup.

**Goal:** Avoid unbounded growth and control cost while keeping recent data for live map and short-term playback.

**Options:**
- **DynamoDB TTL:** If Amplify/AppSync backend uses DynamoDB with TTL, set `ttl` on `VehicleLocation` (e.g. 30–90 days).
- **Scheduled cleanup:** Lambda (e.g. daily) that deletes or archives `VehicleLocation` records older than N days.
- **Separate “live” store:** Keep “current position” in a record updated in place (one per active trip) and only append to history for last 24–48 hours; archive or drop older history.

**Concrete steps:**
1. Check Amplify/backend for TTL support on `VehicleLocation`; if yes, add TTL attribute (e.g. 60 days).
2. If no TTL, add a scheduled Lambda that deletes (or moves to cold storage) `VehicleLocation` rows with `timestamp` older than 30–60 days.
3. Document retention policy for customers.

---

### 6. Driver UX and reliability (low–medium)

- **Visibility:** Show a clear “Tracking active” indicator on DriverDashboard when `isTrackingActive()` is true.
- **Permissions:** On first use, request location permission and handle “denied” (message + disable tracking or hide Start Trip until granted).
- **Battery:** Document that tracking uses GPS and may increase battery use; recommend keeping the device charged on long shifts.
- **Errors:** Already have `onError` in `startGPSTracking`; consider a non-intrusive toast or icon when several updates fail in a row (e.g. “Location updates paused – check GPS”).

---

### 7. Passenger-facing live tracking (optional)

**Goal:** Let the customer see the driver’s live position (and optionally ETA) in the customer portal during the trip.

**Needed:**
- **Authz:** Ensure only the customer (or trip owner) can read the current position for that trip (e.g. API that takes `tripId` + auth and returns latest `VehicleLocation` for that trip, or a subscription scoped to that trip).
- **UI:** A small map or “driver location” view in the customer portal when the trip is In Progress, fed by the same real-time source (subscription or short polling) as above.

---

## Suggested order of implementation

1. **Real-time dispatcher map (Amplify subscriptions)** – Improves “real-time” feel with minimal backend change.
2. **Geofencing (arrival at pickup/dropoff)** – Uses existing location stream; high perceived value.
3. **Data retention (TTL or scheduled delete)** – Prevents cost and growth issues before they scale.
4. **Live ETA** – Requires routing API and keys; do after 1–3.
5. **Background tracking** – Document + optional `watchPosition` now; native app later if required.
6. **Passenger live tracking** – After dispatcher real-time and authz are solid.

---

## Summary

| Piece | Status | Action |
|-------|--------|--------|
| VehicleLocation model | Done | — |
| Driver sends location every 30s | Done | Optional: switch to watchPosition + throttle |
| Dispatcher map | Done (10s poll) | Add Amplify subscription for real-time updates |
| Background tracking | Partial (foreground only) | Document; optional watchPosition; native app for true background |
| Geofencing | Missing | Add coordinates to trip + check on each update; trigger “arrived” |
| Live ETA | Missing | Add routing API (server-side); compute on location update |
| Retention | Missing | Add TTL or scheduled Lambda delete |
| Passenger live map | Missing | Authz + UI after dispatcher real-time is in place |

Implementing **real-time delivery (subscriptions)** and **geofencing** gives the biggest improvement for “real-time continuous GPS” with the current architecture; the rest can be added in the order above.
