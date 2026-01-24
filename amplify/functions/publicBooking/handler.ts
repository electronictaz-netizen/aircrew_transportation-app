/**
 * Public Booking Portal Lambda Function
 * Provides public access to booking portal functionality without authentication
 */

import type { Handler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

// Note: This requires Amplify configuration to be set up
// The Lambda will need IAM permissions to access the Data API

interface GetCompanyRequest {
  action: 'getCompany';
  code: string;
}

interface CreateBookingRequest {
  action: 'createBooking';
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
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Initialize Amplify client
 * Note: This requires Amplify outputs to be available
 * In production, these should be passed as environment variables or from Amplify
 */
function getAmplifyClient() {
  // For Lambda, we need to configure Amplify with the backend outputs
  // This will be available after deployment via environment variables or SSM
  // For now, we'll use a try-catch approach
  
  try {
    // The client will use IAM credentials from the Lambda execution role
    return generateClient<Schema>({
      authMode: 'iam', // Use IAM authentication for Lambda
    });
  } catch (error) {
    console.error('Error initializing Amplify client:', error);
    throw error;
  }
}

/**
 * Get company by booking code
 */
async function getCompanyByCode(code: string): Promise<Schema['Company']['type'] | null> {
  const client = getAmplifyClient();
  
  try {
    const { data: companies } = await client.models.Company.list({
      filter: {
        bookingCode: { eq: code },
        isActive: { eq: true },
        bookingEnabled: { eq: true },
      },
    });

    if (!companies || companies.length === 0) {
      return null;
    }

    return companies[0] as Schema['Company']['type'];
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

/**
 * Create booking (trip and customer)
 */
async function createBooking(request: CreateBookingRequest): Promise<{ tripId: string; customerId?: string }> {
  const client = getAmplifyClient();
  
  try {
    // Create or find customer
    let customerId: string | undefined;
    
    if (request.customerEmail) {
      const { data: existingCustomers } = await client.models.Customer.list({
        filter: {
          companyId: { eq: request.companyId },
          email: { eq: request.customerEmail.toLowerCase().trim() },
        },
      });

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        // Update customer info if provided
        if (request.customerName || request.customerPhone) {
          await client.models.Customer.update({
            id: customerId,
            name: request.customerName || existingCustomers[0].name,
            phone: request.customerPhone || existingCustomers[0].phone,
            companyName: request.customerCompany || existingCustomers[0].companyName,
          });
        }
      } else {
        // Create new customer
        const { data: newCustomer } = await client.models.Customer.create({
          companyId: request.companyId,
          name: request.customerName,
          email: request.customerEmail.toLowerCase().trim(),
          phone: request.customerPhone,
          companyName: request.customerCompany,
          isActive: true,
        });
        customerId = newCustomer?.id;
      }
    }

    // Create trip
    const flightNumberOrJob = request.tripType === 'Airport Trip' 
      ? request.flightNumber || ''
      : request.jobNumber || '';

    const { data: trip } = await client.models.Trip.create({
      companyId: request.companyId,
      pickupDate: request.pickupDate,
      flightNumber: flightNumberOrJob,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      numberOfPassengers: request.numberOfPassengers,
      status: 'Unassigned',
      customerId: customerId,
      notes: request.specialInstructions || undefined,
    });

    if (!trip || !trip.id) {
      throw new Error('Failed to create trip');
    }

    return {
      tripId: trip.id,
      customerId: customerId,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Lambda handler
 */
export const handler: Handler = async (event): Promise<LambdaResponse> => {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS' || event.requestMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: '',
    };
  }

  try {
    // Parse request body
    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (e) {
        // If body is not JSON, try query string parameters
        body = event.queryStringParameters || {};
      }
    } else if (event.queryStringParameters) {
      body = event.queryStringParameters;
    }

    const { action } = body;

    // Handle getCompany action
    if (action === 'getCompany') {
      const { code } = body;
      
      if (!code) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Booking code is required' }),
        };
      }

      const company = await getCompanyByCode(code);
      
      if (!company) {
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Company not found or booking portal not enabled' }),
        };
      }

      // Return only necessary company data (exclude sensitive info)
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          success: true,
          company: {
            id: company.id,
            name: company.name,
            displayName: company.displayName,
            logoUrl: company.logoUrl,
            bookingCode: company.bookingCode,
            bookingEnabled: company.bookingEnabled,
          },
        }),
      };
    }

    // Handle createBooking action
    if (action === 'createBooking') {
      const bookingRequest = body as CreateBookingRequest;
      
      // Validate required fields
      // Note: companyId in the request is actually the booking code
      const bookingCode = bookingRequest.companyId;
      
      if (!bookingCode || !bookingRequest.customerName || 
          !bookingRequest.customerEmail || !bookingRequest.customerPhone ||
          !bookingRequest.pickupDate || !bookingRequest.pickupLocation || 
          !bookingRequest.dropoffLocation) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Verify company exists and booking is enabled by booking code
      const company = await getCompanyByCode(bookingCode);
      if (!company) {
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Company not found or booking not enabled' }),
        };
      }
      
      // Use the actual company ID from the fetched company
      bookingRequest.companyId = company.id;

      const result = await createBooking(bookingRequest);
      
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          success: true,
          bookingId: result.tripId,
          customerId: result.customerId,
          message: 'Booking created successfully',
        }),
      };
    }

    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Invalid action. Supported actions: getCompany, createBooking' }),
    };
  } catch (error: any) {
    console.error('Error in publicBooking handler:', error);
    
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      }),
    };
  }
};
