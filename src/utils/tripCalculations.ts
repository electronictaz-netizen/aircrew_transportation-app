/**
 * Trip Calculation Utilities
 * 
 * Provides functions for calculating trip durations, hours worked, and financial data
 * for payroll and billing verification.
 */

import type { Schema } from '../../amplify/data/resource';

/**
 * Calculate trip duration in hours
 * Returns null if trip is not completed or times are missing
 */
export function calculateTripDuration(trip: Schema['Trip']['type']): number | null {
  if (!trip.actualPickupTime || !trip.actualDropoffTime) {
    return null;
  }

  const pickupTime = new Date(trip.actualPickupTime).getTime();
  const dropoffTime = new Date(trip.actualDropoffTime).getTime();
  
  if (dropoffTime <= pickupTime) {
    return null; // Invalid times
  }

  const durationMs = dropoffTime - pickupTime;
  const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours
  
  return Math.round(durationHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate trip duration in minutes
 */
export function calculateTripDurationMinutes(trip: Schema['Trip']['type']): number | null {
  const hours = calculateTripDuration(trip);
  if (hours === null) return null;
  return Math.round(hours * 60);
}

/**
 * Format duration as HH:MM
 */
export function formatDuration(durationHours: number | null): string {
  if (durationHours === null) return 'N/A';
  
  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours - hours) * 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate driver pay for a trip
 * Uses driver pay rate (per trip or per hour) if available
 */
export function calculateDriverPay(
  trip: Schema['Trip']['type'],
  driver: Schema['Driver']['type'] | null
): number | null {
  // If trip has explicit driver pay amount, use that
  if (trip.driverPayAmount !== null && trip.driverPayAmount !== undefined) {
    return trip.driverPayAmount;
  }

  // If no driver, can't calculate pay
  if (!driver) {
    return null;
  }

  // If trip not completed, can't calculate pay
  if (trip.status !== 'Completed') {
    return null;
  }

  // Calculate based on pay rate per trip
  if (driver.payRatePerTrip !== null && driver.payRatePerTrip !== undefined) {
    return driver.payRatePerTrip;
  }

  // Calculate based on pay rate per hour
  if (driver.payRatePerHour !== null && driver.payRatePerHour !== undefined) {
    const durationHours = calculateTripDuration(trip);
    if (durationHours === null) {
      return null;
    }
    return Math.round(driver.payRatePerHour * durationHours * 100) / 100;
  }

  return null;
}

/**
 * Calculate total hours worked for a driver across multiple trips
 */
export function calculateTotalHoursWorked(
  trips: Array<Schema['Trip']['type']>
): number {
  let totalHours = 0;
  
  trips.forEach(trip => {
    if (trip.status === 'Completed') {
      const duration = calculateTripDuration(trip);
      if (duration !== null) {
        totalHours += duration;
      }
    }
  });
  
  return Math.round(totalHours * 100) / 100;
}

/**
 * Calculate total driver pay for multiple trips
 */
export function calculateTotalDriverPay(
  trips: Array<Schema['Trip']['type']>,
  drivers: Array<Schema['Driver']['type']>
): number {
  let totalPay = 0;
  
  trips.forEach(trip => {
    if (trip.driverId) {
      const driver = drivers.find(d => d.id === trip.driverId);
      const pay = calculateDriverPay(trip, driver || null);
      if (pay !== null) {
        totalPay += pay;
      }
    }
  });
  
  return Math.round(totalPay * 100) / 100;
}

/**
 * Calculate total trip revenue (sum of trip rates)
 */
export function calculateTotalRevenue(trips: Array<Schema['Trip']['type']>): number {
  let totalRevenue = 0;
  
  trips.forEach(trip => {
    if (trip.tripRate !== null && trip.tripRate !== undefined) {
      totalRevenue += trip.tripRate;
    }
  });
  
  return Math.round(totalRevenue * 100) / 100;
}

/**
 * Calculate profit margin (revenue - driver pay)
 */
export function calculateProfit(
  trips: Array<Schema['Trip']['type']>,
  drivers: Array<Schema['Driver']['type']>
): number {
  const revenue = calculateTotalRevenue(trips);
  const driverPay = calculateTotalDriverPay(trips, drivers);
  return Math.round((revenue - driverPay) * 100) / 100;
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
