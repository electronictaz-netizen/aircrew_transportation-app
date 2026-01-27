/**
 * SMS Message Templates
 * 
 * Reusable templates for different SMS notification types.
 * All templates should be concise (SMS has 160 character limit per message part).
 */

import type { Schema } from '../../amplify/data/resource';

/**
 * Format date for SMS (compact format)
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time for SMS
 */
function formatTime(date: string | Date | null | undefined): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SMS_TEMPLATES = {
  /**
   * Driver assignment notification
   */
  DRIVER_ASSIGNMENT: (trip: Schema['Trip']['type']): string => {
    const date = formatDate(trip.pickupDate);
    return `New trip: ${trip.flightNumber || 'Trip'} on ${date}. Pickup: ${trip.pickupLocation}. Reply STOP to opt out.`;
  },

  /**
   * Driver reassignment notification
   */
  DRIVER_REASSIGNMENT: (trip: Schema['Trip']['type']): string => {
    const date = formatDate(trip.pickupDate);
    return `Trip reassigned: ${trip.flightNumber || 'Trip'} on ${date}. Pickup: ${trip.pickupLocation}.`;
  },

  /**
   * Driver unassignment notification
   */
  DRIVER_UNASSIGNMENT: (trip: Schema['Trip']['type']): string => {
    return `You've been unassigned from trip ${trip.flightNumber || 'Trip'}. Contact management with questions.`;
  },

  /**
   * Booking confirmation (initial)
   */
  BOOKING_CONFIRMATION: (booking: {
    pickupDate: string;
    pickupLocation: string;
    dropoffLocation: string;
    flightNumber?: string;
    companyName?: string;
  }): string => {
    const date = formatDate(booking.pickupDate);
    const company = booking.companyName ? `${booking.companyName} - ` : '';
    return `${company}Booking received! Trip on ${date} from ${booking.pickupLocation} to ${booking.dropoffLocation}. We'll confirm shortly.`;
  },

  /**
   * Booking accepted by manager
   */
  BOOKING_ACCEPTED: (booking: {
    pickupDate: string;
    pickupLocation: string;
    dropoffLocation: string;
    flightNumber?: string;
    companyName?: string;
  }): string => {
    const date = formatDate(booking.pickupDate);
    const time = formatTime(booking.pickupDate);
    return `Booking confirmed! Trip on ${date} at ${time}. Pickup: ${booking.pickupLocation}. We'll send driver details soon.`;
  },

  /**
   * Trip reminder (24 hours before)
   */
  TRIP_REMINDER_24H: (trip: Schema['Trip']['type']): string => {
    const time = formatTime(trip.pickupDate);
    return `Reminder: Trip ${trip.flightNumber || 'Trip'} is tomorrow at ${time}. Pickup: ${trip.pickupLocation}.`;
  },

  /**
   * Trip reminder (1 hour before)
   */
  TRIP_REMINDER_1H: (trip: Schema['Trip']['type']): string => {
    return `Trip ${trip.flightNumber || 'Trip'} is in 1 hour. Driver will arrive at ${trip.pickupLocation}.`;
  },

  /**
   * Driver en route notification
   */
  DRIVER_EN_ROUTE: (trip: Schema['Trip']['type'], driverName?: string): string => {
    const driver = driverName ? `${driverName} is ` : 'Driver is ';
    return `${driver}en route to ${trip.pickupLocation} for trip ${trip.flightNumber || 'Trip'}. ETA: 10-15 min.`;
  },

  /**
   * Driver arrived notification
   */
  DRIVER_ARRIVED: (trip: Schema['Trip']['type'], driverName?: string): string => {
    const driver = driverName || 'Driver';
    return `${driver} has arrived at ${trip.pickupLocation} for trip ${trip.flightNumber || 'Trip'}.`;
  },

  /**
   * Trip completed notification
   */
  TRIP_COMPLETED: (trip: Schema['Trip']['type']): string => {
    return `Trip ${trip.flightNumber || 'Trip'} completed. Thank you for choosing our service!`;
  },

  /**
   * Opt-out confirmation
   */
  OPT_OUT_CONFIRMATION: (): string => {
    return 'You have been unsubscribed from SMS notifications. Reply START to resubscribe.';
  },

  /**
   * Opt-in confirmation
   */
  OPT_IN_CONFIRMATION: (): string => {
    return 'You have been subscribed to SMS notifications. Reply STOP to unsubscribe at any time.';
  },

  /**
   * Payment receipt (if implemented)
   */
  PAYMENT_RECEIPT: (amount: number, tripId: string): string => {
    return `Payment received: $${amount.toFixed(2)} for trip ${tripId}. Thank you!`;
  },
};
