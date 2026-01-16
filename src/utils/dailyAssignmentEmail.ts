/**
 * Daily Assignment Email Utility
 * 
 * Generates and sends daily assignment emails to drivers with their trips for the following day.
 * Shows basic trip information (times, pickup locations) and directs drivers to the app for full details.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

const client = generateClient<Schema>();

export interface DailyAssignmentOptions {
  email?: boolean;
}

export interface DailyAssignmentData {
  driver: Schema['Driver']['type'];
  trips: Array<Schema['Trip']['type']>;
  targetDate: Date;
}

/**
 * Format a single trip for the daily assignment email
 */
function formatTripForEmail(trip: Schema['Trip']['type']): string {
  const pickupDate = trip.pickupDate 
    ? new Date(trip.pickupDate)
    : null;
  
  const pickupTime = pickupDate 
    ? format(pickupDate, 'h:mm a')
    : 'TBD';
  
  const airport = trip.airport 
    ? (trip.airport === 'BUF' ? 'BUF' :
       trip.airport === 'ROC' ? 'ROC' :
       trip.airport === 'SYR' ? 'SYR' :
       trip.airport === 'ALB' ? 'ALB' :
       trip.airport)
    : 'TBD';

  return `
  • Flight ${trip.flightNumber} (${airport})
    Time: ${pickupTime}
    Pickup: ${trip.pickupLocation}
    Passengers: ${trip.numberOfPassengers}`;
}

/**
 * Generate daily assignment email content for a driver
 */
export function generateDailyAssignmentEmail(data: DailyAssignmentData): { subject: string; body: string } {
  const { driver, trips, targetDate } = data;
  
  const dateStr = format(targetDate, 'EEEE, MMMM d, yyyy');
  const tripCount = trips.length;
  
  const subject = `Your Trip Assignments for ${dateStr}`;
  
  let body = `Hello ${driver.name},\n\n`;
  body += `Here are your trip assignments for ${dateStr}:\n\n`;
  
  if (tripCount === 0) {
    body += `You have no trips scheduled for ${dateStr}.\n\n`;
  } else {
    body += `You have ${tripCount} trip${tripCount > 1 ? 's' : ''} scheduled:\n`;
    
    // Sort trips by pickup time
    const sortedTrips = [...trips].sort((a, b) => {
      if (!a.pickupDate || !b.pickupDate) return 0;
      return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
    });
    
    sortedTrips.forEach((trip, index) => {
      body += `${index + 1}.${formatTripForEmail(trip)}\n`;
    });
    
    body += `\n`;
  }
  
  body += `Please log into the Aircrew Transportation App for complete trip details including:\n`;
  body += `- Full pickup and dropoff addresses\n`;
  body += `- Flight status information\n`;
  body += `- Airport details\n`;
  body += `- Ability to record pickup and dropoff times\n\n`;
  body += `If you have any questions or need to make changes, please contact management.\n\n`;
  body += `Thank you!\n`;
  body += `Aircrew Transportation Team`;
  
  return { subject, body };
}

/**
 * Send daily assignment email to a single driver
 */
export function sendDailyAssignmentEmail(data: DailyAssignmentData): void {
  const { driver } = data;
  
  if (!driver.email) {
    console.warn(`Cannot send daily assignment email: Driver ${driver.name} has no email address`);
    return;
  }
  
  const { subject, body } = generateDailyAssignmentEmail(data);
  const mailtoLink = `mailto:${driver.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Open email client
  window.open(mailtoLink, '_blank');
  
  console.log(`Daily assignment email prepared for ${driver.name} (${driver.email})`);
}

/**
 * Get trips for a specific date for a driver
 */
async function getDriverTripsForDate(
  driverId: string,
  targetDate: Date,
  companyId?: string
): Promise<Array<Schema['Trip']['type']>> {
  try {
    const filter: any = { driverId: { eq: driverId } };
    if (companyId) {
      filter.companyId = { eq: companyId };
    }
    const { data: allTrips } = await client.models.Trip.list({
      filter,
    });
    
    if (!allTrips) return [];
    
    const targetStart = startOfDay(targetDate);
    const targetEnd = endOfDay(targetDate);
    
    return allTrips.filter((trip) => {
      if (!trip.pickupDate) return false;
      const tripDate = new Date(trip.pickupDate);
      return tripDate >= targetStart && tripDate <= targetEnd;
    });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    return [];
  }
}

/**
 * Send daily assignment emails to all active drivers for tomorrow
 */
export async function sendDailyAssignmentEmailsToAllDrivers(
  targetDate?: Date,
  options: DailyAssignmentOptions = { email: true },
  companyId?: string
): Promise<{ sent: { email: number }; failed: { email: number }; skipped: number }> {
  const tomorrow = targetDate || addDays(new Date(), 1);
  const dateStr = format(tomorrow, 'MMMM d, yyyy');
  
  console.log(`Generating daily assignment emails for ${dateStr}...`);
  console.log(`Options: Email=${options.email}`);
  
  try {
    // Get all active drivers for the company
    const driverFilter: any = {};
    if (companyId) {
      driverFilter.companyId = { eq: companyId };
    }
    const { data: drivers } = await client.models.Driver.list({
      filter: Object.keys(driverFilter).length > 0 ? driverFilter : undefined
    });
    
    // Filter drivers based on enabled notification methods AND their preferences
    const eligibleDrivers = (drivers || []).filter(d => {
      if (!d.isActive) return false;
      
      // Get driver's notification preference (default to 'email' if not set)
      const preference = d.notificationPreference || 'email';
      
      // Check if driver wants email and has email address
      const wantsEmail = (preference === 'email' || preference === 'both') && d.email;
      
      // Driver is eligible if user wants to send email AND driver wants email AND driver has email
      return options.email && wantsEmail;
    });
    
    if (eligibleDrivers.length === 0) {
      console.log(`No active drivers with email addresses found`);
      return { sent: { email: 0 }, failed: { email: 0 }, skipped: 0 };
    }
    
    console.log(`Found ${eligibleDrivers.length} eligible driver(s)`);
    
    const result = {
      sent: { email: 0 },
      failed: { email: 0 },
      skipped: 0,
    };
    
    // Process each driver
    for (const driver of eligibleDrivers) {
      try {
        // Get trips for tomorrow
          const trips = await getDriverTripsForDate(driver.id, tomorrow, companyId);
        
        if (trips.length === 0) {
          console.log(`Skipping ${driver.name} - no trips scheduled for ${dateStr}`);
          result.skipped++;
          continue;
        }
        
        const assignmentData = {
          driver,
          trips,
          targetDate: tomorrow,
        };
        
        // Get driver's notification preference (default to 'email' if not set)
        const preference = driver.notificationPreference || 'email';
        
        // Send email if:
        // - User enabled email AND
        // - Driver wants email (preference is 'email' or 'both') AND
        // - Driver has email address
        if (options.email && (preference === 'email' || preference === 'both') && driver.email) {
          try {
            sendDailyAssignmentEmail(assignmentData);
            result.sent.email++;
            console.log(`✅ Daily assignment email sent to ${driver.name} (${trips.length} trip(s))`);
          } catch (error) {
            console.error(`Error sending email to ${driver.name}:`, error);
            result.failed.email++;
          }
        }
        
        // Small delay to prevent overwhelming clients
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${driver.name}:`, error);
        if (options.email && driver.email) result.failed.email++;
      }
    }
    
    console.log(`Daily assignment emails complete:`, result);
    return result;
  } catch (error) {
    console.error('Error sending daily assignment emails:', error);
    return { sent: { email: 0 }, failed: { email: 0 }, skipped: 0 };
  }
}

/**
 * Send daily assignment notifications to a specific driver for tomorrow
 */
export async function sendDailyAssignmentToDriver(
  driverId: string,
  targetDate?: Date,
  options: DailyAssignmentOptions = { email: true },
  companyId?: string
): Promise<{ email: boolean }> {
  try {
    const tomorrow = targetDate || addDays(new Date(), 1);
    
    // Get driver
    const { data: driver } = await client.models.Driver.get({ id: driverId });
    if (!driver || !driver.isActive) {
      console.warn(`Driver ${driverId} not found or inactive`);
      return { email: false };
    }
    
    // Check if driver has required contact info
    if (options.email && !driver.email) {
      console.warn(`Driver ${driver.name} missing email address`);
      return { email: false };
    }
    
    // Get trips for tomorrow
    const trips = await getDriverTripsForDate(driverId, tomorrow, companyId);
    
    if (trips.length === 0) {
      console.log(`No trips scheduled for ${driver.name} on ${format(tomorrow, 'MMMM d, yyyy')}`);
      return { email: false };
    }
    
    const assignmentData = {
      driver,
      trips,
      targetDate: tomorrow,
    };
    
    const result = { email: false };
    
    // Send email if enabled and driver has email
    if (options.email && driver.email) {
      sendDailyAssignmentEmail(assignmentData);
      result.email = true;
    }
    
    return result;
  } catch (error) {
    console.error('Error sending daily assignment email to driver:', error);
    return { email: false };
  }
}
