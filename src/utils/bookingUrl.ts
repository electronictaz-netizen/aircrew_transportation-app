/**
 * Booking URL Utility
 * Handles booking portal URL generation with support for custom domains
 */

/**
 * Get the base URL for booking portal
 * Uses custom domain if configured, otherwise falls back to current origin
 */
export function getBookingBaseUrl(): string {
  // Check for custom booking domain in environment variable
  const customDomain = import.meta.env.VITE_BOOKING_DOMAIN;
  
  if (customDomain) {
    // Use custom domain (with or without protocol)
    if (customDomain.startsWith('http://') || customDomain.startsWith('https://')) {
      return customDomain;
    }
    return `https://${customDomain}`;
  }
  
  // Fallback to current origin (works for both dev and production)
  return window.location.origin;
}

/**
 * Get the full booking URL for a booking code
 */
export function getBookingUrl(bookingCode: string): string {
  const baseUrl = getBookingBaseUrl();
  return `${baseUrl}/booking/${bookingCode}`;
}

/**
 * Get booking URL with query parameter format
 */
export function getBookingUrlWithQuery(bookingCode: string): string {
  const baseUrl = getBookingBaseUrl();
  return `${baseUrl}/booking?code=${bookingCode}`;
}
