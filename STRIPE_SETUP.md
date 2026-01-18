# Stripe Subscription Setup Guide

This guide will help you set up Stripe for subscription management in the Aircrew Transportation app.

## Prerequisites

1. Stripe account (create one at https://stripe.com)
2. AWS Amplify app deployed
3. Access to AWS Console

## Step 1: Create Stripe Products and Prices

1. Log in to your Stripe Dashboard
2. Go to **Products** → **Add Product**
3. Create products for each subscription tier:

### Basic Plan
- **Name**: Basic Plan
- **Price**: $29/month
- **Billing period**: Monthly
- **Copy the Price ID** (starts with `price_`)

### Premium Plan
- **Name**: Premium Plan
- **Price**: $99/month
- **Billing period**: Monthly
- **Copy the Price ID** (starts with `price_`)

## Step 2: Get Stripe API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)
   - ⚠️ Keep this secret! Never commit it to version control

## Step 3: Set Environment Variables

### Frontend (Vite)

**⚠️ IMPORTANT**: `.env.local` is for **PUBLIC** keys only! Never put secret keys here.

**File Location**: Create `.env.local` in the **project root directory** (same level as `package.json`)

```
Aircrew transportation app/
├── .env.local          ← CREATE THIS FILE HERE
├── package.json
├── vite.config.ts
└── src/
```

**Contents** (add to `.env.local`):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID_BASIC=price_...
VITE_STRIPE_PRICE_ID_PREMIUM=price_...
```

**Important**: 
- The `.env.local` file must be in the **root directory** (same folder as `package.json`)
- All Vite environment variables must start with `VITE_`
- Restart your dev server after creating/updating `.env.local`
- See `.env.example` for a template (already created)

### Backend (AWS Amplify)

Add to AWS Amplify Console → App Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Step 4)
```

## Step 4: Get Your Webhook URL

After deploying your app, you need to get the webhook endpoint URL:

### Option A: AWS Lambda Console (Easiest)

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your function: `[app-id]-[branch]-stripeWebhook-[hash]`
3. Go to **Configuration** → **Function URL**
4. If no URL exists, click **Create function URL**:
   - **Auth type**: NONE (Stripe verifies signatures)
   - **CORS**: Enable if needed
5. Copy the **Function URL** (looks like: `https://[id].lambda-url.[region].on.aws/`)

### Option B: AWS Amplify Console

1. Go to AWS Amplify Console → Your App
2. **Backend environments** → Your branch
3. **Functions** → Find `stripeWebhook`
4. View the function URL or endpoint

### Option C: After First Deployment

The URL will be available after you deploy:
```bash
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

Then check the function URL in AWS Lambda Console.

**See `WEBHOOK_URL_GUIDE.md` for detailed instructions.**

## Step 5: Configure Webhook in Stripe

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: Paste the Function URL from Step 4
4. **Events to send**: Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
   - Add this to AWS Amplify Console → App Settings → Environment Variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Deploy Schema Changes

After updating the schema with Stripe fields:

```bash
npx ampx sandbox
```

Or deploy to your branch:

```bash
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

## Step 6: Test Integration

1. Create a test company with subscription tier "free"
2. Try upgrading to Basic or Premium (will show placeholder message until Checkout is integrated)
3. Monitor Stripe Dashboard for webhook events
4. Check AWS CloudWatch logs for webhook processing

## Next Steps

1. **Implement Stripe Checkout**: Create checkout session Lambda function
2. **Implement Customer Portal**: Create portal session Lambda function  
3. **Test Webhooks**: Set up local webhook testing with Stripe CLI
4. **Add Feature Gating**: Use subscription tier to control feature access

## Stripe CLI for Local Testing

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
```

## Security Best Practices

- ✅ Never commit Stripe keys to version control
- ✅ Use environment variables for all keys
- ✅ Verify webhook signatures
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting on webhook endpoint
- ✅ Use Stripe's test mode during development

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Billing Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [AWS Amplify Functions](https://docs.amplify.aws/react/build-a-backend/functions/)
