/**
 * Stripe Customer Portal Handler
 * Creates portal sessions for customers to manage their subscriptions
 */

import type { Handler } from 'aws-lambda';
import Stripe from 'stripe';

interface PortalRequest {
  companyId: string;
  returnUrl: string;
}

interface PortalResponse {
  portalUrl: string;
}

/**
 * Configure Amplify and get data client
 */
async function getDataClient() {
  const { generateClient } = await import('aws-amplify/data');
  // In Lambda functions, Amplify is auto-configured by the backend
  return generateClient<any>();
}

/**
 * Create Stripe Customer Portal session
 */
async function createPortalSession(request: PortalRequest): Promise<PortalResponse> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  // Initialize Stripe
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  // Get company and Stripe customer ID
  const client = await getDataClient();
  const { data: company } = await client.models.Company.get({ id: request.companyId });

  if (!company) {
    throw new Error(`Company not found: ${request.companyId}`);
  }

  if (!company.stripeCustomerId) {
    throw new Error('Company does not have a Stripe customer ID. Please create a subscription first.');
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: request.returnUrl,
  });

  if (!session.url) {
    throw new Error('Failed to create portal session URL');
  }

  return {
    portalUrl: session.url,
  };
}

export const handler: Handler = async (event) => {
  console.log('Stripe Portal event:', JSON.stringify(event, null, 2));

  // Note: CORS is handled automatically by Lambda Function URL configuration
  // Do NOT add CORS headers here as it causes duplicate headers error

  try {
    const request: PortalRequest = JSON.parse(event.body || '{}');

    if (!request.companyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required field: companyId' 
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    // Set default return URL if not provided
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = request.returnUrl || `${baseUrl}/management`;

    const portal = await createPortalSession({
      ...request,
      returnUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(portal),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
