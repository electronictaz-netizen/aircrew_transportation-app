/**
 * GPS Location Utility
 * Handles getting GPS coordinates from the browser's Geolocation API
 */

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface GPSLocationError {
  code: number;
  message: string;
  permissionDenied?: boolean;
  positionUnavailable?: boolean;
  timeout?: boolean;
}

/**
 * Get current GPS location
 * @param options - Geolocation options (timeout, maximumAge, enableHighAccuracy)
 * @returns Promise with GPS coordinates or error
 */
export function getCurrentLocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 60000, // 1 minute
  }
): Promise<GPSLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: -1,
        message: 'Geolocation is not supported by this browser.',
        positionUnavailable: true,
      } as GPSLocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorObj: GPSLocationError = {
          code: error.code,
          message: error.message,
        };

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorObj.permissionDenied = true;
            errorObj.message = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorObj.positionUnavailable = true;
            errorObj.message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorObj.timeout = true;
            errorObj.message = 'Location request timed out. Please try again.';
            break;
          default:
            errorObj.message = 'An unknown error occurred while getting location.';
            break;
        }

        reject(errorObj);
      },
      options
    );
  });
}

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Get a human-readable error message for GPS errors
 */
export function getLocationErrorMessage(error: GPSLocationError): string {
  if (error.permissionDenied) {
    return 'Location permission denied. Please enable location access in your browser settings to record GPS coordinates.';
  }
  if (error.positionUnavailable) {
    return 'Unable to get your location. Please ensure GPS is enabled and try again.';
  }
  if (error.timeout) {
    return 'Location request timed out. Please try again.';
  }
  return error.message || 'Failed to get location. Please try again.';
}

/**
 * Format GPS coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number, precision: number = 6): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
