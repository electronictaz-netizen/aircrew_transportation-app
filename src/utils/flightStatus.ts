/**
 * Flight Status Service Utility
 * 
 * This utility integrates with flight status APIs to get real-time flight information.
 * 
 * Supported APIs:
 * - AviationStack (https://aviationstack.com/)
 * - Alternative: FlightAware, FlightRadar24, etc.
 * 
 * To use AviationStack:
 * 1. Sign up at https://aviationstack.com/
 * 2. Get your API key
 * 3. Add it to your environment variables or Amplify environment configuration
 */

const FLIGHT_API_KEY = import.meta.env.VITE_FLIGHT_API_KEY || 'YOUR_API_KEY';
const FLIGHT_API_URL = 'https://api.aviationstack.com/v1/flights';

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

export async function fetchFlightStatus(flightNumber: string): Promise<FlightStatus> {
  // Clean flight number (remove spaces, convert to uppercase)
  const cleanFlightNumber = flightNumber.trim().toUpperCase();
  
  // Extract airline code and flight number
  const match = cleanFlightNumber.match(/^([A-Z]{2})(\d+)$/);
  if (!match) {
    console.warn(`Invalid flight number format: ${flightNumber}`);
    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  }

  const [, airlineCode, flightNum] = match;
  
  try {
    const response = await fetch(
      `${FLIGHT_API_URL}?access_key=${FLIGHT_API_KEY}&flight_iata=${cleanFlightNumber}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Flight API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Flight API error:', data.error);
      return { status: 'Unknown', flightNumber: cleanFlightNumber };
    }

    if (data.data && data.data.length > 0) {
      const flight = data.data[0];
      
      let status: FlightStatus['status'] = 'Unknown';
      const flightStatus = flight.flight_status?.toLowerCase();
      
      if (flightStatus === 'active' || flightStatus === 'scheduled') {
        // Check if delayed
        if (flight.departure?.delay || flight.arrival?.delay) {
          status = 'Delayed';
        } else {
          status = 'On Time';
        }
      } else if (flightStatus === 'landed') {
        status = 'Landed';
      } else if (flightStatus === 'delayed') {
        status = 'Delayed';
      } else if (flightStatus === 'cancelled') {
        status = 'Cancelled';
      }

      return {
        status,
        flightNumber: cleanFlightNumber,
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

    return { status: 'Unknown', flightNumber: cleanFlightNumber };
  } catch (error) {
    console.error('Error fetching flight status:', error);
    // Return a mock status for development/testing
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
