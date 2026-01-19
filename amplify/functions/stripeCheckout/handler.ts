/**
 * Stripe Checkout Handler
 * Creates checkout sessions for subscription purchases
 */

import type { Handler } from 'aws-lambda';
import Stripe from 'stripe';

interface CheckoutRequest {
  companyId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
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
 * Get or create Stripe customer for a company
 */
async function getOrCreateStripeCustomer(companyId: string, stripe: any): Promise<string> {
  const client = await getDataClient();

  // Get company
  const { data: company } = await client.models.Company.get({ id: companyId });
  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // If company already has a Stripe customer ID, return it
  if (company.stripeCustomerId) {
    return company.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    name: company.displayName || company.name,
    metadata: {
      companyId: company.id,
    },
  });

  // Update company with Stripe customer ID
  await client.models.Company.update({
    id: companyId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * Create Stripe Checkout session
 */
async function createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  // Initialize Stripe
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(request.companyId, stripe);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: request.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      companyId: request.companyId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export const handler: Handler = async (event) => {
  console.log('Stripe Checkout event:', JSON.stringify(event, null, 2));

  // Note: CORS is handled automatically by Lambda Function URL configuration
  // Do NOT add CORS headers here as it causes duplicate headers error

  try {
    // Handle both API Gateway and Function URL event formats
    const body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {});
    const request: CheckoutRequest = JSON.parse(body || '{}');

    if (!request.companyId || !request.priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: companyId, priceId' 
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    // Set default URLs if not provided
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = request.successUrl || `${baseUrl}/management?checkout=success`;
    const cancelUrl = request.cancelUrl || `${baseUrl}/management?checkout=canceled`;

    const checkout = await createCheckoutSession({
      ...request,
      successUrl,
      cancelUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(checkout),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
