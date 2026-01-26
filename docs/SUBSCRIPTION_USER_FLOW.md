# Subscription User Flow

## Overview

When a user clicks "Subscribe to Basic" or "Subscribe to Premium" on the marketing website, here's the complete flow:

## Step-by-Step Flow

### 1. User Clicks Subscribe Button
**Location**: Marketing website (tazsoftware.biz or onyxdispatch.us)

**Action**: User clicks "Subscribe to Basic" or "Subscribe to Premium"

**URL**: 
- Basic: `https://onyxdispatch.us/?signup=true&plan=basic`
- Premium: `https://onyxdispatch.us/?signup=true&plan=premium`

---

### 2. User Lands on App Sign-Up Page
**Location**: Onyx Transportation App (onyxdispatch.us)

**What Happens**:
- The `?signup=true` parameter tells Amplify's Authenticator component to show the **sign-up form** instead of the sign-in form
- User sees the branded login/sign-up screen
- The `plan=basic` or `plan=premium` parameter is stored in the URL but not used yet

**User Action**: User creates an account
- Enters email and password
- Account is created in AWS Cognito
- User is automatically logged in

---

### 3. User is Authenticated and Lands in App
**Location**: Management Dashboard (onyxdispatch.us/management)

**What Happens**:
- User is logged in and redirected to the Management Dashboard
- The app detects the `plan` parameter in the URL
- After 1 second (to ensure company data is loaded), the **Subscription Management modal automatically opens**

**Code Reference**: `src/components/ManagementDashboard.tsx` lines 82-94

```typescript
useEffect(() => {
  const plan = searchParams.get('plan');
  if (plan && companyId && !companyLoading) {
    // User came from external website with plan selection
    // Open subscription management after a short delay
    setTimeout(() => {
      setShowSubscriptionManagement(true);
      // Remove the plan parameter from URL
      searchParams.delete('plan');
      setSearchParams(searchParams, { replace: true });
    }, 1000);
  }
}, [searchParams, companyId, companyLoading, setSearchParams]);
```

---

### 4. Subscription Management Modal Opens
**Location**: Management Dashboard with Subscription Management modal open

**What User Sees**:
- Current subscription status (likely "Free" for new users)
- Available plans (Free, Basic, Premium)
- The plan they selected from the marketing website is visible
- "Subscribe" or "Upgrade" button for the selected plan

**User Action**: User clicks "Subscribe" or "Upgrade" button for their chosen plan

---

### 5. Redirect to Stripe Checkout
**Location**: Stripe Checkout (hosted by Stripe)

**What Happens**:
- App calls `createCheckoutSession()` which:
  1. Calls the `stripeCheckout` Lambda function
  2. Lambda creates a Stripe Checkout session
  3. Returns a Stripe Checkout URL
- User is redirected to Stripe's hosted checkout page
- User enters payment information (credit card)
- User completes payment

**Code Reference**: `src/components/SubscriptionManagement.tsx` lines 88-102

```typescript
// Paid plan - redirect to Stripe Checkout
const checkout = await createCheckoutSession(companyId, plan.stripePriceId);

// Redirect to Stripe Checkout
if (checkout && checkout.checkoutUrl) {
  window.location.href = checkout.checkoutUrl;
}
```

---

### 6. Payment Success - Return to App
**Location**: Management Dashboard (onyxdispatch.us/management?checkout=success)

**What Happens**:
- Stripe redirects back to the app with `?checkout=success` parameter
- Stripe webhook (if configured) updates the company's subscription in the database
- User sees their updated subscription status
- User now has access to all features for their subscribed tier

**Success URL**: `https://onyxdispatch.us/management?checkout=success`

**Cancel URL**: `https://onyxdispatch.us/management?checkout=canceled`

---

## Complete Flow Diagram

```
Marketing Website
    ↓ (User clicks "Subscribe to Basic")
onyxdispatch.us/?signup=true&plan=basic
    ↓ (Amplify Authenticator shows sign-up form)
User Creates Account
    ↓ (User is authenticated)
Management Dashboard
    ↓ (App detects plan parameter, opens modal)
Subscription Management Modal
    ↓ (User clicks "Subscribe")
stripeCheckout Lambda Function
    ↓ (Creates Stripe Checkout session)
Stripe Checkout Page (hosted by Stripe)
    ↓ (User enters payment info and pays)
onyxdispatch.us/management?checkout=success
    ↓ (Subscription activated)
User has access to Basic/Premium features
```

---

## Important Notes

### For New Users (No Account Yet):
1. **Must sign up first** - They cannot go directly to Stripe
2. **Account creation required** - They need a company/user account to subscribe
3. **Company is created** - When they sign up, a company record is created (or they're linked to an existing company)

### For Existing Users (Already Have Account):
- If they're already logged in and click a subscribe link, they'll:
  1. Be redirected to the app (if not already there)
  2. The subscription management modal will open automatically
  3. They can immediately proceed to Stripe checkout

### Trial Users:
- Users who sign up with `?trial=true` get a 14-day free trial
- During trial, they have Basic tier features
- After trial, they can subscribe to continue

---

## URL Parameters

### Marketing Website Links:
- `?signup=true` - Shows sign-up form (instead of sign-in)
- `?signup=true&plan=basic` - Shows sign-up form, then opens subscription modal for Basic
- `?signup=true&plan=premium` - Shows sign-up form, then opens subscription modal for Premium
- `?signup=true&trial=true` - Shows sign-up form, sets up 14-day free trial

### After Stripe Checkout:
- `?checkout=success` - Payment was successful
- `?checkout=canceled` - User canceled payment

---

## Technical Details

### Stripe Checkout Session Creation:
- **Lambda Function**: `stripeCheckout`
- **Function URL**: Set via `VITE_STRIPE_CHECKOUT_FUNCTION_URL` environment variable
- **Process**:
  1. Frontend calls Lambda with `companyId` and `priceId`
  2. Lambda creates or retrieves Stripe Customer
  3. Lambda creates Stripe Checkout Session
  4. Lambda returns checkout URL
  5. Frontend redirects user to Stripe

### Subscription Activation:
- Stripe webhook (if configured) updates company subscription
- Or manual update via Stripe Customer Portal
- Company's `subscriptionTier` and `subscriptionStatus` are updated in DynamoDB

---

## User Experience Summary

**For New Users:**
1. Click "Subscribe" on marketing website
2. Sign up for account (one-time)
3. Subscription modal opens automatically
4. Click "Subscribe" button
5. Complete payment on Stripe
6. Return to app with active subscription

**Total Steps**: 6 steps (sign-up is one-time)

**Time**: ~2-3 minutes for first-time users, ~30 seconds for returning users

---

*Last Updated: January 2026*
