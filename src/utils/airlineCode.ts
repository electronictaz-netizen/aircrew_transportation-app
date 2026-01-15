/**
 * Utility functions for extracting airline codes from flight numbers
 */

/**
 * Extract airline code from flight number
 * Flight numbers are typically 2-3 letters followed by digits (e.g., AA1234, UAL123)
 * 
 * @param flightNumber - The flight number (e.g., "AA1234", "UAL123", "DL456")
 * @returns The airline code (e.g., "AA", "UAL", "DL") or "Unknown" if pattern doesn't match
 */
export function extractAirlineCode(flightNumber: string | null | undefined): string {
  if (!flightNumber) return 'Unknown';
  
  const trimmed = flightNumber.trim().toUpperCase();
  
  // Match 2-3 letters at the start of the string
  const match = trimmed.match(/^([A-Z]{2,3})/);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // If no match, check if it's a standard trip identifier (non-airport trip)
  // Standard trips might not have airline codes
  if (trimmed.length > 0 && !/^[A-Z]{2,3}\d/.test(trimmed)) {
    return 'Standard Trip';
  }
  
  return 'Unknown';
}

/**
 * Get airline name from airline code (common airline codes)
 * This is a basic mapping - can be extended with a full database
 */
export function getAirlineName(code: string): string {
  const airlineMap: Record<string, string> = {
    'AA': 'American Airlines',
    'UA': 'United Airlines',
    'UAL': 'United Airlines',
    'DL': 'Delta Air Lines',
    'SW': 'Southwest Airlines',
    'WN': 'Southwest Airlines',
    'AS': 'Alaska Airlines',
    'B6': 'JetBlue Airways',
    'F9': 'Frontier Airlines',
    'NK': 'Spirit Airlines',
    'SY': 'Sun Country Airlines',
    'G4': 'Allegiant Air',
    'YX': 'Republic Airways',
    'MQ': 'Envoy Air',
    'OH': 'PSA Airlines',
    '9E': 'Endeavor Air',
    'YV': 'Mesa Airlines',
    'OO': 'SkyWest Airlines',
    'EV': 'ExpressJet',
    '9K': 'Cape Air',
    'CP': 'Compass Airlines',
    'ZW': 'Air Wisconsin',
    'Standard Trip': 'Standard Trip',
    'Unknown': 'Unknown Airline',
  };
  
  return airlineMap[code.toUpperCase()] || code;
}

/**
 * Group trips by airline code
 */
export function groupTripsByAirline<T extends { flightNumber: string | null | undefined }>(
  trips: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  trips.forEach(trip => {
    const airlineCode = extractAirlineCode(trip.flightNumber);
    if (!grouped.has(airlineCode)) {
      grouped.set(airlineCode, []);
    }
    grouped.get(airlineCode)!.push(trip);
  });
  
  return grouped;
}
