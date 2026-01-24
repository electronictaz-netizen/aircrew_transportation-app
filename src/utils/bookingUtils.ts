/**
 * Booking Portal Utilities
 * Helper functions for the customer booking portal
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Get company by booking code
 */
export async function getCompanyByBookingCode(code: string): Promise<Schema['Company']['type'] | null> {
  try {
    const { data: companies } = await client.models.Company.list({
      filter: {
        bookingCode: { eq: code },
        isActive: { eq: true },
        bookingEnabled: { eq: true },
      },
    });

    if (!companies || companies.length === 0) {
      return null;
    }

    return companies[0] as Schema['Company']['type'];
  } catch (error) {
    console.error('Error loading company by booking code:', error);
    return null;
  }
}

/**
 * Extract booking code from URL
 * Supports: /booking/CODE or /booking?code=CODE
 */
export function getBookingCodeFromURL(): string | null {
  // Check path parameter first: /booking/CODE
  const pathMatch = window.location.pathname.match(/^\/booking\/([^/]+)/);
  if (pathMatch) {
    return pathMatch[1].toUpperCase();
  }

  // Check query parameter: /booking?code=CODE
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  if (code) {
    return code.toUpperCase();
  }

  return null;
}

/**
 * Calculate estimated price for a trip
 * This is a basic implementation - can be enhanced with distance calculation, vehicle types, etc.
 */
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
  estimatedDistance?: number; // in miles
  estimatedDuration?: number; // in minutes
}

export function calculatePrice(request: PricingRequest): PricingResult {
  // Basic pricing calculation
  // In a real implementation, you'd:
  // 1. Calculate distance using Google Maps API or similar
  // 2. Apply company-specific pricing rules
  // 3. Consider time of day, vehicle type, etc.

  const basePricePerMile = 2.50; // $2.50 per mile (example)
  const estimatedMiles = 15; // Placeholder - would calculate from locations
  const basePrice = estimatedMiles * basePricePerMile;

  // Vehicle type surcharges (example)
  let vehicleSurcharge = 0;
  if (request.vehicleType === 'SUV') {
    vehicleSurcharge = 20;
  } else if (request.vehicleType === 'Limo') {
    vehicleSurcharge = 50;
  } else if (request.vehicleType === 'Van') {
    vehicleSurcharge = 30;
  }

  // Round trip discount (example: 10% off return trip)
  let roundTripDiscount = 0;
  if (request.tripType === 'round-trip') {
    roundTripDiscount = basePrice * 0.1;
  }

  const totalPrice = basePrice + vehicleSurcharge - roundTripDiscount;

  return {
    basePrice,
    vehicleSurcharge,
    roundTripDiscount,
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimals
    estimatedDistance: estimatedMiles,
    estimatedDuration: estimatedMiles * 2, // Rough estimate: 2 minutes per mile
  };
}

/**
 * Validate booking code format
 */
export function isValidBookingCode(code: string): boolean {
  // Allow alphanumeric codes, 3-20 characters
  return /^[A-Z0-9]{3,20}$/i.test(code);
}

/**
 * Generate a unique booking code for a company
 * Format: First 3 letters of company name + random 3 digits
 */
export function generateBookingCode(companyName: string): string {
  const prefix = companyName
    .replace(/[^A-Z0-9]/gi, '')
    .substring(0, 3)
    .toUpperCase();
  
  const randomDigits = Math.floor(100 + Math.random() * 900); // 100-999
  
  return `${prefix}${randomDigits}`;
}
