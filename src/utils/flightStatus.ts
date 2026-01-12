/**
 * Flight Status Service Utility
 * 
 * This utility integrates with flight status APIs to get real-time flight information.
 * 
 * Supported APIs:
 * - AviationStack (https://aviationstack.com/) - Default
 * - FlightAware (https://flightaware.com/commercial/flightxml/)
 * - FlightRadar24 (https://www.flightradar24.com/)
 * 
 * Configuration via environment variables:
 * - VITE_FLIGHT_API_PROVIDER: 'aviationstack' | 'flightaware' | 'flightradar24'
 * - VITE_FLIGHT_API_KEY: Your API key for the selected provider
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

// Use hardcoded key if set (testing only), otherwise use environment variables
const API_PROVIDER = (
  import.meta.env.VITE_FLIGHT_API_PROVIDER || 
  'aviationstack'
) as FlightAPIProvider;

const API_KEY = (
  // Uncomment the line below and add your key for local testing:
  // HARDCODED_API_KEY ||
  import.meta.env.VITE_FLIGHT_API_KEY || 
  'YOUR_API_KEY'
);

// API Configuration
const API_CONFIG = {
  aviationstack: {
    url: 'https://api.aviationstack.com/v1/flights',
    paramName: 'access_key',
    flightParam: 'flight_iata',
  },
  flightaware: {
    url: 'https://flightxml.flightaware.com/json/FlightXML2',
    paramName: 'username', // FlightAware uses username/password
    flightParam: 'ident',
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
  departure?: {
    airport?: string;
    scheduled?: string;
    estimated?: string;
  };
  arrival?: {
    airport?: string;
    scheduled?: string;
    estimated?: string;
  };
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

  if (flightStatus === 'active' || flightStatus === 'scheduled') {
    status = (flight.departure?.delay || flight.arrival?.delay) ? 'Delayed' : 'On Time';
  } else if (flightStatus === 'landed') {
    status = 'Landed';
  } else if (flightStatus === 'delayed') {
    status = 'Delayed';
  } else if (flightStatus === 'cancelled') {
    status = 'Cancelled';
  }

  return {
    status,
    flightNumber,
    departure: {
      airport: flight.departure?.airport || flight.departure?.iata,
      scheduled: flight.departure?.scheduled,
      estimated: flight.departure?.estimated,
    },
    arrival: {
      airport: flight.arrival?.airport || flight.arrival?.iata,
      scheduled: flight.arrival?.scheduled,
      estimated: flight.arrival?.estimated,
    },
  };
}

/**
 * Parse FlightAware API response
 */
function parseFlightAwareResponse(data: any, flightNumber: string): FlightStatus {
  // FlightAware response structure is different
  // This is a placeholder - adjust based on actual FlightAware API response
  if (!data.FlightInfoResult || !data.FlightInfoResult.flights) {
    return { status: 'Unknown', flightNumber };
  }

  const flight = data.FlightInfoResult.flights[0];
  let status: FlightStatus['status'] = 'Unknown';

  // Map FlightAware status codes
  if (flight.status === 'On Time') status = 'On Time';
  else if (flight.status === 'Delayed') status = 'Delayed';
  else if (flight.status === 'Cancelled') status = 'Cancelled';
  else if (flight.status === 'Arrived') status = 'Landed';

  return {
    status,
    flightNumber,
    departure: {
      airport: flight.origin,
      scheduled: flight.filed_departuretime,
      estimated: flight.estimateddeparturetime,
    },
    arrival: {
      airport: flight.destination,
      scheduled: flight.filed_arrivaltime,
      estimated: flight.estimatedarrivaltime,
    },
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

  // Map FlightRadar24 status
  const flightStatus = flight.status?.text?.toLowerCase();
  if (flightStatus?.includes('on time')) status = 'On Time';
  else if (flightStatus?.includes('delayed')) status = 'Delayed';
  else if (flightStatus?.includes('cancelled')) status = 'Cancelled';
  else if (flightStatus?.includes('landed') || flightStatus?.includes('arrived')) status = 'Landed';

  return {
    status,
    flightNumber,
    departure: {
      airport: flight.airport?.origin?.name,
      scheduled: flight.time?.scheduled?.departure,
      estimated: flight.time?.estimated?.departure,
    },
    arrival: {
      airport: flight.airport?.destination?.name,
      scheduled: flight.time?.scheduled?.arrival,
      estimated: flight.time?.estimated?.arrival,
    },
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
 * Fetch flight status from the configured API provider
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

  const config = API_CONFIG[API_PROVIDER];
  if (!config) {
    console.error(`Unknown API provider: ${API_PROVIDER}`);
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }

  // Check if API key is configured
  if (!API_KEY || API_KEY === 'YOUR_API_KEY' || API_KEY.trim().length === 0) {
    console.warn('Flight API key not configured. Set VITE_FLIGHT_API_KEY in your environment variables.');
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }

  try {
    // Build API URL based on provider
    let apiUrl: string;
    if (API_PROVIDER === 'aviationstack') {
      // AviationStack supports date filtering with flight_date parameter
      const params = new URLSearchParams({
        [config.paramName]: API_KEY,
        [config.flightParam]: cleanFlightNumber,
        limit: '1',
      });
      
      // Add date filter if provided (format: YYYY-MM-DD)
      if (flightDate) {
        const formattedDate = formatDateForAPI(flightDate);
        params.append('flight_date', formattedDate);
        console.log(`Fetching flight status for ${cleanFlightNumber} on ${formattedDate}`);
      } else {
        console.log(`Fetching flight status for ${cleanFlightNumber} (no date filter)`);
      }
      
      apiUrl = `${config.url}?${params.toString()}`;
    } else if (API_PROVIDER === 'flightaware') {
      // FlightAware requires different authentication (username/password or token)
      apiUrl = `${config.url}/FlightInfo?${config.paramName}=${encodeURIComponent(API_KEY)}&${config.flightParam}=${encodeURIComponent(cleanFlightNumber)}`;
    } else {
      // FlightRadar24
      apiUrl = `${config.url}/flight/list.json?${config.paramName}=${encodeURIComponent(API_KEY)}&${config.flightParam}=${encodeURIComponent(cleanFlightNumber)}`;
    }

    console.log('Fetching flight status from:', API_PROVIDER, 'for flight:', cleanFlightNumber);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Handle 401 specifically
      if (response.status === 401) {
        console.error('Flight API 401 Unauthorized - Check your API key:', {
          provider: API_PROVIDER,
          apiKeyConfigured: API_KEY ? 'Yes' : 'No',
          apiKeyPreview: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Not set',
        });
        return { 
          status: 'Unknown', 
          flightNumber: cleanFlightNumber 
        };
      }
      throw new Error(`Flight API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Flight API error:', data.error);
      // Check for authentication errors
      if (data.error.code === 104 || data.error.code === 101) {
        console.error('API Authentication Error - Invalid or missing API key');
      }
      return { status: 'Unknown', flightNumber: cleanFlightNumber };
    }

    // Parse response based on provider
    switch (API_PROVIDER) {
      case 'aviationstack':
        return parseAviationStackResponse(data, cleanFlightNumber);
      case 'flightaware':
        return parseFlightAwareResponse(data, cleanFlightNumber);
      case 'flightradar24':
        return parseFlightRadar24Response(data, cleanFlightNumber);
      default:
        return { status: 'Unknown', flightNumber: cleanFlightNumber };
    }
  } catch (error) {
    console.error('Error fetching flight status:', error);
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }
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
