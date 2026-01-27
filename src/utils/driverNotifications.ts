/**
 * Driver Notification Utility
 * 
 * Handles sending notifications to drivers when they are assigned or reassigned to trips.
 * Supports email notifications (via mailto) and SMS notifications (via Telnyx).
 */

import type { Schema } from '../../amplify/data/resource';
import { sendTelnyxSms } from './telnyxSms';
import { SMS_TEMPLATES } from './smsTemplates';

export interface NotificationOptions {
  email?: boolean;
  sms?: boolean;
  inApp?: boolean;
}

export interface TripNotificationData {
  trip: Schema['Trip']['type'];
  driver: Schema['Driver']['type'];
  isReassignment?: boolean;
  previousDriver?: Schema['Driver']['type'] | null;
}

/**
 * Format trip details for notification message
 */
function formatTripDetails(trip: Schema['Trip']['type']): string {
  const pickupDate = trip.pickupDate 
    ? new Date(trip.pickupDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD';
  
  const airport = trip.airport 
    ? (trip.airport === 'BUF' ? 'Buffalo Niagara International Airport (BUF)' :
       trip.airport === 'ROC' ? 'Frederick Douglass Greater Rochester International Airport (ROC)' :
       trip.airport === 'SYR' ? 'Syracuse Hancock International Airport (SYR)' :
       trip.airport === 'ALB' ? 'Albany International Airport (ALB)' :
       trip.airport)
    : 'Airport TBD';

  return `
Trip Details:
- Flight Number: ${trip.flightNumber}
- Airport: ${airport}
- Pickup Date/Time: ${pickupDate}
- Pickup Location: ${trip.pickupLocation}
- Dropoff Location: ${trip.dropoffLocation}
- Number of Passengers: ${trip.numberOfPassengers}
`;
}

/**
 * Send email notification via mailto link
 * Note: This opens the user's email client. For production, integrate with AWS SES or similar service.
 */
export function sendEmailNotification(
  driver: Schema['Driver']['type'],
  trip: Schema['Trip']['type'],
  isReassignment: boolean = false
): void {
  if (!driver.email) {
    console.warn(`Cannot send email notification: Driver ${driver.name} has no email address`);
    return;
  }

  const subject = isReassignment
    ? `Trip Reassignment: Flight ${trip.flightNumber}`
    : `New Trip Assignment: Flight ${trip.flightNumber}`;

  const body = isReassignment
    ? `Hello ${driver.name},\n\nYou have been reassigned to the following trip:\n\n${formatTripDetails(trip)}\n\nPlease review the details and confirm your availability.\n\nThank you!`
    : `Hello ${driver.name},\n\nYou have been assigned to a new trip:\n\n${formatTripDetails(trip)}\n\nPlease review the details and confirm your availability.\n\nThank you!`;

  const mailtoLink = `mailto:${driver.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Open email client
  window.open(mailtoLink, '_blank');
  
  console.log(`Email notification prepared for ${driver.name} (${driver.email})`);
}

/**
 * Send in-app notification
 * This uses the browser's Notification API if available and permitted
 */
export async function sendInAppNotification(
  driver: Schema['Driver']['type'],
  trip: Schema['Trip']['type'],
  isReassignment: boolean = false
): Promise<void> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }

  // Request permission if not already granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const title = isReassignment
    ? `Trip Reassignment: Flight ${trip.flightNumber}`
    : `New Trip Assignment: Flight ${trip.flightNumber}`;

  const body = isReassignment
    ? `You have been reassigned to Flight ${trip.flightNumber}`
    : `You have been assigned to Flight ${trip.flightNumber}`;

  const notification = new Notification(title, {
    body: `${body}\nPickup: ${trip.pickupDate ? new Date(trip.pickupDate).toLocaleString() : 'TBD'}\nLocation: ${trip.pickupLocation}`,
    icon: '/icon-192x192.png', // Use PWA icon if available
    badge: '/icon-192x192.png',
    tag: `trip-${trip.id}`, // Prevent duplicate notifications
    requireInteraction: false,
  });

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click to focus window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  console.log(`In-app notification sent to ${driver.name}`);
}

/**
 * Main function to send notifications to a driver
 * Respects driver's notification preference
 */
export async function notifyDriver(
  data: TripNotificationData,
  options: NotificationOptions = { email: true, sms: true, inApp: true }
): Promise<void> {
  const { trip, driver, isReassignment = false } = data;

  try {
    // Get driver's notification preference (default to 'email' if not set)
    const preference = driver.notificationPreference || 'email';
    
    // Send email notification if:
    // - Email is enabled in options AND
    // - Driver wants email (preference is 'email' or 'both') AND
    // - Driver has email address
    if (options.email && (preference === 'email' || preference === 'both') && driver.email) {
      sendEmailNotification(driver, trip, isReassignment);
    }

    // Send SMS notification if:
    // - SMS is enabled in options AND
    // - Driver wants SMS (preference is 'sms' or 'both') AND
    // - Driver has phone number
    if (options.sms && (preference === 'sms' || preference === 'both') && driver.phone) {
      try {
        const message = isReassignment
          ? SMS_TEMPLATES.DRIVER_REASSIGNMENT(trip)
          : SMS_TEMPLATES.DRIVER_ASSIGNMENT(trip);
        
        const result = await sendTelnyxSms({
          phone: driver.phone,
          message,
        });

        if (result.success) {
          console.log(`SMS notification sent to driver ${driver.name} (${driver.phone})`);
        } else {
          console.warn(`Failed to send SMS to driver ${driver.name}:`, result.error);
          // Fall back to email if SMS fails and email is available
          if (options.email && driver.email && (preference === 'sms' || preference === 'both')) {
            console.log(`Falling back to email notification for driver ${driver.name}`);
            sendEmailNotification(driver, trip, isReassignment);
          }
        }
      } catch (smsError) {
        console.error('Error sending SMS notification:', smsError);
        // Don't fail the whole notification process if SMS fails
      }
    }

    // Send in-app notification (always send if enabled, doesn't depend on preference)
    if (options.inApp) {
      await sendInAppNotification(driver, trip, isReassignment);
    }

    console.log(`✅ Notifications sent to driver ${driver.name} for trip ${trip.flightNumber} (preference: ${preference})`);
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify previous driver when trip is reassigned
 * Respects driver's notification preference
 */
export async function notifyPreviousDriver(
  previousDriver: Schema['Driver']['type'] | null,
  trip: Schema['Trip']['type']
): Promise<void> {
  if (!previousDriver) {
    return;
  }

  // Get driver's notification preference (default to 'email' if not set)
  const preference = previousDriver.notificationPreference || 'email';

  // Send email if driver prefers email or both
  if ((preference === 'email' || preference === 'both') && previousDriver.email) {
    const subject = `Trip Unassigned: Flight ${trip.flightNumber}`;
    const body = `Hello ${previousDriver.name},\n\nYou have been unassigned from the following trip:\n\n${formatTripDetails(trip)}\n\nIf you have any questions, please contact management.\n\nThank you!`;

    const mailtoLink = `mailto:${previousDriver.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    console.log(`Email notification sent to previous driver ${previousDriver.name}`);
  }

  // Send SMS if driver prefers SMS or both
  if ((preference === 'sms' || preference === 'both') && previousDriver.phone) {
    try {
      const result = await sendTelnyxSms({
        phone: previousDriver.phone,
        message: SMS_TEMPLATES.DRIVER_UNASSIGNMENT(trip),
      });

      if (result.success) {
        console.log(`SMS notification sent to previous driver ${previousDriver.name} (${previousDriver.phone})`);
      } else {
        console.warn(`Failed to send SMS to previous driver ${previousDriver.name}:`, result.error);
      }
    } catch (smsError) {
      console.error('Error sending SMS to previous driver:', smsError);
      // Don't fail if SMS fails
    }
  }
}
