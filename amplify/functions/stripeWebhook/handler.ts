/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events and updates company subscriptions
 */

import type { Handler } from 'aws-lambda';
import Stripe from 'stripe';

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

interface CompanyUpdateData {
  subscriptionStatus?: string;
  subscriptionTier?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  subscriptionCurrentPeriodEnd?: Date;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCanceledAt?: Date;
}

/**
 * Maps Stripe subscription status to our internal status
 */
function mapSubscriptionStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
  };
  return statusMap[stripeStatus] || stripeStatus;
}

/**
 * Maps Stripe price ID to subscription tier
 */
async function mapPriceToTier(priceId: string): Promise<string> {
  // This should match your Stripe Price IDs
  // Update these with your actual Stripe Price IDs
  const basicPriceId = process.env.STRIPE_PRICE_ID_BASIC || '';
  const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM || '';

  if (priceId === basicPriceId) {
    return 'basic';
  } else if (priceId === premiumPriceId) {
    return 'premium';
  }
  return 'free';
}

/**
 * Configure Amplify and get data client
 */
async function getDataClient() {
  const { generateClient } = await import('aws-amplify/data');
  // In Lambda functions, Amplify is auto-configured by the backend
  // No need to explicitly configure it
  return generateClient<any>();
}

/**
 * Updates company subscription based on Stripe event
 */
async function updateCompanySubscription(
  customerId: string,
  subscriptionData: any
): Promise<void> {
  const client = await getDataClient();

  try {
    // Find company by Stripe customer ID
    const { data: companies } = await client.models.Company.list({
      filter: {
        stripeCustomerId: { eq: customerId },
      },
    });

    if (!companies || companies.length === 0) {
      console.error(`No company found with Stripe customer ID: ${customerId}`);
      return;
    }

    const company = companies[0];
    const updateData: CompanyUpdateData = {};

    // Update subscription status
    if (subscriptionData.status) {
      updateData.subscriptionStatus = mapSubscriptionStatus(subscriptionData.status);
    }

    // Update subscription tier based on price
    if (subscriptionData.items?.data?.[0]?.price?.id) {
      const priceId = subscriptionData.items.data[0].price.id;
      updateData.stripePriceId = priceId;
      updateData.subscriptionTier = await mapPriceToTier(priceId);
    }

    // Update subscription period
    if (subscriptionData.current_period_end) {
      updateData.subscriptionCurrentPeriodEnd = new Date(
        subscriptionData.current_period_end * 1000
      ).toISOString();
    }

    // Update cancellation flags
    if (subscriptionData.cancel_at_period_end !== undefined) {
      updateData.subscriptionCancelAtPeriodEnd = subscriptionData.cancel_at_period_end;
    }

    if (subscriptionData.canceled_at) {
      updateData.subscriptionCanceledAt = new Date(
        subscriptionData.canceled_at * 1000
      ).toISOString();
    }

    // Update subscription ID if not set
    if (subscriptionData.id && !company.stripeSubscriptionId) {
      updateData.stripeSubscriptionId = subscriptionData.id;
    }

    // Update company
    await client.models.Company.update({
      id: company.id,
      ...updateData,
    });

    console.log(`Updated company ${company.id} subscription:`, updateData);
  } catch (error) {
    console.error('Error updating company subscription:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  console.log('Received Stripe webhook event:', JSON.stringify(event, null, 2));

  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' }),
      };
    }

    // Get signature header (handle different Lambda event formats)
    const headers = event.headers || event.multiValueHeaders || {};
    const stripeSignature = headers['stripe-signature'] || 
                           headers['Stripe-Signature'] ||
                           (Array.isArray(headers['stripe-signature']) ? headers['stripe-signature'][0] : null) ||
                           (Array.isArray(headers['Stripe-Signature']) ? headers['Stripe-Signature'][0] : null);

    if (!stripeSignature) {
      console.error('Missing Stripe signature header');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing signature' }),
      };
    }

    // Verify signature using Stripe SDK
    let webhookEvent: StripeWebhookEvent;
    try {
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-11-20.acacia',
      });
      
      // Get raw body (Lambda Function URLs send body as string, API Gateway may encode it)
      const rawBody = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {});
      
      // Construct event from raw body and signature
      webhookEvent = stripeClient.webhooks.constructEvent(
        rawBody,
        typeof stripeSignature === 'string' ? stripeSignature : stripeSignature[0],
        webhookSecret
      ) as any;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Webhook signature verification failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }

    // Handle different event types
    switch (webhookEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        {
          const subscription = webhookEvent.data.object;
          const customerId = subscription.customer;
          
          await updateCompanySubscription(customerId, subscription);
          
          return {
            statusCode: 200,
            body: JSON.stringify({ received: true, type: webhookEvent.type }),
          };
        }

      case 'customer.subscription.deleted':
        {
          const subscription = webhookEvent.data.object;
          const customerId = subscription.customer;
          
          await updateCompanySubscription(customerId, {
            ...subscription,
            status: 'canceled',
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ received: true, type: webhookEvent.type }),
          };
        }

      case 'invoice.payment_succeeded':
        {
          const invoice = webhookEvent.data.object;
          const customerId = invoice.customer;
          
          // If this invoice is for a subscription, update it
          if (invoice.subscription) {
            // In a real implementation, you'd fetch the subscription from Stripe API
            // For now, we'll just log it
            console.log('Payment succeeded for subscription:', invoice.subscription);
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({ received: true, type: webhookEvent.type }),
          };
        }

      case 'invoice.payment_failed':
        {
          const invoice = webhookEvent.data.object;
          const customerId = invoice.customer;
          
          // Update subscription to past_due status
          if (invoice.subscription) {
            const client = await getDataClient();
            
            const { data: companies } = await client.models.Company.list({
              filter: { stripeCustomerId: { eq: customerId } },
            });
            
            if (companies && companies.length > 0) {
              await client.models.Company.update({
                id: companies[0].id,
                subscriptionStatus: 'past_due',
              });
            }
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({ received: true, type: webhookEvent.type }),
          };
        }

      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ received: true, type: 'unhandled' }),
        };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
