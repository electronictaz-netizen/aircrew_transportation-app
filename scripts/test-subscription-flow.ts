/**
 * Smoke Test for Subscription Flow
 * 
 * This script validates the subscription flow logic and checks for potential issues.
 * Run with: npx tsx scripts/test-subscription-flow.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string | { passed: boolean; details?: string }): void {
  try {
    const result = fn();
    if (typeof result === 'boolean') {
      results.push({ name, passed: result });
    } else if (typeof result === 'string') {
      results.push({ name, passed: false, error: result });
    } else {
      results.push({ name, passed: result.passed, error: result.error, details: result.details });
    }
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

console.log('🧪 Starting Subscription Flow Smoke Test...\n');

// Test 1: Check URL parameter handling
test('URL Parameter Handling - signup=true', () => {
  const appFile = readFileSync(join(__dirname, '../src/App.tsx'), 'utf-8');
  // Amplify Authenticator handles signup=true automatically, but we check the flow exists
  return appFile.includes('Authenticator') || 'Authenticator component not found';
});

test('URL Parameter Handling - plan parameter detection', () => {
  const dashboardFile = readFileSync(join(__dirname, '../src/components/ManagementDashboard.tsx'), 'utf-8');
  const hasPlanCheck = dashboardFile.includes('searchParams.get(\'plan\')');
  const hasAutoOpen = dashboardFile.includes('setShowSubscriptionManagement(true)');
  
  if (!hasPlanCheck) {
    return { passed: false, error: 'Plan parameter detection not found' };
  }
  if (!hasAutoOpen) {
    return { passed: false, error: 'Auto-open subscription modal not found' };
  }
  return { passed: true, details: 'Plan parameter detection and auto-open logic present' };
});

// Test 2: Check subscription management component
test('Subscription Management Component Exists', () => {
  try {
    const subFile = readFileSync(join(__dirname, '../src/components/SubscriptionManagement.tsx'), 'utf-8');
    return subFile.length > 0;
  } catch {
    return false;
  }
});

test('Subscription Management - Upgrade Handler', () => {
  const subFile = readFileSync(join(__dirname, '../src/components/SubscriptionManagement.tsx'), 'utf-8');
  const hasUpgradeHandler = subFile.includes('handleUpgrade');
  const hasStripeRedirect = subFile.includes('createCheckoutSession');
  const hasStripeRedirectCheck = subFile.includes('window.location.href') || subFile.includes('checkout.checkoutUrl');
  
  if (!hasUpgradeHandler) {
    return { passed: false, error: 'handleUpgrade function not found' };
  }
  if (!hasStripeRedirect) {
    return { passed: false, error: 'Stripe checkout session creation not found' };
  }
  if (!hasStripeRedirectCheck) {
    return { passed: false, error: 'Stripe redirect logic not found' };
  }
  return { passed: true, details: 'Upgrade handler and Stripe redirect logic present' };
});

// Test 3: Check Stripe integration
test('Stripe Checkout Utility Exists', () => {
  try {
    const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
    return checkoutFile.length > 0;
  } catch {
    return false;
  }
});

test('Stripe Checkout - Function URL Configuration', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const hasEnvVarCheck = checkoutFile.includes('VITE_STRIPE_CHECKOUT_URL');
  const hasErrorHandling = checkoutFile.includes('not configured') || checkoutFile.includes('Error');
  
  if (!hasEnvVarCheck) {
    return { passed: false, error: 'Environment variable check not found' };
  }
  if (!hasErrorHandling) {
    return { passed: false, error: 'Error handling for missing config not found' };
  }
  return { passed: true, details: 'Function URL configuration and error handling present' };
});

test('Stripe Checkout - Request Format', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const hasCompanyId = checkoutFile.includes('companyId');
  const hasPriceId = checkoutFile.includes('priceId');
  const hasSuccessUrl = checkoutFile.includes('successUrl');
  const hasCancelUrl = checkoutFile.includes('cancelUrl');
  
  if (!hasCompanyId || !hasPriceId || !hasSuccessUrl || !hasCancelUrl) {
    return { 
      passed: false, 
      error: 'Missing required fields in checkout request' 
    };
  }
  return { passed: true, details: 'All required checkout request fields present' };
});

// Test 4: Check Lambda handler
test('Stripe Checkout Lambda Handler Exists', () => {
  try {
    const handlerFile = readFileSync(join(__dirname, '../amplify/functions/stripeCheckout/handler.ts'), 'utf-8');
    return handlerFile.length > 0;
  } catch {
    return false;
  }
});

test('Stripe Checkout Lambda - Request Validation', () => {
  const handlerFile = readFileSync(join(__dirname, '../amplify/functions/stripeCheckout/handler.ts'), 'utf-8');
  const hasValidation = handlerFile.includes('companyId') && handlerFile.includes('priceId');
  const hasErrorResponse = handlerFile.includes('statusCode: 400') || handlerFile.includes('Missing required');
  
  if (!hasValidation) {
    return { passed: false, error: 'Request validation not found' };
  }
  if (!hasErrorResponse) {
    return { passed: false, error: 'Error response handling not found' };
  }
  return { passed: true, details: 'Request validation and error handling present' };
});

test('Stripe Checkout Lambda - Stripe Integration', () => {
  const handlerFile = readFileSync(join(__dirname, '../amplify/functions/stripeCheckout/handler.ts'), 'utf-8');
  const hasStripeInit = handlerFile.includes('new Stripe') || handlerFile.includes('Stripe(');
  const hasCheckoutCreate = handlerFile.includes('checkout.sessions.create') || handlerFile.includes('checkoutSessions.create');
  const hasCustomerCreation = handlerFile.includes('getOrCreateStripeCustomer') || handlerFile.includes('customers.create');
  
  if (!hasStripeInit) {
    return { passed: false, error: 'Stripe initialization not found' };
  }
  if (!hasCheckoutCreate) {
    return { passed: false, error: 'Checkout session creation not found' };
  }
  if (!hasCustomerCreation) {
    return { passed: false, error: 'Customer creation logic not found' };
  }
  return { passed: true, details: 'Stripe integration logic present' };
});

// Test 5: Check subscription plans configuration
test('Subscription Plans Configuration', () => {
  const stripeFile = readFileSync(join(__dirname, '../src/utils/stripe.ts'), 'utf-8');
  const hasBasicPlan = stripeFile.includes('id: \'basic\'') || stripeFile.includes("id: 'basic'");
  const hasPremiumPlan = stripeFile.includes('id: \'premium\'') || stripeFile.includes("id: 'premium'");
  const hasFreePlan = stripeFile.includes('id: \'free\'') || stripeFile.includes("id: 'free'");
  const hasPriceIds = stripeFile.includes('stripePriceId');
  
  if (!hasBasicPlan || !hasPremiumPlan || !hasFreePlan) {
    return { passed: false, error: 'Missing subscription plans' };
  }
  if (!hasPriceIds) {
    return { passed: false, error: 'Stripe Price IDs not configured' };
  }
  return { passed: true, details: 'All subscription plans configured with Stripe Price IDs' };
});

test('Subscription Plans - Price Configuration', () => {
  const stripeFile = readFileSync(join(__dirname, '../src/utils/stripe.ts'), 'utf-8');
  const basicPrice = stripeFile.match(/basic.*?price:\s*(\d+)/s)?.[1];
  const premiumPrice = stripeFile.match(/premium.*?price:\s*(\d+)/s)?.[1];
  
  if (!basicPrice || !premiumPrice) {
    return { passed: false, error: 'Plan prices not found' };
  }
  
  const basicPriceNum = parseInt(basicPrice);
  const premiumPriceNum = parseInt(premiumPrice);
  
  if (basicPriceNum !== 59) {
    return { passed: false, error: `Basic plan price is $${basicPriceNum}, expected $59` };
  }
  if (premiumPriceNum !== 129) {
    return { passed: false, error: `Premium plan price is $${premiumPriceNum}, expected $129` };
  }
  return { passed: true, details: `Basic: $${basicPriceNum}/month, Premium: $${premiumPriceNum}/month` };
});

// Test 6: Check marketing website links
test('Marketing Website - Subscribe Links', () => {
  const marketingFile = readFileSync(join(__dirname, '../marketing-website/index.html'), 'utf-8');
  const hasBasicLink = marketingFile.includes('?signup=true&plan=basic');
  const hasPremiumLink = marketingFile.includes('?signup=true&plan=premium');
  const usesCorrectDomain = marketingFile.includes('onyxdispatch.us') && !marketingFile.includes('amplifyapp.com');
  
  if (!hasBasicLink) {
    return { passed: false, error: 'Basic plan subscribe link not found' };
  }
  if (!hasPremiumLink) {
    return { passed: false, error: 'Premium plan subscribe link not found' };
  }
  if (!usesCorrectDomain) {
    return { passed: false, error: 'Marketing website still uses Amplify URL instead of onyxdispatch.us' };
  }
  return { passed: true, details: 'Subscribe links configured correctly with onyxdispatch.us domain' };
});

// Test 7: Check redirect URLs
test('Checkout Redirect URLs', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const hasSuccessUrl = checkoutFile.includes('/management?checkout=success');
  const hasCancelUrl = checkoutFile.includes('/management?checkout=canceled');
  
  if (!hasSuccessUrl) {
    return { passed: false, error: 'Success redirect URL not found' };
  }
  if (!hasCancelUrl) {
    return { passed: false, error: 'Cancel redirect URL not found' };
  }
  return { passed: true, details: 'Checkout redirect URLs configured correctly' };
});

// Test 8: Check error handling
test('Error Handling - Missing Configuration', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const hasErrorHandling = checkoutFile.includes('throw new Error') || checkoutFile.includes('Error(');
  const hasHelpfulMessage = checkoutFile.includes('not configured') || checkoutFile.includes('VITE_STRIPE');
  
  if (!hasErrorHandling) {
    return { passed: false, error: 'Error handling not found' };
  }
  if (!hasHelpfulMessage) {
    return { passed: false, error: 'Helpful error messages not found' };
  }
  return { passed: true, details: 'Error handling with helpful messages present' };
});

test('Error Handling - Network Errors', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const hasNetworkErrorCheck = checkoutFile.includes('TypeError') || checkoutFile.includes('fetch');
  const hasResponseErrorCheck = checkoutFile.includes('response.ok') || checkoutFile.includes('!response.ok');
  
  if (!hasNetworkErrorCheck && !hasResponseErrorCheck) {
    return { passed: false, error: 'Network/response error handling not found' };
  }
  return { passed: true, details: 'Network and response error handling present' };
});

// Test 9: Check environment variable usage
test('Environment Variables - Frontend', () => {
  const checkoutFile = readFileSync(join(__dirname, '../src/utils/stripeCheckout.ts'), 'utf-8');
  const stripeFile = readFileSync(join(__dirname, '../src/utils/stripe.ts'), 'utf-8');
  
  const hasCheckoutUrl = checkoutFile.includes('VITE_STRIPE_CHECKOUT_URL');
  const hasPortalUrl = checkoutFile.includes('VITE_STRIPE_PORTAL_URL');
  const hasPriceIds = stripeFile.includes('VITE_STRIPE_PRICE_ID_BASIC') && stripeFile.includes('VITE_STRIPE_PRICE_ID_PREMIUM');
  
  if (!hasCheckoutUrl) {
    return { passed: false, error: 'VITE_STRIPE_CHECKOUT_URL not used' };
  }
  if (!hasPortalUrl) {
    return { passed: false, error: 'VITE_STRIPE_PORTAL_URL not used' };
  }
  if (!hasPriceIds) {
    return { passed: false, error: 'Stripe Price ID environment variables not used' };
  }
  return { passed: true, details: 'All required frontend environment variables are used' };
});

// Test 10: Check Lambda environment variables
test('Environment Variables - Lambda', () => {
  const handlerFile = readFileSync(join(__dirname, '../amplify/functions/stripeCheckout/handler.ts'), 'utf-8');
  const hasStripeSecret = handlerFile.includes('STRIPE_SECRET_KEY') || handlerFile.includes('process.env.STRIPE_SECRET_KEY');
  
  if (!hasStripeSecret) {
    return { passed: false, error: 'STRIPE_SECRET_KEY not referenced in Lambda handler' };
  }
  return { passed: true, details: 'Lambda environment variable references present' };
});

// Print results
console.log('📊 Test Results:\n');
let passed = 0;
let failed = 0;

results.forEach((result, index) => {
  const icon = result.passed ? '✅' : '❌';
  const status = result.passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${index + 1}/${results.length}] ${status}: ${result.name}`);
  
  if (result.error) {
    console.log(`   ⚠️  Error: ${result.error}`);
  }
  if (result.details) {
    console.log(`   ℹ️  ${result.details}`);
  }
  
  if (result.passed) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! The subscription flow appears to be properly configured.\n');
  console.log('⚠️  Note: This is a code-level smoke test. For full validation:');
  console.log('   1. Test in browser with actual sign-up flow');
  console.log('   2. Verify Stripe Checkout redirect works');
  console.log('   3. Test with real Stripe test mode credentials');
  console.log('   4. Verify webhook handling (if configured)\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
