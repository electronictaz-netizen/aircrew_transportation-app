/**
 * Driver Notification Utility
 * 
 * Handles sending notifications to drivers when they are assigned or reassigned to trips.
 * Supports email and SMS notifications (email via mailto, SMS can be extended with backend API).
 */

import type { Schema } from '../../amplify/data/resource';

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
 * Send SMS notification
 * Note: This is a placeholder. For production, integrate with AWS SNS, Twilio, or similar service.
 * SMS requires a backend API endpoint for security (API keys should not be in frontend).
 */
export function sendSMSNotification(
  driver: Schema['Driver']['type'],
  trip: Schema['Trip']['type'],
  isReassignment: boolean = false
): void {
  if (!driver.phone) {
    console.warn(`Cannot send SMS notification: Driver ${driver.name} has no phone number`);
    return;
  }

  const message = isReassignment
    ? `Trip Reassignment: Flight ${trip.flightNumber} on ${trip.pickupDate ? new Date(trip.pickupDate).toLocaleDateString() : 'TBD'}. Check your email for details.`
    : `New Trip Assignment: Flight ${trip.flightNumber} on ${trip.pickupDate ? new Date(trip.pickupDate).toLocaleDateString() : 'TBD'}. Check your email for details.`;

  // For now, create a sms: link (works on mobile devices)
  // For production, this should call a backend API that uses AWS SNS or similar
  const smsLink = `sms:${driver.phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(message)}`;
  
  // Open SMS app (works on mobile devices)
  window.open(smsLink);
  
  console.log(`SMS notification prepared for ${driver.name} (${driver.phone})`);
  console.log('Note: SMS functionality requires backend API integration for production use.');
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
 */
export async function notifyDriver(
  data: TripNotificationData,
  options: NotificationOptions = { email: true, sms: false, inApp: true }
): Promise<void> {
  const { trip, driver, isReassignment = false } = data;

  try {
    // Send email notification
    if (options.email && driver.email) {
      sendEmailNotification(driver, trip, isReassignment);
    }

    // Send SMS notification
    if (options.sms && driver.phone) {
      sendSMSNotification(driver, trip, isReassignment);
    }

    // Send in-app notification
    if (options.inApp) {
      await sendInAppNotification(driver, trip, isReassignment);
    }

    console.log(`✅ Notifications sent to driver ${driver.name} for trip ${trip.flightNumber}`);
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Notify previous driver when trip is reassigned
 */
export async function notifyPreviousDriver(
  previousDriver: Schema['Driver']['type'] | null,
  trip: Schema['Trip']['type']
): Promise<void> {
  if (!previousDriver || !previousDriver.email) {
    return;
  }

  const subject = `Trip Unassigned: Flight ${trip.flightNumber}`;
  const body = `Hello ${previousDriver.name},\n\nYou have been unassigned from the following trip:\n\n${formatTripDetails(trip)}\n\nIf you have any questions, please contact management.\n\nThank you!`;

  const mailtoLink = `mailto:${previousDriver.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');

  console.log(`Notification sent to previous driver ${previousDriver.name}`);
}
