/**
 * Booking portal helpers – no Amplify dependency.
 * Use this from BookingPortal to avoid "Amplify has not been configured" when
 * the portal loads before or without the main app's Amplify.configure().
 */

export function getBookingCodeFromURL(): string | null {
  const pathMatch = window.location.pathname.match(/^\/booking\/([^/]+)/);
  if (pathMatch) return pathMatch[1].toUpperCase();
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  return code ? code.toUpperCase() : null;
}

export interface PricingRequest {
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType?: string;
  numberOfPassengers: number;
  tripType: 'one-way' | 'round-trip';
  pickupDate: Date;
}

export interface PricingResult {
  basePrice: number;
  vehicleSurcharge: number;
  passengerSurcharge?: number;
  roundTripDiscount: number;
  totalPrice: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
}

/**
 * Pricing settings configuration for a company
 */
export interface BookingPricingSettings {
  // Base pricing
  basePricePerMile: number;
  estimatedMiles: number; // Default estimated miles if distance calculation is not available
  minimumPrice: number; // Minimum charge regardless of distance
  
  // Vehicle surcharges
  vehicleSurcharges: {
    SUV?: number;
    Limo?: number;
    Van?: number;
    Sedan?: number;
    [key: string]: number | undefined; // Allow custom vehicle types
  };
  
  // Discounts
  roundTripDiscountPercent: number; // Percentage discount for round trips (0-100)
  
  // Additional fees
  passengerSurcharge?: number; // Additional charge per passenger over base capacity
  basePassengerCapacity?: number; // Number of passengers included in base price (default: 1)
}

/**
 * Default pricing settings (used as fallback)
 */
export const DEFAULT_PRICING_SETTINGS: BookingPricingSettings = {
  basePricePerMile: 2.5,
  estimatedMiles: 15,
  minimumPrice: 25.0,
  vehicleSurcharges: {
    SUV: 20,
    Limo: 50,
    Van: 30,
    Sedan: 0,
  },
  roundTripDiscountPercent: 10,
  passengerSurcharge: 5,
  basePassengerCapacity: 1,
};

/**
 * Parse bookingSettings JSON string into PricingSettings
 */
export function parsePricingSettings(bookingSettingsJson: string | null | undefined): BookingPricingSettings | null {
  if (!bookingSettingsJson) return null;
  
  try {
    const parsed = JSON.parse(bookingSettingsJson);
    // Validate that it has pricing settings
    if (parsed.pricing) {
      return parsed.pricing as BookingPricingSettings;
    }
    // If the JSON is just the pricing object directly (backward compatibility)
    if (parsed.basePricePerMile !== undefined) {
      return parsed as BookingPricingSettings;
    }
    return null;
  } catch (error) {
    console.error('Error parsing pricing settings:', error);
    return null;
  }
}

/**
 * Calculate price based on request and optional company pricing settings
 */
export function calculatePrice(
  request: PricingRequest,
  pricingSettings?: BookingPricingSettings | null
): PricingResult {
  const settings = pricingSettings || DEFAULT_PRICING_SETTINGS;
  
  // Calculate base price
  const estimatedMiles = settings.estimatedMiles || 15;
  const basePricePerMile = settings.basePricePerMile || 2.5;
  let basePrice = estimatedMiles * basePricePerMile;
  
  // Apply minimum price
  const minimumPrice = settings.minimumPrice || 0;
  if (basePrice < minimumPrice) {
    basePrice = minimumPrice;
  }
  
  // Calculate vehicle surcharge
  let vehicleSurcharge = 0;
  if (request.vehicleType && settings.vehicleSurcharges) {
    vehicleSurcharge = settings.vehicleSurcharges[request.vehicleType] || 0;
  }
  
  // Calculate passenger surcharge
  let passengerSurcharge = 0;
  if (settings.passengerSurcharge && settings.basePassengerCapacity !== undefined) {
    const extraPassengers = Math.max(0, request.numberOfPassengers - settings.basePassengerCapacity);
    passengerSurcharge = extraPassengers * settings.passengerSurcharge;
  }
  
  // Calculate round trip discount
  let roundTripDiscount = 0;
  if (request.tripType === 'round-trip' && settings.roundTripDiscountPercent) {
    const discountPercent = Math.min(100, Math.max(0, settings.roundTripDiscountPercent)) / 100;
    roundTripDiscount = basePrice * discountPercent;
  }
  
  const totalPrice = Math.round((basePrice + vehicleSurcharge + passengerSurcharge - roundTripDiscount) * 100) / 100;
  
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    vehicleSurcharge: Math.round(vehicleSurcharge * 100) / 100,
    passengerSurcharge: passengerSurcharge > 0 ? Math.round(passengerSurcharge * 100) / 100 : undefined,
    roundTripDiscount: Math.round(roundTripDiscount * 100) / 100,
    totalPrice,
    estimatedDistance: estimatedMiles,
    estimatedDuration: estimatedMiles * 2, // Rough estimate: 2 minutes per mile
  };
}
