/**
 * Stripe Checkout Utilities
 * Functions to interact with Stripe Checkout and Portal APIs
 * 
 * These functions call Lambda Function URLs directly.
 * After deploying, configure the Function URLs in environment variables or amplify_outputs.json
 */

/**
 * Get Lambda Function URL for stripeCheckout
 * 
 * Priority:
 * 1. Environment variable VITE_STRIPE_CHECKOUT_URL
 * 2. Check amplify_outputs.json for function URLs (if available)
 * 3. Use default/placeholder that will need to be configured
 */
function getCheckoutUrl(): string {
  // Check environment variable first (recommended for production)
  if (import.meta.env.VITE_STRIPE_CHECKOUT_URL) {
    return import.meta.env.VITE_STRIPE_CHECKOUT_URL;
  }

  // TODO: Check amplify_outputs.json for function URLs after deployment
  // For now, this will need to be configured via environment variable

  throw new Error(
    'Stripe Checkout URL not configured. ' +
    'Please set VITE_STRIPE_CHECKOUT_URL environment variable to your Lambda Function URL. ' +
    'You can find this in AWS Lambda Console after deployment.'
  );
}

/**
 * Get Lambda Function URL for stripePortal
 */
function getPortalUrl(): string {
  // Check environment variable first (recommended for production)
  if (import.meta.env.VITE_STRIPE_PORTAL_URL) {
    return import.meta.env.VITE_STRIPE_PORTAL_URL;
  }

  // TODO: Check amplify_outputs.json for function URLs after deployment

  throw new Error(
    'Stripe Portal URL not configured. ' +
    'Please set VITE_STRIPE_PORTAL_URL environment variable to your Lambda Function URL. ' +
    'You can find this in AWS Lambda Console after deployment.'
  );
}

/**
 * Creates a Stripe Checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  companyId: string,
  priceId: string
): Promise<{ checkoutUrl: string; sessionId: string }> {
  try {
    // Build URLs for checkout redirect
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/management?checkout=success`;
    const cancelUrl = `${baseUrl}/management?checkout=canceled`;

    // Get Lambda Function URL
    const functionUrl = getCheckoutUrl();

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId,
        priceId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.checkoutUrl) {
      throw new Error('Invalid response: missing checkoutUrl');
    }

    return {
      checkoutUrl: data.checkoutUrl,
      sessionId: data.sessionId || '',
    };
  } catch (error) {
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to checkout service. ' +
        'Please verify the Function URL is configured correctly.'
      );
    }
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Creates a Stripe Customer Portal session
 */
export async function createPortalSession(
  companyId: string
): Promise<{ portalUrl: string }> {
  try {
    // Build return URL
    const baseUrl = window.location.origin;
    const returnUrl = `${baseUrl}/management`;

    // Get Lambda Function URL
    const functionUrl = getPortalUrl();

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId,
        returnUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.portalUrl) {
      throw new Error('Invalid response: missing portalUrl');
    }

    return {
      portalUrl: data.portalUrl,
    };
  } catch (error) {
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to portal service. ' +
        'Please verify the Function URL is configured correctly.'
      );
    }
    console.error('Error creating portal session:', error);
    throw error;
  }
}
