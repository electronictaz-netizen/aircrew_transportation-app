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
  bookingSettings?: string | null;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  customerId?: string;
  message?: string;
  error?: string;
  hint?: string;
}

export interface CompanyResponse {
  success: boolean;
  company?: CompanyData;
  error?: string;
}

export type GetCompanyResult = { company: CompanyData } | { company: null; error?: string; hint?: string };

/**
 * Get company by booking code via Lambda function
 */
export async function getCompanyByBookingCode(code: string): Promise<CompanyData | null> {
  const result = await getCompanyByBookingCodeWithDetail(code);
  return result.company;
}

/**
 * Get company by booking code with error detail (for 404 hint)
 */
export async function getCompanyByBookingCodeWithDetail(code: string): Promise<GetCompanyResult> {
  if (!BOOKING_API_URL) {
    console.error('Booking API URL not configured. Set VITE_BOOKING_API_URL environment variable.');
    return { company: null, error: 'Booking API URL not configured' };
  }

  try {
    const response = await fetch(BOOKING_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getCompany', code }),
    });

    const data = (await response.json().catch(() => ({}))) as CompanyResponse & { hint?: string };
    if (!response.ok) {
      if (response.status === 404) {
        // Our Lambda returns { error, hint } for "company not found". If we get 404 without that,
        // the URL may be wrong or the Function URL was removed.
        const hint =
          data.hint ||
          (!data.error
            ? 'The booking API URL may be wrong or the Lambda Function URL was removed. In Amplify: set VITE_BOOKING_API_URL to the Function URL from Lambda → publicBooking → Configuration → Function URL, then redeploy.'
            : undefined);
        return { company: null, error: data.error || 'Not found', hint };
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    if (data.success && data.company) return { company: data.company };
    return { company: null, error: data.error, hint: data.hint };
  } catch (error) {
    console.error('Error fetching company from booking API:', error);
    return { company: null, error: (error as Error)?.message };
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
  smsOptIn?: boolean;
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

    const data = (await response.json().catch(() => ({}))) as BookingResponse;
    
    // Check if response is OK and data indicates success
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
      };
    }
    
    // Return the response data (should have success: true on success)
    return data;
  } catch (error: any) {
    console.error('Error creating booking via API:', error);
    return {
      success: false,
      error: error.message || 'Failed to create booking',
    };
  }
}
