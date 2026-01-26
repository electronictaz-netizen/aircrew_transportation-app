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
  roundTripDiscount: number;
  totalPrice: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
}

export function calculatePrice(request: PricingRequest): PricingResult {
  const basePricePerMile = 2.5;
  const estimatedMiles = 15;
  const basePrice = estimatedMiles * basePricePerMile;

  let vehicleSurcharge = 0;
  if (request.vehicleType === 'SUV') vehicleSurcharge = 20;
  else if (request.vehicleType === 'Limo') vehicleSurcharge = 50;
  else if (request.vehicleType === 'Van') vehicleSurcharge = 30;

  let roundTripDiscount = 0;
  if (request.tripType === 'round-trip') roundTripDiscount = basePrice * 0.1;

  return {
    basePrice,
    vehicleSurcharge,
    roundTripDiscount,
    totalPrice: Math.round((basePrice + vehicleSurcharge - roundTripDiscount) * 100) / 100,
    estimatedDistance: estimatedMiles,
    estimatedDuration: estimatedMiles * 2,
  };
}
