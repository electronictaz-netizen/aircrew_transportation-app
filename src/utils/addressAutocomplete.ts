/**
 * Address Autocomplete Utility
 * Provides autocomplete functionality for addresses
 * Uses Google Places API if API key is available, otherwise falls back to OpenStreetMap Nominatim
 */

import { logger } from './logger';

export interface AddressSuggestion {
  description: string;
  placeId?: string;
  mainText?: string;
  secondaryText?: string;
}

// Cache for autocomplete suggestions
const suggestionCache = new Map<string, { suggestions: AddressSuggestion[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get Google Places API key from environment variables
 */
function getGooglePlacesApiKey(): string | null {
  // Check for Vite environment variable
  if (import.meta.env.VITE_GOOGLE_PLACES_API_KEY) {
    return import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  }
  // Check for window global (for runtime configuration)
  if (typeof window !== 'undefined' && (window as any).GOOGLE_PLACES_API_KEY) {
    return (window as any).GOOGLE_PLACES_API_KEY;
  }
  return null;
}

/**
 * Check if Google Places API is available
 */
export function isGooglePlacesAvailable(): boolean {
  return getGooglePlacesApiKey() !== null;
}

/**
 * Load Google Places Autocomplete script if not already loaded
 */
async function loadGooglePlacesScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      resolve(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${getGooglePlacesApiKey()}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      logger.warn('Failed to load Google Places API script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Get address suggestions using Google Places Autocomplete
 */
async function getGooglePlacesSuggestions(query: string): Promise<AddressSuggestion[]> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    // Load Google Places script if needed
    const loaded = await loadGooglePlacesScript();
    if (!loaded) {
      logger.warn('Google Places API script failed to load');
      return [];
    }

    // Use Google Places Autocomplete Service
    const service = new (window as any).google.maps.places.AutocompleteService();
    
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: query,
          types: ['address', 'establishment'], // Focus on addresses and places
          componentRestrictions: undefined, // Can be restricted to specific countries if needed
        },
        (predictions: any[], status: string) => {
          if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !predictions) {
            logger.debug('Google Places Autocomplete returned no results', { status, query });
            resolve([]);
            return;
          }

          const suggestions: AddressSuggestion[] = predictions.map((prediction) => ({
            description: prediction.description,
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting?.main_text || prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text || '',
          }));

          resolve(suggestions);
        }
      );
    });
  } catch (error) {
    logger.error('Error getting Google Places suggestions', { error, query });
    return [];
  }
}

/**
 * Get address suggestions using OpenStreetMap Nominatim (fallback)
 * Note: Nominatim is not ideal for autocomplete but works as a fallback
 */
async function getNominatimSuggestions(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    // Rate limiting: Nominatim allows 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AircrewTransportationApp/1.0 (Transportation Management System)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('Nominatim API error', { status: response.status, query });
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const suggestions: AddressSuggestion[] = data.map((item: any) => ({
      description: item.display_name || item.name || '',
      mainText: item.name || item.display_name?.split(',')[0] || '',
      secondaryText: item.display_name?.split(',').slice(1).join(',').trim() || '',
    }));

    return suggestions;
  } catch (error) {
    logger.error('Error getting Nominatim suggestions', { error, query });
    return [];
  }
}

/**
 * Get address autocomplete suggestions
 * @param query - Search query string
 * @returns Promise with array of address suggestions
 */
export async function getAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.trim();
  
  // Check cache first
  const cached = suggestionCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.debug('Using cached address suggestions', { query: normalizedQuery });
    return cached.suggestions;
  }

  let suggestions: AddressSuggestion[] = [];

  // Try Google Places first if available
  if (isGooglePlacesAvailable()) {
    suggestions = await getGooglePlacesSuggestions(normalizedQuery);
  }

  // Fallback to Nominatim if Google Places didn't return results
  if (suggestions.length === 0) {
    suggestions = await getNominatimSuggestions(normalizedQuery);
  }

  // Cache the results
  suggestionCache.set(normalizedQuery, {
    suggestions,
    timestamp: Date.now(),
  });

  return suggestions;
}

/**
 * Clear the suggestion cache
 */
export function clearSuggestionCache(): void {
  suggestionCache.clear();
  logger.debug('Address autocomplete cache cleared');
}

// Cache for geocoded coordinates (address -> { lat, lng })
const geocodeCache = new Map<string, { lat: number; lng: number; timestamp: number }>();
const GEOCODE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Geocode an address to latitude/longitude (for geofencing).
 * Uses Nominatim. Rate limit: 1 req/sec. Results cached 24h.
 * @returns { lat, lng } or null if not found
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length === 0) return null;

  const normalized = address.trim();
  const cached = geocodeCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_DURATION) {
    return { lat: cached.lat, lng: cached.lng };
  }

  try {
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim: 1 req/sec
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AircrewTransportationApp/1.0 (Transportation Management System)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lng)) return null;
    geocodeCache.set(normalized, { lat, lng, timestamp: Date.now() });
    return { lat, lng };
  } catch (error) {
    logger.error('Geocode address error', { address: normalized, error });
    return null;
  }
}
