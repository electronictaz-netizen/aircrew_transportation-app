/**
 * Real-Time GPS Tracking Utility
 * Handles continuous GPS tracking during active trips
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getCurrentLocation, calculateDistance } from './gpsLocation';

const client = generateClient<Schema>();

/** Geofence radius in km (150 meters) */
const GEOFENCE_RADIUS_KM = 0.15;

export interface TrackingConfig {
  tripId: string;
  driverId: string;
  vehicleId?: string;
  companyId: string;
  updateInterval?: number; // Milliseconds between updates (default: 30000 = 30 seconds)
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

let activeTrackingInterval: NodeJS.Timeout | null = null;
let currentTrackingConfig: TrackingConfig | null = null;
let isTracking = false;

/**
 * Start continuous GPS tracking for an active trip
 * Sends location updates at regular intervals
 */
export async function startGPSTracking(config: TrackingConfig): Promise<void> {
  // Stop any existing tracking
  stopGPSTracking();

  currentTrackingConfig = config;
  const updateInterval = config.updateInterval || 30000; // Default: 30 seconds

  // Send initial location immediately
  await sendLocationUpdate(config);

  // Set up interval for continuous updates
  activeTrackingInterval = setInterval(async () => {
    if (currentTrackingConfig && isTracking) {
      await sendLocationUpdate(currentTrackingConfig);
    }
  }, updateInterval);

  isTracking = true;
}

/**
 * Stop GPS tracking
 */
export function stopGPSTracking(): void {
  if (activeTrackingInterval) {
    clearInterval(activeTrackingInterval);
    activeTrackingInterval = null;
  }
  isTracking = false;
  currentTrackingConfig = null;
}

/**
 * Send a single location update to the server
 */
async function sendLocationUpdate(config: TrackingConfig): Promise<void> {
  try {
    // Get current GPS location
    const location = await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Use location no older than 5 seconds
    });

    // Create vehicle location record (ttl = 60 days from now for DynamoDB TTL retention)
    const RETENTION_DAYS = 60;
    const ttlSeconds = Math.floor(Date.now() / 1000) + RETENTION_DAYS * 24 * 60 * 60;

    const vehicleLocationData: any = {
      companyId: config.companyId,
      tripId: config.tripId,
      driverId: config.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString(),
      ttl: ttlSeconds,
    };

    // Add optional fields if available
    if (config.vehicleId) {
      vehicleLocationData.vehicleId = config.vehicleId;
    }

    if (location.accuracy !== undefined) {
      vehicleLocationData.accuracy = location.accuracy;
    }

    // Try to get speed and heading from the position if available
    // Note: These may not be available in all browsers/devices
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });
    });

    if (position.coords.speed !== null && position.coords.speed !== undefined) {
      vehicleLocationData.speed = position.coords.speed; // meters per second
    }

    if (position.coords.heading !== null && position.coords.heading !== undefined) {
      vehicleLocationData.heading = position.coords.heading; // degrees
    }

    // Save location to database
    // @ts-ignore - Complex union type from Amplify Data
    await client.models.VehicleLocation.create(vehicleLocationData);

    // Geofence check: update actualPickupTime/actualDropoffTime when driver is within radius
    checkGeofenceAndUpdateTrip(config.tripId, location.latitude, location.longitude).catch((err) =>
      console.warn('Geofence check failed:', err)
    );

    if (config.onSuccess) {
      config.onSuccess();
    }
  } catch (error) {
    console.error('Error sending GPS location update:', error);
    if (config.onError) {
      config.onError(error instanceof Error ? error : new Error('Failed to send location update'));
    }
  }
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
