import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns';

const client = generateClient<Schema>();

interface RecurringJobConfig {
  tripData: any;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string;
}

/**
 * Generate recurring trips based on the pattern
 */
export async function generateRecurringTrips(config: RecurringJobConfig): Promise<void> {
  if (!config.isRecurring || !config.recurringPattern || !config.recurringEndDate) {
    return;
  }

  const { tripData, recurringPattern, recurringEndDate } = config;
  const startDate = parseISO(tripData.pickupDate);
  const endDate = parseISO(recurringEndDate);
  
  if (isBefore(endDate, startDate)) {
    console.warn('Recurring end date is before start date');
    return;
  }

  // Create the parent trip first
  const parentTrip = await client.models.Trip.create({
    ...tripData,
    isRecurring: true,
    recurringPattern,
    recurringEndDate,
    status: tripData.status || 'Unassigned',
  });

  if (!parentTrip.data) {
    console.error('Failed to create parent trip');
    return;
  }

  const parentTripId = parentTrip.data.id;
  const tripsToCreate: any[] = [];
  let currentDate = startDate;

  // Generate trips up to the end date (skip first date as it's the parent)
  while (true) {
    // Calculate next occurrence based on pattern
    let nextDate: Date;
    switch (recurringPattern) {
      case 'daily':
        nextDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        nextDate = addMonths(currentDate, 1);
        break;
      default:
        return;
    }

    // If next date is before or equal to end date, create the trip
    if (isBefore(nextDate, endDate) || nextDate.getTime() === endDate.getTime()) {
      tripsToCreate.push({
        ...tripData,
        pickupDate: nextDate.toISOString(),
        isRecurring: false, // Child trips are not recurring themselves
        parentTripId,
        status: tripData.status || 'Unassigned',
      });
      currentDate = nextDate;
    } else {
      break;
    }
  }

  // Create all child trips
  for (const trip of tripsToCreate) {
    try {
      await client.models.Trip.create(trip);
    } catch (error) {
      console.error('Error creating recurring trip:', error);
    }
  }
}

/**
 * Check and generate upcoming recurring trips (call this periodically)
 */
export async function generateUpcomingRecurringTrips(): Promise<void> {
  try {
    // Get all active recurring trips
    const { data: recurringTrips } = await client.models.Trip.list({
      filter: { isRecurring: { eq: true } },
    });

    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);

    for (const trip of recurringTrips || []) {
      if (!trip.recurringEndDate || !trip.recurringPattern) continue;

      const endDate = parseISO(trip.recurringEndDate);
      if (isBefore(endDate, now)) continue; // Recurring period has ended

      // Get existing child trips to see what's already been created
      const { data: childTrips } = await client.models.Trip.list({
        filter: { parentTripId: { eq: trip.id } },
      });

      const lastChildDate = childTrips && childTrips.length > 0
        ? childTrips
            .map((t) => t.pickupDate ? parseISO(t.pickupDate) : null)
            .filter((d): d is Date => d !== null)
            .sort((a, b) => b.getTime() - a.getTime())[0]
        : parseISO(trip.pickupDate);

      if (!lastChildDate) continue;

      // Generate trips up to 2 weeks ahead
      let currentDate = lastChildDate;
      const tripsToCreate: any[] = [];

      while (isBefore(currentDate, twoWeeksFromNow) && isBefore(currentDate, endDate)) {
        let nextDate: Date | null = null;
        switch (trip.recurringPattern) {
          case 'daily':
            nextDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(currentDate, 1);
            break;
          case 'monthly':
            nextDate = addMonths(currentDate, 1);
            break;
          default:
            break;
        }

        if (nextDate && (isBefore(nextDate, endDate) || nextDate.getTime() === endDate.getTime())) {
          tripsToCreate.push({
            pickupDate: nextDate.toISOString(),
            flightNumber: trip.flightNumber,
            pickupLocation: trip.pickupLocation,
            dropoffLocation: trip.dropoffLocation,
            numberOfPassengers: trip.numberOfPassengers,
            driverId: trip.driverId,
            isRecurring: false,
            parentTripId: trip.id,
            status: trip.driverId ? 'Assigned' : 'Unassigned',
          });
          currentDate = nextDate;
        } else {
          break;
        }
      }

      // Create the trips
      for (const tripData of tripsToCreate) {
        try {
          await client.models.Trip.create(tripData);
        } catch (error) {
          console.error('Error creating upcoming recurring trip:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error generating upcoming recurring trips:', error);
  }
}
