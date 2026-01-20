/**
 * Airport Autocomplete Utility
 * Provides autocomplete functionality for airport names and codes
 */

export interface Airport {
  code: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  fullName: string; // e.g., "JFK - John F. Kennedy International Airport"
}

/**
 * Comprehensive list of major airports in the US and internationally
 * Focused on airports commonly used for transportation services
 */
const AIRPORTS: Airport[] = [
  // Major US Airports
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'USA', fullName: 'JFK - John F. Kennedy International Airport' },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', country: 'USA', fullName: 'LGA - LaGuardia Airport' },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', country: 'USA', fullName: 'EWR - Newark Liberty International Airport' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'USA', fullName: 'LAX - Los Angeles International Airport' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', state: 'IL', country: 'USA', fullName: "ORD - O'Hare International Airport" },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', country: 'USA', fullName: 'DFW - Dallas/Fort Worth International Airport' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', state: 'CO', country: 'USA', fullName: 'DEN - Denver International Airport' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', state: 'GA', country: 'USA', fullName: 'ATL - Hartsfield-Jackson Atlanta International Airport' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', country: 'USA', fullName: 'MIA - Miami International Airport' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', country: 'USA', fullName: 'SEA - Seattle-Tacoma International Airport' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'USA', fullName: 'SFO - San Francisco International Airport' },
  { code: 'LAS', name: 'McCarran International Airport', city: 'Las Vegas', state: 'NV', country: 'USA', fullName: 'LAS - McCarran International Airport' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', country: 'USA', fullName: 'PHX - Phoenix Sky Harbor International Airport' },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', state: 'TX', country: 'USA', fullName: 'IAH - George Bush Intercontinental Airport' },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', state: 'MA', country: 'USA', fullName: 'BOS - Logan International Airport' },
  { code: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', state: 'MI', country: 'USA', fullName: 'DTW - Detroit Metropolitan Airport' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', state: 'MN', country: 'USA', fullName: 'MSP - Minneapolis-Saint Paul International Airport' },
  { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', state: 'PA', country: 'USA', fullName: 'PHL - Philadelphia International Airport' },
  { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', state: 'NC', country: 'USA', fullName: 'CLT - Charlotte Douglas International Airport' },
  { code: 'BWI', name: 'Baltimore/Washington International Airport', city: 'Baltimore', state: 'MD', country: 'USA', fullName: 'BWI - Baltimore/Washington International Airport' },
  { code: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington', state: 'DC', country: 'USA', fullName: 'DCA - Ronald Reagan Washington National Airport' },
  { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington', state: 'DC', country: 'USA', fullName: 'IAD - Washington Dulles International Airport' },
  
  // New York State Airports (as mentioned in LocationManagement)
  { code: 'BUF', name: 'Buffalo Niagara International Airport', city: 'Buffalo', state: 'NY', country: 'USA', fullName: 'BUF - Buffalo Niagara International Airport' },
  { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport', city: 'Rochester', state: 'NY', country: 'USA', fullName: 'ROC - Frederick Douglass Greater Rochester International Airport' },
  { code: 'SYR', name: 'Syracuse Hancock International Airport', city: 'Syracuse', state: 'NY', country: 'USA', fullName: 'SYR - Syracuse Hancock International Airport' },
  { code: 'ALB', name: 'Albany International Airport', city: 'Albany', state: 'NY', country: 'USA', fullName: 'ALB - Albany International Airport' },
  
  // Additional Regional Airports
  { code: 'CLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', state: 'OH', country: 'USA', fullName: 'CLE - Cleveland Hopkins International Airport' },
  { code: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', state: 'PA', country: 'USA', fullName: 'PIT - Pittsburgh International Airport' },
  { code: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', state: 'IN', country: 'USA', fullName: 'IND - Indianapolis International Airport' },
  { code: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', state: 'OH', country: 'USA', fullName: 'CMH - John Glenn Columbus International Airport' },
  { code: 'CVG', name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', state: 'OH', country: 'USA', fullName: 'CVG - Cincinnati/Northern Kentucky International Airport' },
  { code: 'MKE', name: 'General Mitchell International Airport', city: 'Milwaukee', state: 'WI', country: 'USA', fullName: 'MKE - General Mitchell International Airport' },
  { code: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', state: 'LA', country: 'USA', fullName: 'MSY - Louis Armstrong New Orleans International Airport' },
  { code: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', state: 'TX', country: 'USA', fullName: 'AUS - Austin-Bergstrom International Airport' },
  { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', state: 'CA', country: 'USA', fullName: 'SAN - San Diego International Airport' },
  { code: 'PDX', name: 'Portland International Airport', city: 'Portland', state: 'OR', country: 'USA', fullName: 'PDX - Portland International Airport' },
  
  // Major International Airports
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', fullName: 'YYZ - Toronto Pearson International Airport' },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', fullName: 'YVR - Vancouver International Airport' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', fullName: 'LHR - London Heathrow Airport' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', fullName: 'CDG - Charles de Gaulle Airport' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', fullName: 'FRA - Frankfurt Airport' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', fullName: 'DXB - Dubai International Airport' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', fullName: 'NRT - Narita International Airport' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', fullName: 'HKG - Hong Kong International Airport' },
];

/**
 * Search airports by query string
 * Matches against airport code, name, city, or full name
 * @param query - Search query string
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching airports
 */
export function searchAirports(query: string, limit: number = 10): Airport[] {
  if (!query || query.trim().length === 0) {
    return AIRPORTS.slice(0, limit);
  }

  const normalizedQuery = query.trim().toUpperCase();
  
  // Score airports based on match quality
  const scoredAirports = AIRPORTS.map(airport => {
    let score = 0;
    
    // Exact code match gets highest score
    if (airport.code === normalizedQuery) {
      score = 1000;
    }
    // Code starts with query
    else if (airport.code.startsWith(normalizedQuery)) {
      score = 500;
    }
    // Code contains query
    else if (airport.code.includes(normalizedQuery)) {
      score = 300;
    }
    // Name starts with query
    else if (airport.name.toUpperCase().startsWith(normalizedQuery)) {
      score = 200;
    }
    // Name contains query
    else if (airport.name.toUpperCase().includes(normalizedQuery)) {
      score = 100;
    }
    // City starts with query
    else if (airport.city.toUpperCase().startsWith(normalizedQuery)) {
      score = 50;
    }
    // City contains query
    else if (airport.city.toUpperCase().includes(normalizedQuery)) {
      score = 25;
    }
    // Full name contains query
    else if (airport.fullName.toUpperCase().includes(normalizedQuery)) {
      score = 10;
    }
    
    return { airport, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(item => item.airport);

  return scoredAirports;
}

/**
 * Get airport by code
 * @param code - Airport IATA code (e.g., 'JFK')
 * @returns Airport object or undefined if not found
 */
export function getAirportByCode(code: string): Airport | undefined {
  const normalizedCode = code.trim().toUpperCase();
  return AIRPORTS.find(airport => airport.code === normalizedCode);
}

/**
 * Get all airports (for reference)
 * @returns Array of all airports
 */
export function getAllAirports(): Airport[] {
  return [...AIRPORTS];
}
