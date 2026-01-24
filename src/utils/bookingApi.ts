/**
 * Booking API Client
 * Calls the public booking Lambda function for unauthenticated access
 */

// This will be set from environment variable or Amplify outputs
// For now, it will need to be configured after Lambda Function URL is created
const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';

export interface CompanyData {
  id: string;
  name: string;
  displayName?: string | null;
  logoUrl?: string | null;
  bookingCode?: string | null;
  bookingEnabled?: boolean | null;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  customerId?: string;
  message?: string;
  error?: string;
}

export interface CompanyResponse {
  success: boolean;
  company?: CompanyData;
  error?: string;
}

/**
 * Get company by booking code via Lambda function
 */
export async function getCompanyByBookingCode(code: string): Promise<CompanyData | null> {
  if (!BOOKING_API_URL) {
    console.error('Booking API URL not configured. Set VITE_BOOKING_API_URL environment variable.');
    return null;
  }

  try {
    const response = await fetch(BOOKING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getCompany',
        code: code,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CompanyResponse = await response.json();
    
    if (data.success && data.company) {
      return data.company;
    }

    return null;
  } catch (error) {
    console.error('Error fetching company from booking API:', error);
    return null;
  }
}

/**
 * Create booking via Lambda function
 */
export async function createBookingViaAPI(bookingData: {
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  tripType: 'Airport Trip' | 'Standard Trip';
  pickupDate: string;
  flightNumber?: string;
  jobNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  vehicleType?: string;
  isRoundTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  specialInstructions?: string;
}): Promise<BookingResponse> {
  if (!BOOKING_API_URL) {
    return {
      success: false,
      error: 'Booking API URL not configured',
    };
  }

  try {
    const response = await fetch(BOOKING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createBooking',
        ...bookingData,
      }),
    });

    const data: BookingResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating booking via API:', error);
    return {
      success: false,
      error: error.message || 'Failed to create booking',
    };
  }
}
