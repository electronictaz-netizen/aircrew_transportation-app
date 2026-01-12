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
 */

type FlightAPIProvider = 'aviationstack' | 'flightaware' | 'flightradar24';

const API_PROVIDER = (import.meta.env.VITE_FLIGHT_API_PROVIDER || 'aviationstack') as FlightAPIProvider;
const API_KEY = import.meta.env.VITE_FLIGHT_API_KEY || 'YOUR_API_KEY';

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
 * Fetch flight status from the configured API provider
 */
export async function fetchFlightStatus(flightNumber: string): Promise<FlightStatus> {
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

  try {
    // Build API URL based on provider
    let apiUrl: string;
    if (API_PROVIDER === 'aviationstack') {
      apiUrl = `${config.url}?${config.paramName}=${API_KEY}&${config.flightParam}=${cleanFlightNumber}&limit=1`;
    } else if (API_PROVIDER === 'flightaware') {
      // FlightAware requires different authentication (username/password or token)
      apiUrl = `${config.url}/FlightInfo?${config.paramName}=${API_KEY}&${config.flightParam}=${cleanFlightNumber}`;
    } else {
      // FlightRadar24
      apiUrl = `${config.url}/flight/list.json?${config.paramName}=${API_KEY}&${config.flightParam}=${cleanFlightNumber}`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Flight API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Flight API error:', data.error);
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
