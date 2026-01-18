/**
 * Stripe Checkout Utilities
 * Functions to interact with Stripe Checkout API
 * 
 * Note: These functions call Lambda functions via HTTP endpoints
 * After deploying the functions, you'll need to configure API routes
 */

/**
 * Creates a Stripe Checkout session for subscription upgrade
 * 
 * TODO: After deploying Lambda functions, configure API routes and update this function
 * to call the actual API endpoint
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

    // Check if we have Lambda function URL in amplify_outputs
    // For now, we'll use a relative path that should be proxied
    // TODO: Update this once Lambda Function URLs are configured in amplify_outputs
    
    const apiEndpoint = '/api/stripe/checkout'; // This needs to be configured in your API
    
    const response = await fetch(apiEndpoint, {
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
    // If fetch fails (network error or endpoint doesn't exist), provide helpful message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Checkout service is not yet available. ' +
        'The Stripe integration is being configured. ' +
        'Please contact support or check back later.'
      );
    }
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Creates a Stripe Customer Portal session
 * 
 * TODO: After deploying Lambda functions, configure API routes and update this function
 * to call the actual API endpoint
 */
export async function createPortalSession(
  _companyId: string
): Promise<{ portalUrl: string }> {
  try {
    // TODO: Call Lambda function via API endpoint
    // After deploying, this should call your API endpoint
    // Example:
    // const baseUrl = window.location.origin;
    // const returnUrl = `${baseUrl}/management`;
    // const response = await fetch('/api/stripe/portal', { ... });
    
    // For now, return a placeholder
    throw new Error(
      'Stripe Portal integration not yet configured. ' +
      'Please deploy the Lambda functions and configure API routes. ' +
      'See STRIPE_SETUP.md for instructions.'
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}
