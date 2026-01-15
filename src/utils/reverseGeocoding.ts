/**
 * Reverse Geocoding Utility
 * Converts GPS coordinates (latitude, longitude) to human-readable addresses
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

import { logger } from './logger';

export interface ReverseGeocodeResult {
  success: boolean;
  address?: string;
  error?: string;
}

// Cache for reverse geocoded addresses to reduce API calls
const addressCache = new Map<string, { address: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting: Nominatim allows 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

/**
 * Generate cache key from coordinates
 */
function getCacheKey(lat: number, lng: number): string {
  // Round to 6 decimal places (~0.1 meter precision) for cache key
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * Check if cached address is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Rate limit requests to Nominatim (1 request per second)
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Reverse geocode coordinates to address using OpenStreetMap Nominatim
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @returns Promise with address or error
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(latitude, longitude);
    const cached = addressCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      logger.debug('Reverse geocoding: Using cached address', { lat: latitude, lng: longitude });
      return {
        success: true,
        address: cached.address,
      };
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates',
      };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        success: false,
        error: 'Coordinates out of valid range',
      };
    }

    // Rate limit requests
    await waitForRateLimit();

    // Call Nominatim API
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    logger.debug('Reverse geocoding: Fetching address', { lat: latitude, lng: longitude, url });
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AircrewTransportationApp/1.0 (Transportation Management System)', // Required by Nominatim
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Reverse geocoding API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data || !data.display_name) {
      logger.warn('Reverse geocoding: No address found', { lat: latitude, lng: longitude, data });
      return {
        success: false,
        error: 'No address found for these coordinates',
      };
    }

    const address = data.display_name as string;

    // Cache the result
    addressCache.set(cacheKey, {
      address,
      timestamp: Date.now(),
    });

    logger.debug('Reverse geocoding: Success', { lat: latitude, lng: longitude, address });
    
    return {
      success: true,
      address,
    };
  } catch (error) {
    logger.error('Reverse geocoding error', { lat: latitude, lng: longitude, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Format address for display (can be customized)
 */
export function formatAddress(address: string): string {
  return address;
}

/**
 * Clear the address cache (useful for testing or forced refresh)
 */
export function clearAddressCache(): void {
  addressCache.clear();
  logger.debug('Reverse geocoding cache cleared');
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: addressCache.size,
    keys: Array.from(addressCache.keys()),
  };
}
