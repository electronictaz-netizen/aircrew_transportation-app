/**
 * Send Booking Email Utility
 * Calls the Lambda function to send booking status emails (confirmation, acceptance, rejection)
 */

/**
 * Get Lambda Function URL for sendBookingEmail
 */
function getBookingEmailUrl(): string | null {
  const functionUrl = import.meta.env.VITE_BOOKING_EMAIL_FUNCTION_URL;
  return functionUrl || null;
}

export interface SendBookingEmailRequest {
  type: 'customer_confirmation' | 'booking_accepted' | 'booking_rejected';
  to: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  bookingId: string;
  pickupDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  tripType?: string;
  flightNumber?: string;
  vehicleType?: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  specialInstructions?: string;
  tripId?: string; // For accepted bookings
  rejectionReason?: string; // For rejected bookings (optional)
}

export interface SendBookingEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if booking email Lambda is configured
 */
export function isBookingEmailConfigured(): boolean {
  return !!getBookingEmailUrl();
}

/**
 * Send booking status email via Lambda function
 */
export async function sendBookingEmailViaLambda(
  data: SendBookingEmailRequest
): Promise<SendBookingEmailResponse | null> {
  // Check if Lambda is configured
  const functionUrl = getBookingEmailUrl();
  if (!functionUrl) {
    // Not configured - return null to indicate emails won't be sent
    console.warn('[Send Booking Email] Function URL not configured. Set VITE_BOOKING_EMAIL_FUNCTION_URL environment variable.');
    return null;
  }

  try {
    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[Send Booking Email] Calling function URL:', functionUrl);
      console.log('[Send Booking Email] Request payload:', {
        type: data.type,
        to: data.to,
        bookingId: data.bookingId,
      });
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Log response for debugging
    if (import.meta.env.DEV) {
      console.log('[Send Booking Email] Response status:', response.status);
    }

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch (parseError) {
        errorData = { 
          error: `HTTP error! status: ${response.status}`,
          statusText: response.statusText
        };
      }
      
      console.error('[Send Booking Email] Error response:', errorData);
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      console.error('[Send Booking Email] Function returned error:', responseData);
      return {
        success: false,
        error: responseData.error || 'Failed to send booking email',
      };
    }

    if (import.meta.env.DEV) {
      console.log('[Send Booking Email] Email sent successfully:', responseData);
    }

    return {
      success: true,
      messageId: responseData.messageId,
    };
  } catch (error: any) {
    const functionUrl = getBookingEmailUrl() || 'not configured';
    console.error('[Send Booking Email] Network error:', error);
    console.error('[Send Booking Email] Function URL:', functionUrl);
    return {
      success: false,
      error: error.message || 'Failed to send booking email',
    };
  }
}
