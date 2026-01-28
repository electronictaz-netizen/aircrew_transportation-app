# Competitive Features Analysis: Limo Anywhere vs. Onyx Transportation App

**Last Updated:** January 2026

This document compares Onyx Transportation App to competitors (e.g. Limo Anywhere) and reflects **current product capabilities** including features added since the original analysis (booking portal, customer portal, SMS, push notifications, trip templates, bulk operations, trip notes, advanced filtering, subscriptions, and more).

---

## Current Feature Comparison

### ✅ Features We Have (Including Recently Added)

#### Dispatch & Operations
- **Dispatch Software**: Trip scheduling, driver assignment, reservation management
- **Driver Dashboard**: Driver app for viewing assignments and recording trip completion
- **Fleet Management**: Vehicle tracking, assignment, and management
- **Bulk Trip Operations**: Select multiple trips; bulk status update, bulk assign to driver, bulk delete, export selected or all trips to CSV
- **Trip Templates** (Premium): Reusable trip templates; create trip from template; duplicate trip with one click
- **Trip Notes & Internal Comments**: Manager notes, driver notes, internal-only comments; @mentions; full note history per trip
- **Advanced Trip Filtering**: Search across flight number, locations, customers, and trip notes; filter presets (save/load); sort by multiple fields
- **Recurring Trips**: Recurring job support (parent/child trips)

#### Passenger-Facing & Booking
- **Public Booking Portal**: Public-facing booking form at `/booking/{code}`; real-time price estimates from company pricing rules; trip details (pickup/dropoff, passengers, vehicle type, flight info); booking confirmation emails; booking requests visible in Management Dashboard (Booking Requests tab)
- **Customer Portal**: Passenger self-service at `/portal/{code}`; access via email or phone + one-time access code (sent by email and/or SMS); view upcoming trips and trip history; download receipts/invoices; request changes; rate/review trips
- **Booking Confirmation Emails**: Automatic confirmation emails for new bookings (sendBookingEmail Lambda)
- **Receipts & Invoices**: Receipt generator; customers can download receipts from the Customer Portal

#### Notifications & Communication
- **SMS Notifications** (Telnyx): Outbound SMS (Telnyx API); driver assignment and unassignment SMS; booking and customer portal notifications (e.g. access code delivery); inbound webhook for delivery status and opt-in/opt-out (STOP/START); TCPA-compliant opt-in workflows (e.g. Telnyx campaign guides)
- **Email Notifications**: Booking confirmations; driver notifications (mailto or integrated); daily assignment emails; invitation emails (sendInvitationEmail)
- **Push Notifications**: Backend (pushNotifications Lambda, VAPID); PWA support for push; drivers and users can subscribe to push for trip updates

#### Location, Mapping & GPS
- **Location Management**: Saved locations with categories; address and airport autocomplete
- **Vehicle Tracking Map**: Map view of active vehicle locations; GPS data at trip start/completion; display of drivers/vehicles on map (VehicleTrackingMap)
- **Flight Integration**: Flight status tracking for airport trips; “Check Status” button; integration with flight APIs (e.g. premium tier)

#### Customer, Company & Multi-Tenant
- **Customer Management**: Customer records; trip assignment; customer filter and search
- **Multi-Tenant / Company Onboarding**: Multiple companies; company-level settings; per-company booking code and customer portal; admin company override
- **Subscription & Billing**: Tiered plans (Free, Basic, Premium) with Stripe; 14-day free trial; Stripe Checkout and Customer Portal; subscription gating (e.g. trip templates, flight API, premium SMS)

#### Reporting, UX & Technical
- **Reporting**: Driver and trip analytics; Driver Reports; Trip Reports; export to CSV (bulk export with full trip details)
- **Mobile Ready**: Responsive web design; PWA (installable, offline-capable, push)
- **Custom Fields**: Flexible custom data fields for trips and drivers
- **Theme**: Light/Dark mode
- **Accessibility**: Skip links, ARIA, keyboard support

---

## Key Gaps vs. Limo Anywhere (Still Missing or Partial)

### 1. **Real-Time Continuous GPS Tracking** (High Priority)

**Limo Anywhere:** Continuous GPS during active trips; live vehicle location for dispatchers; live ETA; geofencing (arrival at pickup/dropoff).

**Current State:** We have vehicle locations at trip start/completion and a vehicle tracking map. We do **not** yet have:
- Continuous GPS polling every 30–60 seconds during active trips
- Live ETA from current position
- Geofencing alerts (driver arrived at pickup/dropoff)
- Historical route playback

**What to Add:** Continuous location updates during active trips; dispatcher live map; ETA and geofencing; optional route replay.

**Priority:** ⭐⭐⭐⭐⭐

---

### 2. **Integrated Payment Processing for Passengers** (High Priority)

**Limo Anywhere:** Passenger payment at booking or on completion; saved payment methods; invoicing and receipts; refunds.

**Current State:** Stripe is used for **subscription** billing only. We do **not** yet have:
- Passenger payment at booking (pre-pay) or on completion (post-pay)
- Saved payment methods for customers
- Automatic trip invoicing and payment collection
- Refund workflow

**What to Add:** Stripe Payment Intents (or Connect) for trip payments; optional pre-pay at booking; post-trip invoicing; saved cards in customer portal; refund handling.

**Priority:** ⭐⭐⭐⭐

---

### 3. **Passenger Real-Time Trip Tracking** (Medium–High)

**Limo Anywhere:** Passenger sees driver location on map; status updates (En Route, Arrived, In Progress, Completed); push notifications for status changes.

**Current State:** Customer portal shows trip status and history. We do **not** yet have:
- Live driver/vehicle position on a map for the passenger during the trip
- Real-time status push (e.g. “Driver en route”) with map update
- In-app messaging with driver/dispatcher

**What to Add:** Live trip view with driver location; status push notifications; optional in-app messaging.

**Priority:** ⭐⭐⭐⭐

---

### 4. **Online Pricing/Quote System** (Medium)

**Limo Anywhere:** Distance-based pricing; vehicle-type pricing; round-trip and multi-stop pricing; quote generation with expiration.

**Current State:** We have company-level pricing rules and real-time price estimates on the booking portal. Gaps may include:
- Full distance-based calculator (e.g. integrated maps API for distance)
- Round-trip discount rules and multi-stop pricing
- Formal “quote” object with expiration and acceptance tracking
- Surge or time-of-day pricing

**What to Add:** Richer pricing engine (distance, vehicle, round-trip, multi-stop); quote workflow (generate → send → accept/expire).

**Priority:** ⭐⭐⭐⭐

---

### 5. **CRM / Lead Management** (Medium)

**Limo Anywhere:** Lead capture; quote tracking; lead scoring; follow-up tasks; communication history; pipeline and conversion tracking.

**Current State:** We have customer records and trip history. We do **not** have:
- Dedicated lead/quote objects and pipeline
- Lead scoring or follow-up task management
- Email/SMS campaign integration for leads
- Quote-to-booking conversion analytics

**What to Add:** Lead and quote entities; pipeline stages; tasks and reminders; basic campaign tracking.

**Priority:** ⭐⭐⭐

---

### 6. **Route Optimization & Automated Dispatch** (Medium)

**Limo Anywhere:** Multi-stop optimization; auto-assign by proximity/workload; batch assignment; traffic-aware routing.

**Current State:** Manual driver assignment; no route optimization or auto-dispatch.

**What to Add:** Closest-driver suggestions; multi-stop route ordering; optional auto-assign rules; traffic-aware ETA (if maps API integrated).

**Priority:** ⭐⭐⭐

---

### 7. **Affiliate Network** (Low)

**Limo Anywhere:** Partner network; referral/overflow trips; commission and revenue sharing.

**Current State:** Not implemented.

**Priority:** ⭐⭐

---

### 8. **Digital Marketing Tools** (Low)

**Limo Anywhere:** Email/SMS campaigns; promo codes; referral program; abandoned booking recovery; review requests.

**Current State:** We have transactional SMS and email (bookings, drivers, portal). No marketing campaigns or promo codes.

**Priority:** ⭐⭐

---

### 9. **Advanced Reporting & Analytics** (Medium)

**Limo Anywhere:** Revenue by driver/vehicle/customer/route; profit margin; CAC; LTV; peak-time analysis; custom report builder; scheduled reports.

**Current State:** Driver and trip reports; CSV export. We do **not** have:
- Revenue/profit analytics
- CAC/LTV or booking funnel analytics
- Custom report builder or scheduled report delivery

**What to Add:** Revenue and margin reports; key business metrics; optional custom builder and scheduled emails.

**Priority:** ⭐⭐⭐

---

### 10. **Native Mobile Apps** (Medium)

**Current State:** PWA (installable, offline, push). No native iOS/Android apps.

**What to Add:** Native driver and/or passenger apps if needed for background GPS, app-store presence, or platform-specific UX.

**Priority:** ⭐⭐⭐

---

### 11. **Multi-Language & International** (Low)

**What to Add:** i18n; multiple languages; currency/timezone handling.

**Priority:** ⭐⭐

---

## Summary: What We Added Since the Original Analysis

| Area | Added |
|------|--------|
| **Booking** | Public booking portal with pricing, confirmation emails, booking requests in dashboard |
| **Passenger app** | Customer portal with access code (email/SMS), trip history, receipts, change requests, ratings |
| **SMS** | Telnyx outbound/inbound, driver and booking/portal SMS, opt-in/opt-out, TCPA-aware workflows |
| **Notifications** | Push notifications backend; PWA push; daily assignment emails |
| **Operations** | Trip templates (Premium); bulk status/assign/delete; CSV export; trip notes and internal comments; advanced filters and presets |
| **Subscriptions** | Free / Basic / Premium with Stripe; trial; feature gating |
| **Multi-tenant** | Company-level settings; per-company booking and portal; admin override |
| **Map/GPS** | Vehicle tracking map; GPS at trip start/end (no continuous live tracking yet) |
| **Receipts** | Receipt generator; download from customer portal |

---

## Recommended Implementation Roadmap (Updated)

### Phase 1: Core Gaps (Next 3–6 months)
1. **Real-time continuous GPS** – Live vehicle position and optional ETA/geofencing
2. **Passenger trip payments** – Stripe-based trip pay (pre/post); saved methods; receipts
3. **Passenger live trip view** – Driver location on map for passenger + status push

### Phase 2: Growth & Efficiency (6–12 months)
4. **Richer pricing & quotes** – Distance/vehicle/round-trip; quote lifecycle
5. **Route optimization / auto-dispatch** – Closest driver, batch assign, multi-stop order
6. **Advanced reporting** – Revenue, margin, funnel, optional custom/scheduled reports

### Phase 3: Sales & Scale (12+ months)
7. **CRM / Lead management** – Leads, quotes, pipeline, follow-ups
8. **Native mobile apps** – If required for market
9. **Marketing tools** – Promo codes, campaigns, review requests (or integrate with external tools)

---

## Competitive Advantages to Maintain

1. **Flight integration** – Flight status and airport-focused workflow
2. **Customer portal with access codes** – No passenger login required; email/SMS code
3. **Trip notes and internal comments** – Strong operational communication
4. **Bulk operations and CSV export** – Efficient for large fleets
5. **Trip templates and duplicate trip** – Fast repeat and template-based creation
6. **Multi-tenant and company onboarding** – Clear separation and branding per company
7. **Modern stack** – React, TypeScript, AWS Amplify Gen 2, Stripe, Telnyx
8. **PWA** – Installable, offline-capable, push without native apps

---

## Conclusion

Since the original competitive analysis, Onyx has added a **public booking portal**, **customer portal** (with access codes and receipts), **SMS (Telnyx)** for drivers and passengers, **push notifications**, **trip templates**, **bulk operations**, **trip notes**, **advanced filtering**, **tiered subscriptions**, and **vehicle map display**. These close many of the earlier gaps vs. Limo Anywhere.

**Highest-impact remaining gaps:**
1. **Real-time continuous GPS** – Live tracking and ETA/geofencing
2. **Passenger trip payments** – Pay per trip (pre/post) and saved payment methods
3. **Passenger live trip view** – See driver on map and get status updates in real time
4. **Richer pricing and quotes** – Distance, round-trip, and quote workflow

Focusing on these four areas will further align Onyx with competitor offerings while keeping our strengths in flight integration, customer portal, operations (bulk, notes, templates), and multi-tenant subscription model.
