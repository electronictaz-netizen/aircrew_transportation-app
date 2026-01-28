/**
 * Real-Time GPS Tracking Utility
 * Handles continuous GPS tracking during active trips.
 * Uses watchPosition (throttled) for better responsiveness; tracking works best with app in foreground.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { calculateDistance } from './gpsLocation';

const client = generateClient<Schema>();

/** Geofence radius in km (150 meters) */
const GEOFENCE_RADIUS_KM = 0.15;

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
};

export interface TrackingConfig {
  tripId: string;
  driverId: string;
  vehicleId?: string;
  companyId: string;
  updateInterval?: number; // Min ms between updates (default: 30000 = 30 seconds)
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

let watchId: number | null = null;
let currentTrackingConfig: TrackingConfig | null = null;
let isTracking = false;
let lastSentTime = 0;
let consecutiveFailures = 0;
let consecutiveFailureNotified = false;

/** Message used when multiple location updates fail in a row (Step 7: driver UX) */
export const GPS_CONSECUTIVE_FAILURE_MESSAGE = 'Location updates paused – check GPS';

/**
 * Start continuous GPS tracking for an active trip.
 * Uses watchPosition with throttle; tracking works best with app in foreground (background may be throttled by browser).
 */
export async function startGPSTracking(config: TrackingConfig): Promise<void> {
  stopGPSTracking();

  if (!navigator.geolocation) {
    const err = new Error('Geolocation is not supported by this browser.');
    config.onError?.(err);
    return;
  }

  currentTrackingConfig = config;
  isTracking = true;
  const updateInterval = config.updateInterval ?? 30000;

  // Send initial location, then start watchPosition
  navigator.geolocation.getCurrentPosition(
    (position) => {
      sendLocationFromPosition(config, position).catch(handleSendError);
      lastSentTime = Date.now();

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!currentTrackingConfig || !isTracking) return;
          if (Date.now() - lastSentTime < updateInterval) return;
          lastSentTime = Date.now();
          sendLocationFromPosition(currentTrackingConfig, pos).catch(handleSendError);
        },
        (err) => {
          console.warn('GPS watch error:', err.message);
          config.onError?.(new Error(err.message));
        },
        WATCH_OPTIONS
      );
    },
    (err) => {
      console.warn('Initial GPS get failed:', err.message);
      const msg = err.code === 1 ? 'Location permission denied. Please enable location in your browser or device settings.' : err.message;
      config.onError?.(new Error(msg));
      // Still start watch so we recover when fix is available (unless permission denied)
      if (err.code !== 1) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!currentTrackingConfig || !isTracking) return;
            if (Date.now() - lastSentTime < updateInterval) return;
            lastSentTime = Date.now();
            sendLocationFromPosition(currentTrackingConfig, pos).catch(handleSendError);
          },
          (e) => config.onError?.(new Error(e.message)),
          WATCH_OPTIONS
        );
      }
    },
    WATCH_OPTIONS
  );
}

function handleSendError(e: unknown): void {
  const err = e instanceof Error ? e : new Error('Location update failed');
  console.warn('GPS update failed:', err);
  consecutiveFailures += 1;
  if (consecutiveFailures >= 3 && !consecutiveFailureNotified) {
    consecutiveFailureNotified = true;
    currentTrackingConfig?.onError?.(new Error(GPS_CONSECUTIVE_FAILURE_MESSAGE));
  } else if (consecutiveFailures < 3) {
    currentTrackingConfig?.onError?.(err);
  }
}

/**
 * Stop GPS tracking
 */
export function stopGPSTracking(): void {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  isTracking = false;
  currentTrackingConfig = null;
}

/**
 * Send one location update from a GeolocationPosition (used by watchPosition callback and initial getCurrentPosition).
 */
async function sendLocationFromPosition(config: TrackingConfig, position: GeolocationPosition): Promise<void> {
  const coords = position.coords;
  const RETENTION_DAYS = 60;
  const ttlSeconds = Math.floor(Date.now() / 1000) + RETENTION_DAYS * 24 * 60 * 60;

  const vehicleLocationData: Record<string, unknown> = {
    companyId: config.companyId,
    tripId: config.tripId,
    driverId: config.driverId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp: new Date().toISOString(),
    ttl: ttlSeconds,
  };

  if (config.vehicleId) {
    vehicleLocationData.vehicleId = config.vehicleId;
  }
  if (coords.accuracy != null) {
    vehicleLocationData.accuracy = coords.accuracy;
  }
  if (coords.speed != null && coords.speed !== undefined) {
    vehicleLocationData.speed = coords.speed;
  }
  if (coords.heading != null && coords.heading !== undefined) {
    vehicleLocationData.heading = coords.heading;
  }

  // @ts-ignore - Complex union type from Amplify Data
  await client.models.VehicleLocation.create(vehicleLocationData);

  // Reset consecutive failure count on success (Step 7: driver UX)
  consecutiveFailures = 0;
  consecutiveFailureNotified = false;

  checkGeofenceAndUpdateTrip(config.tripId, coords.latitude, coords.longitude).catch((err) =>
    console.warn('Geofence check failed:', err)
  );

  config.onSuccess?.();
}

/**
 * Check if driver is within geofence of pickup/dropoff and update trip times.
 * Called after each location send; runs in background (errors logged, not thrown).
 */
async function checkGeofenceAndUpdateTrip(tripId: string, lat: number, lng: number): Promise<void> {
  try {
    const { data: trip } = await client.models.Trip.get({ id: tripId });
    if (!trip) return;

    const now = new Date().toISOString();
    const updates: Partial<Schema['Trip']['type']> = {};

    if (
      trip.pickupLat != null &&
      trip.pickupLng != null &&
      trip.actualPickupTime == null &&
      calculateDistance(lat, lng, trip.pickupLat, trip.pickupLng) <= GEOFENCE_RADIUS_KM
    ) {
      updates.actualPickupTime = now;
    }

    if (
      trip.dropoffLat != null &&
      trip.dropoffLng != null &&
      trip.actualDropoffTime == null &&
      calculateDistance(lat, lng, trip.dropoffLat, trip.dropoffLng) <= GEOFENCE_RADIUS_KM
    ) {
      updates.actualDropoffTime = now;
    }

    if (Object.keys(updates).length > 0) {
      await client.models.Trip.update({ id: tripId, ...updates });
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get the latest location for a trip
 */
export async function getLatestTripLocation(tripId: string): Promise<Schema['VehicleLocation']['type'] | null> {
  try {
    const { data } = await client.models.VehicleLocation.list({
      filter: {
        tripId: { eq: tripId },
      },
    });

    if (!data || data.length === 0) {
      return null;
    }

    // Sort by timestamp descending and return the most recent
    const sorted = [...data].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return sorted[0] as Schema['VehicleLocation']['type'];
  } catch (error) {
    console.error('Error getting latest trip location:', error);
    return null;
  }
}

/**
 * Get all location points for a trip (for route playback)
 */
export async function getTripLocationHistory(
  tripId: string,
  limit: number = 1000
): Promise<Array<Schema['VehicleLocation']['type']>> {
  try {
    const { data } = await client.models.VehicleLocation.list({
      filter: {
        tripId: { eq: tripId },
      },
      limit,
    });

    if (!data) {
      return [];
    }

    // Sort by timestamp ascending for route playback
    return [...data].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    }) as Array<Schema['VehicleLocation']['type']>;
  } catch (error) {
    console.error('Error getting trip location history:', error);
    return [];
  }
}

/**
 * Get all active vehicle locations for a company (for dispatcher map view)
 */
export async function getActiveVehicleLocations(
  companyId: string,
  activeTripIds?: string[]
): Promise<Array<Schema['VehicleLocation']['type']>> {
  try {
    if (activeTripIds && activeTripIds.length > 0) {
      // Note: Amplify doesn't support 'in' operator directly, so we'll fetch all and filter
      const { data } = await client.models.VehicleLocation.list({
        filter: {
          companyId: { eq: companyId },
        },
        limit: 10000, // Adjust based on expected volume
      });

      if (!data) {
        return [];
      }

      // Filter to only active trips and get the latest location for each trip
      const activeLocations = data.filter((loc) => activeTripIds.includes(loc.tripId));
      
      // Group by tripId and get the latest for each
      const latestByTrip = new Map<string, Schema['VehicleLocation']['type']>();
      activeLocations.forEach((loc) => {
        const existing = latestByTrip.get(loc.tripId);
        if (!existing) {
          latestByTrip.set(loc.tripId, loc as Schema['VehicleLocation']['type']);
        } else {
          const existingTime = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
          const locTime = loc.timestamp ? new Date(loc.timestamp).getTime() : 0;
          if (locTime > existingTime) {
            latestByTrip.set(loc.tripId, loc as Schema['VehicleLocation']['type']);
          }
        }
      });

      return Array.from(latestByTrip.values());
    } else {
      // Get all recent locations (last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data } = await client.models.VehicleLocation.list({
        filter: {
          companyId: { eq: companyId },
        },
        limit: 1000,
      });

      if (!data) {
        return [];
      }

      // Filter to last hour and get latest per trip
      const recentLocations = data.filter((loc) => {
        if (!loc.timestamp) return false;
        return new Date(loc.timestamp) >= oneHourAgo;
      });

      // Group by tripId and get the latest for each
      const latestByTrip = new Map<string, Schema['VehicleLocation']['type']>();
      recentLocations.forEach((loc) => {
        const existing = latestByTrip.get(loc.tripId);
        if (!existing) {
          latestByTrip.set(loc.tripId, loc as Schema['VehicleLocation']['type']);
        } else {
          const existingTime = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
          const locTime = loc.timestamp ? new Date(loc.timestamp).getTime() : 0;
          if (locTime > existingTime) {
            latestByTrip.set(loc.tripId, loc as Schema['VehicleLocation']['type']);
          }
        }
      });

      return Array.from(latestByTrip.values());
    }
  } catch (error) {
    console.error('Error getting active vehicle locations:', error);
    return [];
  }
}

/**
 * Check if GPS tracking is currently active
 */
export function isTrackingActive(): boolean {
  return isTracking;
}

/**
 * Get current tracking configuration
 */
export function getCurrentTrackingConfig(): TrackingConfig | null {
  return currentTrackingConfig;
}
