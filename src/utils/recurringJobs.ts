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
export async function generateRecurringTrips(config: RecurringJobConfig): Promise<{ parentId: string; childCount: number } | void> {
  console.log('=== generateRecurringTrips START ===');
  console.log('Config received:', {
    isRecurring: config.isRecurring,
    recurringPattern: config.recurringPattern,
    recurringEndDate: config.recurringEndDate,
    tripDataKeys: Object.keys(config.tripData || {}),
  });
  
  if (!config.isRecurring || !config.recurringPattern || !config.recurringEndDate) {
    console.error('❌ Missing required recurring job parameters:', {
      isRecurring: config.isRecurring,
      recurringPattern: config.recurringPattern,
      recurringEndDate: config.recurringEndDate,
    });
    return; // Return void if parameters missing
  }

  const { tripData, recurringPattern, recurringEndDate } = config;
  const startDate = parseISO(tripData.pickupDate);
  const endDate = parseISO(recurringEndDate);
  
  console.log('Date range:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    pattern: recurringPattern,
  });
  
  if (isBefore(endDate, startDate)) {
    console.error('Recurring end date is before start date');
    return;
  }

  // Prepare parent trip data
  const parentTripData = {
    ...tripData,
    isRecurring: true,
    recurringPattern,
    recurringEndDate,
    status: tripData.status || 'Unassigned',
  };

  // Remove undefined fields
  Object.keys(parentTripData).forEach(key => {
    if (parentTripData[key] === undefined) {
      delete parentTripData[key];
    }
  });

  // Create the parent trip first
  const parentTrip = await client.models.Trip.create(parentTripData);

  if (!parentTrip.data) {
    console.error('Failed to create parent trip:', parentTrip.errors);
    throw new Error('Failed to create parent recurring trip');
  }

  const parentTripId = parentTrip.data.id;
  console.log('Parent trip created with ID:', parentTripId);
  
  const tripsToCreate: any[] = [];
  // Start from the parent trip date, then generate subsequent occurrences
  // Note: The parent trip IS the first occurrence (today), child trips start from tomorrow
  let currentDate = new Date(startDate);
  console.log('Starting date for child trip generation:', currentDate.toISOString());

  // Generate trips up to the end date
  // The parent trip is the first occurrence, so we generate from the next occurrence
  let iterationCount = 0;
  const maxIterations = 1000; // Safety limit to prevent infinite loops
  
  while (iterationCount < maxIterations) {
    iterationCount++;
    
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
        console.error('Unknown recurring pattern:', recurringPattern);
        return;
    }

    // Check if next date is after the end date
    // Use <= comparison to include trips on the end date
    const endDateEndOfDay = new Date(endDate);
    endDateEndOfDay.setHours(23, 59, 59, 999);
    
    if (nextDate.getTime() > endDateEndOfDay.getTime()) {
      console.log(`Stopping: next date ${nextDate.toISOString()} is after end date ${endDate.toISOString()}`);
      break;
    }

    // Add trip for this date
    const childTripData: any = {
      pickupDate: nextDate.toISOString(),
      flightNumber: tripData.flightNumber,
      pickupLocation: tripData.pickupLocation,
      dropoffLocation: tripData.dropoffLocation,
      numberOfPassengers: tripData.numberOfPassengers || 1,
      isRecurring: false, // Child trips are not recurring themselves
      parentTripId,
      status: tripData.status || 'Unassigned',
    };

    // Add driver if assigned
    if (tripData.driverId) {
      childTripData.driverId = tripData.driverId;
    }

    tripsToCreate.push(childTripData);
    console.log(`Queued child trip for ${nextDate.toISOString()}`);
    currentDate = nextDate;
  }

  if (iterationCount >= maxIterations) {
    console.warn('Reached maximum iterations limit. Some trips may not have been generated.');
  }

  console.log(`Generated ${tripsToCreate.length} child trips to create`);

  // Create all child trips
  let createdCount = 0;
  let errorCount = 0;
  
  console.log(`Starting to create ${tripsToCreate.length} child trips...`);
  
  for (let i = 0; i < tripsToCreate.length; i++) {
    const trip = tripsToCreate[i];
    try {
      console.log(`Creating child trip ${i + 1}/${tripsToCreate.length} for ${trip.pickupDate}...`);
      const result = await client.models.Trip.create(trip);
      
      if (result.data) {
        createdCount++;
        console.log(`✅ Created child trip ${i + 1}/${tripsToCreate.length} - ID: ${result.data.id}, Date: ${trip.pickupDate}`);
      } else {
        errorCount++;
        console.error(`❌ Failed to create child trip ${i + 1}/${tripsToCreate.length}:`, result.errors);
        console.error('Trip data:', trip);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Error creating child trip ${i + 1}/${tripsToCreate.length}:`, error);
      console.error('Error details:', error?.message || error);
      console.error('Trip data that failed:', trip);
    }
    
    // Small delay between creates to avoid rate limiting
    if (i < tripsToCreate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n=== Recurring trips creation summary ===`);
  console.log(`Total to create: ${tripsToCreate.length}`);
  console.log(`Successfully created: ${createdCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Parent trip ID: ${parentTripId}`);
  
  if (errorCount > 0) {
    console.warn(`⚠️ Some recurring trips failed to create. Check console for details.`);
  }
  
  if (createdCount === 0 && tripsToCreate.length > 0) {
    console.error(`❌ CRITICAL: No child trips were created! Check errors above.`);
    throw new Error(`Failed to create any child trips. ${errorCount} errors occurred.`);
  }
  
  console.log('=== generateRecurringTrips COMPLETE ===');
  
  // Return result for tracking
  return {
    parentId: parentTripId,
    childCount: createdCount,
  };
}

/**
 * Check and generate upcoming recurring trips (call this periodically)
 */
export async function generateUpcomingRecurringTrips(): Promise<void> {
  console.log('=== generateUpcomingRecurringTrips START ===');
  try {
    // Get all active recurring trips
    const { data: recurringTrips } = await client.models.Trip.list({
      filter: { isRecurring: { eq: true } },
    });

    console.log(`Found ${recurringTrips?.length || 0} parent recurring trips`);

    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);
    console.log(`Generating trips from ${now.toISOString()} to ${twoWeeksFromNow.toISOString()}`);

    for (const trip of recurringTrips || []) {
      console.log(`\nProcessing parent trip ${trip.id} (${trip.flightNumber})`);
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
      console.log(`Creating ${tripsToCreate.length} upcoming child trips for parent ${trip.id}`);
      let created = 0;
      let failed = 0;
      
      for (const tripData of tripsToCreate) {
        try {
          const result = await client.models.Trip.create(tripData);
          if (result.data) {
            created++;
            console.log(`  ✅ Created trip for ${tripData.pickupDate}`);
          } else {
            failed++;
            console.error(`  ❌ Failed to create trip for ${tripData.pickupDate}:`, result.errors);
          }
        } catch (error) {
          failed++;
          console.error(`  ❌ Error creating upcoming recurring trip for ${tripData.pickupDate}:`, error);
        }
      }
      
      console.log(`  Summary: ${created} created, ${failed} failed`);
    }
    
    console.log('=== generateUpcomingRecurringTrips COMPLETE ===');
  } catch (error) {
    console.error('❌ Error generating upcoming recurring trips:', error);
  }
}
