/**
 * Customer Portal API Client
 * Calls the customer portal Lambda function for unauthenticated customer access
 */

const CUSTOMER_PORTAL_API_URL = import.meta.env.VITE_CUSTOMER_PORTAL_API_URL || '';

export interface CustomerPortalResponse {
  success: boolean;
  customerId?: string;
  accessCode?: string;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    companyName?: string | null;
  };
  trips?: Array<{
    id: string;
    flightNumber: string;
    pickupDate: string;
    pickupLocation: string;
    dropoffLocation: string;
    numberOfPassengers: number;
    status: string;
    driverId?: string | null;
    tripRate?: number | null;
    actualPickupTime?: string | null;
    actualDropoffTime?: string | null;
    notes?: string | null;
  }>;
  location?: { latitude: number; longitude: number; timestamp: string } | null;
  error?: string;
  hint?: string;
  message?: string;
}

/**
 * Find customer by email or phone and generate access code
 */
export async function findCustomer(
  companyId: string,
  email?: string,
  phone?: string
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    console.error('Customer Portal API URL not configured. Set VITE_CUSTOMER_PORTAL_API_URL environment variable.');
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'findCustomer',
        companyId,
        email: email?.trim(),
        phone: phone?.trim(),
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error, hint: data.hint };
    }
    return data;
  } catch (error) {
    console.error('Error finding customer:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to find customer' };
  }
}

/**
 * Verify access code and get customer data
 */
export async function verifyAccessCode(
  companyId: string,
  customerId: string,
  accessCode: string
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verifyCode',
        companyId,
        customerId,
        accessCode: accessCode.trim().toUpperCase(),
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.error('Error verifying access code:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to verify code' };
  }
}

/**
 * Get trips for customer
 */
export async function getCustomerTrips(
  companyId: string,
  customerId: string,
  view: 'upcoming' | 'history' = 'upcoming'
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getTrips',
        companyId,
        customerId,
        view,
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.error('Error loading trips:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to load trips' };
  }
}

/**
 * Create trip modification request
 */
export async function createModificationRequest(
  companyId: string,
  customerId: string,
  tripId: string,
  requestType: 'date' | 'time' | 'location' | 'passengers' | 'other',
  requestedChanges: any,
  reason: string
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createModificationRequest',
        companyId,
        customerId,
        tripId,
        requestType,
        requestedChanges,
        reason,
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.error('Error creating modification request:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to create modification request' };
  }
}

/**
 * Create trip rating
 */
export async function createTripRating(
  companyId: string,
  customerId: string,
  tripId: string,
  rating: number,
  driverRating?: number,
  vehicleRating?: number,
  review?: string,
  wouldRecommend?: boolean
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createRating',
        companyId,
        customerId,
        tripId,
        rating,
        driverRating,
        vehicleRating,
        review,
        wouldRecommend,
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.error('Error creating rating:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to create rating' };
  }
}

/**
 * Get latest driver location for a trip (passenger live tracking).
 * Only returns location if the trip belongs to the customer.
 */
export async function getTripLocation(
  companyId: string,
  customerId: string,
  tripId: string
): Promise<CustomerPortalResponse> {
  if (!CUSTOMER_PORTAL_API_URL) {
    return { success: false, error: 'Customer Portal API URL not configured' };
  }

  try {
    const response = await fetch(CUSTOMER_PORTAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getTripLocation',
        companyId,
        customerId,
        tripId,
      }),
    });

    const data = (await response.json()) as CustomerPortalResponse;
    if (!response.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.error('Error getting trip location:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to get trip location' };
  }
}
