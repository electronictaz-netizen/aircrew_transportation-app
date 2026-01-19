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
  const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;
  
  if (checkoutUrl && checkoutUrl.trim() !== '') {
    // Ensure URL doesn't end with trailing slash (except root)
    return checkoutUrl.trim().replace(/\/$/, '');
  }

  // TODO: Check amplify_outputs.json for function URLs after deployment
  // For now, this will need to be configured via environment variable

  throw new Error(
    'Stripe Checkout URL not configured. ' +
    'Please set VITE_STRIPE_CHECKOUT_URL in your .env.local file. ' +
    'Get the Function URL from AWS Lambda Console for the stripeCheckout function. ' +
    'See STRIPE_SETUP.md for instructions.'
  );
}

/**
 * Get Lambda Function URL for stripePortal
 */
function getPortalUrl(): string {
  // Check environment variable first (recommended for production)
  const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;
  
  if (portalUrl && portalUrl.trim() !== '') {
    // Ensure URL doesn't end with trailing slash (except root)
    return portalUrl.trim().replace(/\/$/, '');
  }

  // TODO: Check amplify_outputs.json for function URLs after deployment

  throw new Error(
    'Stripe Portal URL not configured. ' +
    'Please set VITE_STRIPE_PORTAL_URL in your .env.local file. ' +
    'Get the Function URL from AWS Lambda Console for the stripePortal function. ' +
    'See STRIPE_SETUP.md for instructions.'
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
    
    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[Stripe Checkout] Calling function URL:', functionUrl);
      console.log('[Stripe Checkout] Request payload:', { companyId, priceId, successUrl, cancelUrl });
    }

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

    // Log response for debugging
    if (import.meta.env.DEV) {
      console.log('[Stripe Checkout] Response status:', response.status);
      console.log('[Stripe Checkout] Response headers:', Object.fromEntries(response.headers.entries()));
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
      
      console.error('[Stripe Checkout] Error response:', errorData);
      throw new Error(
        errorData.error || 
        errorData.message || 
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.checkoutUrl) {
      console.error('[Stripe Checkout] Invalid response data:', data);
      throw new Error('Invalid response: missing checkoutUrl');
    }

    return {
      checkoutUrl: data.checkoutUrl,
      sessionId: data.sessionId || '',
    };
  } catch (error) {
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const functionUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'not configured';
      console.error('[Stripe Checkout] Network error:', error);
      console.error('[Stripe Checkout] Function URL:', functionUrl);
      throw new Error(
        'Unable to connect to checkout service. ' +
        'Please verify the Function URL is configured correctly. ' +
        `URL: ${functionUrl}`
      );
    }
    console.error('[Stripe Checkout] Error creating checkout session:', error);
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
