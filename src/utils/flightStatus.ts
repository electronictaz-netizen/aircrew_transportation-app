/**
 * Flight Status Service Utility
 * 
 * This utility integrates with flight status APIs to get real-time flight information.
 * Supports multiple providers with automatic fallback.
 * 
 * Supported APIs:
 * - AviationStack (https://aviationstack.com/) - Default
 * - FlightAware (https://flightaware.com/commercial/flightxml/)
 * - FlightRadar24 (https://www.flightradar24.com/)
 * 
 * Configuration via environment variables:
 * 
 * SINGLE PROVIDER (legacy):
 * - VITE_FLIGHT_API_PROVIDER: 'aviationstack' | 'flightaware' | 'flightradar24'
 * - VITE_FLIGHT_API_KEY: Your API key for the selected provider
 * 
 * MULTIPLE PROVIDERS (recommended):
 * - VITE_FLIGHT_API_PROVIDERS: Comma-separated list, e.g., 'aviationstack,flightaware,flightradar24'
 * - VITE_FLIGHT_API_KEY_AVIATIONSTACK: API key for AviationStack
 * - VITE_FLIGHT_API_KEY_FLIGHTAWARE: API key for FlightAware
 * - VITE_FLIGHT_API_KEY_FLIGHTRADAR24: API key for FlightRadar24
 * 
 * The system will try providers in the order specified until one succeeds.
 * 
 * Debugging: Run debugFlightAPI() in browser console to diagnose API issues
 */

type FlightAPIProvider = 'aviationstack' | 'flightaware' | 'flightradar24';

/**
 * Load API key from local config file (for testing) or environment variables
 * 
 * ⚠️ SECURITY NOTE: 
 * - For production, ALWAYS use environment variables (VITE_FLIGHT_API_KEY)
 * - Local config file (apiKey.local.ts) is gitignored and only for local testing
 * - NEVER commit API keys to Git
 * 
 * Priority order:
 * 1. Local config file (src/config/apiKey.local.ts) - for testing only, gitignored
 * 2. Environment variable (VITE_FLIGHT_API_KEY) - recommended for production
 * 3. Default placeholder
 * 
 * To use local config for testing:
 * 1. The file src/config/apiKey.local.ts already exists (gitignored)
 * 2. Edit it and replace 'YOUR_API_KEY_HERE' with your actual API key
 * 3. The file won't be committed to Git
 */

// ⚠️ FOR LOCAL TESTING ONLY: You can uncomment and add your API key below
// This is ONLY for local development. For production, use environment variables!
// const HARDCODED_API_KEY = 'your_api_key_here'; // ⚠️ DO NOT COMMIT THIS!

// Get provider configuration - support both single and multiple providers
const getProviderConfig = (): {
  providers: FlightAPIProvider[];
  keys: Record<FlightAPIProvider, string | undefined>;
} => {
  // Check for multiple providers configuration (recommended method)
  const providersEnv = import.meta.env.VITE_FLIGHT_API_PROVIDERS;
  if (providersEnv) {
    const providerList = providersEnv
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => ['aviationstack', 'flightaware', 'flightradar24'].includes(p)) as FlightAPIProvider[];
    
    if (providerList.length === 0) {
      console.warn('VITE_FLIGHT_API_PROVIDERS is set but contains no valid providers. Falling back to single provider.');
    } else {
      const keys: Record<FlightAPIProvider, string | undefined> = {
        aviationstack: import.meta.env.VITE_FLIGHT_API_KEY_AVIATIONSTACK,
        flightaware: import.meta.env.VITE_FLIGHT_API_KEY_FLIGHTAWARE,
        flightradar24: import.meta.env.VITE_FLIGHT_API_KEY_FLIGHTRADAR24,
      };
      
      // Filter out providers without API keys
      const validProviders = providerList.filter(provider => {
        const key = keys[provider];
        return key && key !== 'YOUR_API_KEY' && key.trim().length > 0;
      });
      
      if (validProviders.length > 0) {
        console.log(`✅ Multi-provider mode: ${validProviders.length} provider(s) configured: ${validProviders.join(', ')}`);
        return { providers: validProviders, keys };
      } else {
        console.warn('⚠️ VITE_FLIGHT_API_PROVIDERS is set but no providers have valid API keys. Falling back to single provider.');
      }
    }
  }
  
  // Fallback to single provider configuration (legacy)
  const singleProvider = (
    import.meta.env.VITE_FLIGHT_API_PROVIDER || 
    'aviationstack'
  ) as FlightAPIProvider;
  
  const singleKey = import.meta.env.VITE_FLIGHT_API_KEY;
  const keys: Record<FlightAPIProvider, string | undefined> = {
    aviationstack: singleProvider === 'aviationstack' ? singleKey : undefined,
    flightaware: singleProvider === 'flightaware' ? singleKey : undefined,
    flightradar24: singleProvider === 'flightradar24' ? singleKey : undefined,
  };
  
  if (singleKey && singleKey !== 'YOUR_API_KEY' && singleKey.trim().length > 0) {
    console.log(`✅ Single-provider mode: ${singleProvider}`);
  } else {
    console.warn(`⚠️ Single-provider mode: ${singleProvider} (API key not configured)`);
  }
  
  return { providers: [singleProvider], keys };
};

const PROVIDER_CONFIG = getProviderConfig();

// API Configuration
interface APIConfig {
  url: string;
  paramName: string;
  flightParam: string;
  useHeaders?: boolean; // If true, API key goes in headers instead of query params
  dateParam?: string; // Optional date parameter name
}

const API_CONFIG: Record<FlightAPIProvider, APIConfig> = {
  aviationstack: {
    url: 'https://api.aviationstack.com/v1/flights',
    paramName: 'access_key',
    flightParam: 'flight_iata',
    dateParam: 'flight_date',
  },
  flightaware: {
    url: 'https://aeroapi.flightaware.com/aeroapi',
    paramName: 'x-apikey', // AeroAPI uses API key in header
    flightParam: 'ident', // Flight identifier is in URL path
    useHeaders: true, // AeroAPI requires header-based authentication
  },
  flightradar24: {
    url: 'https://api.flightradar24.com/common/v1',
    paramName: 'token',
    flightParam: 'flight',
  },
};

export interface FlightStatus {
  status: 'On Time' | 'Delayed' | 'Cancelled' | 'Landed' | 'Unknown';
  flightNumber: string;
  // Minimal data only - departure/arrival info removed to reduce API costs
}

/**
 * Parse AviationStack API response
 */
function parseAviationStackResponse(data: any, flightNumber: string): FlightStatus {
  if (!data.data || data.data.length === 0) {
    return { status: 'Unknown', flightNumber };
  }

  const flight = data.data[0];
  let status: FlightStatus['status'] = 'Unknown';
  const flightStatus = flight.flight_status?.toLowerCase();

  // Only extract status - minimal data parsing to reduce processing
  if (flightStatus === 'active' || flightStatus === 'scheduled') {
    status = (flight.departure?.delay || flight.arrival?.delay) ? 'Delayed' : 'On Time';
  } else if (flightStatus === 'landed') {
    status = 'Landed';
  } else if (flightStatus === 'delayed') {
    status = 'Delayed';
  } else if (flightStatus === 'cancelled') {
    status = 'Cancelled';
  }

  // Return minimal data - only status is needed
  return {
    status,
    flightNumber,
  };
}

/**
 * Parse FlightAware AeroAPI response
 * AeroAPI response format: { ident, fa_flight_id, actual_off, actual_on, scheduled_off, scheduled_on, ... }
 */
function parseFlightAwareResponse(data: any, flightNumber: string): FlightStatus {
  // AeroAPI returns flight data directly or in a flights array
  let flight = data;
  
  // If response has a flights array, use the first flight
  if (data.flights && Array.isArray(data.flights) && data.flights.length > 0) {
    flight = data.flights[0];
  }
  
  // If no flight data found
  if (!flight || !flight.ident) {
    return { status: 'Unknown', flightNumber };
  }

  let status: FlightStatus['status'] = 'Unknown';

  // AeroAPI status determination based on flight times
  // Check if flight has actual departure/arrival times
  const hasActualOff = !!flight.actual_off;
  const hasActualOn = !!flight.actual_on;
  const scheduledOff = flight.scheduled_off ? new Date(flight.scheduled_off) : null;
  const actualOff = flight.actual_off ? new Date(flight.actual_off) : null;
  
  // Determine status based on flight state
  if (hasActualOn) {
    status = 'Landed';
  } else if (hasActualOff) {
    // Flight has departed but not arrived - consider it "On Time" or "Delayed" based on departure time
    status = 'On Time'; // Will be updated below if delayed
  } else if (flight.cancelled) {
    status = 'Cancelled';
  } else if (scheduledOff && actualOff) {
    // Check if delayed (actual departure is significantly later than scheduled)
    const delayMinutes = (actualOff.getTime() - scheduledOff.getTime()) / (1000 * 60);
    if (delayMinutes > 15) {
      status = 'Delayed';
    } else {
      status = 'On Time';
    }
  } else if (scheduledOff) {
    // Flight is scheduled but hasn't departed yet
    const now = new Date();
    if (scheduledOff < now) {
      // Scheduled time has passed but no actual departure
      status = 'Delayed';
    } else {
      status = 'On Time';
    }
  }

  // Return minimal data - only status is needed
  return {
    status,
    flightNumber,
  };
}

/**
 * Parse FlightRadar24 API response
 */
function parseFlightRadar24Response(data: any, flightNumber: string): FlightStatus {
  // FlightRadar24 response structure
  // This is a placeholder - adjust based on actual FlightRadar24 API response
  if (!data.result || !data.result.response || !data.result.response.data) {
    return { status: 'Unknown', flightNumber };
  }

  const flight = data.result.response.data[0];
  let status: FlightStatus['status'] = 'Unknown';

  // Map FlightRadar24 status - only extract status
  const flightStatus = flight.status?.text?.toLowerCase();
  if (flightStatus?.includes('on time')) status = 'On Time';
  else if (flightStatus?.includes('delayed')) status = 'Delayed';
  else if (flightStatus?.includes('cancelled')) status = 'Cancelled';
  else if (flightStatus?.includes('landed') || flightStatus?.includes('arrived')) status = 'Landed';

  // Return minimal data - only status is needed
  return {
    status,
    flightNumber,
  };
}

/**
 * Format date for AviationStack API (YYYY-MM-DD)
 */
function formatDateForAPI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch flight status from a single provider
 */
async function fetchFromProvider(
  provider: FlightAPIProvider,
  apiKey: string,
  flightNumber: string,
  flightDate?: Date | string
): Promise<FlightStatus | null> {
  const config = API_CONFIG[provider];
  if (!config) {
    console.error(`Unknown API provider: ${provider}`);
    return null;
  }

  // Validate API key
  if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim().length === 0) {
    console.warn(`API key not configured for provider: ${provider}`);
    return null;
  }

  try {
    // Build API URL based on provider
    let apiUrl: string;
    if (provider === 'aviationstack') {
      // AviationStack supports date filtering with flight_date parameter
      const params = new URLSearchParams({
        [config.paramName]: apiKey,
        [config.flightParam]: flightNumber,
        limit: '1',
      });
      
      // Add date filter if provided (format: YYYY-MM-DD)
      if (flightDate) {
        const formattedDate = formatDateForAPI(flightDate);
        params.append('flight_date', formattedDate);
      }
      
      apiUrl = `${config.url}?${params.toString()}`;
    } else if (provider === 'flightaware') {
      // FlightAware AeroAPI uses header-based authentication
      // Endpoint: /flights/{ident} where ident is the flight number
      // Optionally add date filter: /flights/{ident}?start={date}
      let flightPath = `/flights/${encodeURIComponent(flightNumber)}`;
      
      // Add date filter if provided (AeroAPI uses 'start' parameter for date)
      if (flightDate) {
        const formattedDate = formatDateForAPI(flightDate);
        const params = new URLSearchParams({ start: formattedDate });
        flightPath += `?${params.toString()}`;
      }
      
      apiUrl = `${config.url}${flightPath}`;
    } else {
      // FlightRadar24 - Note: This API may require special access or different endpoint structure
      // The current implementation is a placeholder and may need adjustment based on actual API documentation
      // If you get 400 errors, FlightRadar24 may not be publicly available or requires different authentication
      apiUrl = `${config.url}/flight/list.json?${config.paramName}=${encodeURIComponent(apiKey)}&${config.flightParam}=${encodeURIComponent(flightNumber)}`;
      console.warn(`[${provider}] Note: FlightRadar24 API may require special access. If you get 400 errors, this provider may not be available.`);
    }

    console.log(`[${provider}] Fetching flight status for ${flightNumber}...`);

    // Build fetch options with headers if needed
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {},
    };

    // AeroAPI (FlightAware) requires API key in header
    if (provider === 'flightaware' && config.useHeaders) {
      fetchOptions.headers = {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      };
    }

    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        console.warn(`[${provider}] 401 Unauthorized - Invalid API key`);
        return null;
      }
      if (response.status === 400) {
        console.warn(`[${provider}] 400 Bad Request - Invalid API endpoint or parameters. This provider may not be available or requires different configuration.`);
        return null; // Will trigger fallback to next provider
      }
      if (response.status === 429) {
        console.warn(`[${provider}] 429 Too Many Requests - Rate limit exceeded`);
        return null; // Will trigger fallback to next provider
      }
      if (response.status === 403) {
        console.warn(`[${provider}] 403 Forbidden - API access denied or quota exceeded`);
        return null; // Will trigger fallback to next provider
      }
      // For other errors, log but don't throw - let it fallback to next provider
      console.warn(`[${provider}] API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.warn(`[${provider}] API error:`, data.error);
      // Check for authentication errors
      if (data.error.code === 104 || data.error.code === 101) {
        console.warn(`[${provider}] API Authentication Error - Invalid or missing API key`);
      }
      // Check for rate limit errors (common error codes)
      if (data.error.code === 429 || data.error.message?.toLowerCase().includes('rate limit') || 
          data.error.message?.toLowerCase().includes('quota') || 
          data.error.message?.toLowerCase().includes('limit exceeded')) {
        console.warn(`[${provider}] Rate limit or quota exceeded`);
      }
      return null;
    }

    // Parse response based on provider
    switch (provider) {
      case 'aviationstack':
        return parseAviationStackResponse(data, flightNumber);
      case 'flightaware':
        return parseFlightAwareResponse(data, flightNumber);
      case 'flightradar24':
        return parseFlightRadar24Response(data, flightNumber);
      default:
        return null;
    }
  } catch (error) {
    console.warn(`[${provider}] Error fetching flight status:`, error);
    return null;
  }
}

/**
 * Fetch flight status from the configured API provider(s) with automatic fallback
 * 
 * @param flightNumber - The flight number (e.g., "AA1234")
 * @param flightDate - Optional date for the flight (to get the correct flight for that day)
 */
export async function fetchFlightStatus(
  flightNumber: string, 
  flightDate?: Date | string
): Promise<FlightStatus> {
  // Clean flight number (remove spaces, convert to uppercase)
  const cleanFlightNumber = flightNumber.trim().toUpperCase();

  // Validate flight number format (2 letters followed by digits)
  const match = cleanFlightNumber.match(/^([A-Z]{2})(\d+)$/);
  if (!match) {
    console.warn(`Invalid flight number format: ${flightNumber}`);
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }

  // Try each provider in order until one succeeds
  const { providers, keys } = PROVIDER_CONFIG;
  
  if (providers.length === 0) {
    console.warn('No flight API providers configured');
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }

  console.log(`Trying ${providers.length} provider(s) in order: ${providers.join(', ')}`);

  for (const provider of providers) {
    const apiKey = keys[provider];
    
    if (!apiKey) {
      console.log(`[${provider}] Skipping - no API key configured`);
      continue;
    }

    const result = await fetchFromProvider(provider, apiKey, cleanFlightNumber, flightDate);
    
    if (result && result.status !== 'Unknown') {
      console.log(`[${provider}] ✅ Successfully retrieved flight status`);
      return result;
    }
    
    if (result && result.status === 'Unknown') {
      console.log(`[${provider}] ⚠️ Provider returned Unknown status, trying next provider...`);
      continue;
    }
    
    console.log(`[${provider}] ❌ Failed, trying next provider...`);
  }

  // All providers failed
  console.warn(`All ${providers.length} provider(s) failed to retrieve flight status for ${cleanFlightNumber}`);
  return { status: 'Unknown', flightNumber: cleanFlightNumber };
}

/**
 * Mock function for development/testing when API key is not available
 */
export function getMockFlightStatus(flightNumber: string): FlightStatus {
  // Simulate different statuses for testing
  const statuses: FlightStatus['status'][] = ['On Time', 'Delayed', 'Cancelled', 'Landed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    status: randomStatus,
    flightNumber: flightNumber.toUpperCase(),
  };
}

// Export debug function for easy access
export { debugFlightAPI } from './flightStatusDebug';
