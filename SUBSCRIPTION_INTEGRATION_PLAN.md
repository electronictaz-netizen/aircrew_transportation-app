# Subscription Management Integration Plan

## Overview
Integration of Stripe for subscription management in the Aircrew Transportation app. This will allow companies to subscribe to different tiers (free, basic, premium) and manage their subscriptions through the app.

## Architecture

### 1. Data Model Updates
- Extend `Company` model with Stripe-specific fields
- Track subscription metadata (customer ID, subscription ID, current period, etc.)

### 2. Backend Components (AWS Amplify)

#### A. Stripe Webhook Handler Lambda
- Listens to Stripe webhook events
- Updates Company subscription status in database
- Handles: subscription.created, subscription.updated, subscription.deleted, payment_succeeded, payment_failed

#### B. Stripe API Utilities
- Helper functions for creating customers
- Managing subscriptions
- Generating checkout sessions
- Creating customer portal sessions

### 3. Frontend Components

#### A. Subscription Management Dashboard
- View current subscription status
- See plan details and usage
- Manage billing
- Upgrade/downgrade plans

#### B. Stripe Checkout Integration
- Embedded checkout for new subscriptions
- Upgrade/downgrade flows

#### C. Stripe Customer Portal Integration
- Self-service subscription management
- Update payment methods
- View invoices
- Cancel subscriptions

### 4. Subscription Tiers

**Free Tier** (default)
- Basic trip management
- Limited to 10 trips/month
- Basic reports

**Basic Tier** ($29/month)
- Unlimited trips
- All basic features
- Standard reports
- Email support

**Premium Tier** ($99/month)
- All Basic features
- Advanced reports
- Flight status API integration
- Custom fields
- Priority support

## Implementation Steps

1. ✅ Update Company schema with subscription fields
2. ⏳ Set up Stripe account and get API keys
3. ⏳ Create webhook handler Lambda function
4. ⏳ Create subscription management UI components
5. ⏳ Integrate Stripe Checkout
6. ⏳ Integrate Stripe Customer Portal
7. ⏳ Add subscription checks for feature gating
8. ⏳ Testing and deployment

## Files to Create/Modify

### Backend
- `amplify/data/resource.ts` - Update Company model
- `amplify/functions/stripeWebhook/resource.ts` - Webhook handler
- `amplify/functions/stripeWebhook/handler.ts` - Webhook logic
- `amplify/backend.ts` - Add webhook function

### Frontend
- `src/components/SubscriptionManagement.tsx` - Subscription dashboard
- `src/components/StripeCheckout.tsx` - Checkout component
- `src/utils/stripe.ts` - Stripe API utilities
- `src/hooks/useSubscription.ts` - Subscription context/hook

### Configuration
- `.env` or environment variables for Stripe keys
- `SUBSCRIPTION_SETUP.md` - Setup instructions

## Security Considerations

- Store Stripe keys in AWS Secrets Manager or environment variables
- Verify webhook signatures
- Use HTTPS for all Stripe API calls
- Implement proper authorization checks

## Testing

- Test subscription creation
- Test webhook processing
- Test subscription upgrades/downgrades
- Test payment failure handling
- Test subscription cancellation
