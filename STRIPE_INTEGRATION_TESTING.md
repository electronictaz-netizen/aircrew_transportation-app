# Stripe Integration Testing Guide

This guide helps you verify that your Stripe integration is working correctly.

## Prerequisites Checklist

Before testing, ensure:

- ✅ Backend build succeeded (all Lambda functions deployed)
- ✅ Environment variables configured in AWS Amplify Console:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_BASIC` (optional)
  - `STRIPE_PRICE_ID_PREMIUM` (optional)
- ✅ Frontend environment variables in `.env.local`:
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `VITE_STRIPE_PRICE_ID_BASIC`
  - `VITE_STRIPE_PRICE_ID_PREMIUM`
  - `VITE_STRIPE_CHECKOUT_URL`
  - `VITE_STRIPE_PORTAL_URL`

## Step 1: Verify Lambda Functions are Deployed

1. Go to **AWS Lambda Console**
2. Search for functions starting with your app ID and branch:
   - `[app-id]-[branch]-stripeWebhook-[hash]`
   - `[app-id]-[branch]-stripeCheckout-[hash]`
   - `[app-id]-[branch]-stripePortal-[hash]`
3. All three functions should exist and show status "Active"

**If functions don't exist**: Build/deployment may have failed. Check Amplify build logs.

## Step 2: Configure Lambda Function URLs

### For stripeCheckout:

1. Lambda Console → Select `stripeCheckout` function
2. **Configuration** → **Function URL**
3. If no URL exists, click **Create function URL**:
   - **Auth type**: `NONE`
   - **CORS**: Enable and configure:
     ```
     Allowed origins: https://your-amplify-app.amplifyapp.com
     Allowed methods: POST, OPTIONS
     Allowed headers: Content-Type
     ```
4. **Copy the Function URL** - you'll need this for `.env.local`

### For stripePortal:

1. Repeat the same steps for `stripePortal` function
2. **Copy the Function URL**

### For stripeWebhook:

1. Repeat the same steps for `stripeWebhook` function
2. **Copy the Function URL** - you'll need this for Stripe Dashboard

## Step 3: Update Frontend Environment Variables

1. Open `.env.local` in your project root
2. Add the Function URLs you copied:
   ```env
   VITE_STRIPE_CHECKOUT_URL=https://[function-id].lambda-url.[region].on.aws/
   VITE_STRIPE_PORTAL_URL=https://[function-id].lambda-url.[region].on.aws/
   ```
3. **Restart your dev server** if running locally

## Step 4: Configure Stripe Webhook

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint** (or edit existing)
3. **Endpoint URL**: Paste the `stripeWebhook` Function URL
4. **Events to send**: Select:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to AWS Amplify Console → **Environment Variables** as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test Frontend Integration

### 5.1 Open Subscription Management

1. Log into your app
2. Navigate to Management Dashboard
3. Look for a **Subscription Management** button or link
4. Click to open the subscription management UI

### 5.2 Verify Current Subscription Display

- Current plan should be displayed
- Subscription status should show (e.g., "active", "free")
- If on a paid plan, renewal date should be shown

### 5.3 Test Upgrade Flow (Free → Paid)

1. If currently on Free plan, click **"Upgrade to Basic"** or **"Upgrade to Premium"**
2. **Expected behavior**:
   - ✅ Loading indicator appears
   - ✅ Browser redirects to Stripe Checkout page
   - ✅ Checkout page shows correct plan details
3. **In Stripe Test Mode**:
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
4. Complete the checkout
5. **Expected result**:
   - ✅ Redirected back to your app at `/management?checkout=success`
   - ✅ Subscription status updates in your app
   - ✅ Company record in database updates with Stripe customer/subscription IDs

### 5.4 Test Customer Portal

1. If on a paid plan, click **"Manage Billing"** button
2. **Expected behavior**:
   - ✅ Browser redirects to Stripe Customer Portal
   - ✅ Portal shows current subscription details
   - ✅ Can update payment method, view invoices, cancel subscription

## Step 6: Test Webhook Events

### 6.1 Monitor CloudWatch Logs

1. Go to **AWS CloudWatch Console**
2. **Logs** → **Log groups**
3. Find log group: `/aws/lambda/[app-id]-[branch]-stripeWebhook-[hash]`
4. Open the most recent log stream

### 6.2 Send Test Webhook from Stripe

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select event type: `customer.subscription.created`
5. Click **Send test webhook**

### 6.3 Verify Webhook Processing

1. Check CloudWatch logs for:
   - ✅ "Received Stripe webhook event" message
   - ✅ "Updated company [id] subscription" message
   - ❌ No error messages

2. Check your app's database:
   - Company record should have updated `subscriptionStatus`
   - Company record should have `stripeSubscriptionId` populated

### 6.4 Test Real Subscription Events

1. Create a subscription via Checkout (Step 5.3)
2. Monitor CloudWatch logs - you should see:
   - `customer.subscription.created` event processed
   - Company subscription updated in database

## Step 7: Verify Database Updates

1. Go to your Amplify Data backend (GraphQL API)
2. Query your Company model to verify:
   ```graphql
   query GetCompany {
     getCompany(id: "your-company-id") {
       id
       subscriptionTier
       subscriptionStatus
       stripeCustomerId
       stripeSubscriptionId
       stripePriceId
       subscriptionCurrentPeriodEnd
     }
   }
   ```

**Expected fields after subscription:**
- `stripeCustomerId`: Should have a value starting with `cus_`
- `stripeSubscriptionId`: Should have a value starting with `sub_`
- `stripePriceId`: Should match the price you selected
- `subscriptionTier`: Should be "basic" or "premium"
- `subscriptionStatus`: Should be "active"
- `subscriptionCurrentPeriodEnd`: Should be a future date

## Step 8: Test Error Scenarios

### 8.1 Missing Environment Variables

- **Test**: Remove `VITE_STRIPE_CHECKOUT_URL` from `.env.local`
- **Expected**: Clear error message when trying to upgrade
- **Verify**: App doesn't crash, shows helpful error to user

### 8.2 Invalid Function URL

- **Test**: Use wrong Function URL in `.env.local`
- **Expected**: Network error or 404 response
- **Verify**: App handles error gracefully

### 8.3 Webhook Signature Verification

- **Test**: Send invalid webhook (modify signature)
- **Expected**: Webhook handler returns 400 error
- **Verify**: Invalid requests are rejected

## Troubleshooting

### Issue: "Checkout URL not configured" error

**Solution:**
- Verify `VITE_STRIPE_CHECKOUT_URL` is set in `.env.local`
- Restart dev server after adding environment variable
- For production, add to AWS Amplify Console → Environment Variables

### Issue: Checkout button does nothing / no redirect

**Check:**
- Browser console for JavaScript errors
- Network tab for failed API calls
- Function URL is accessible (test with curl)

### Issue: Webhook events not processing

**Check:**
- Webhook URL in Stripe Dashboard is correct
- `STRIPE_WEBHOOK_SECRET` is configured in AWS
- CloudWatch logs for error messages
- Webhook endpoint is accessible (Function URL status)

### Issue: Subscription doesn't update after checkout

**Check:**
- CloudWatch logs for webhook processing
- Database for subscription fields
- Webhook is properly configured in Stripe
- Webhook events are being sent (Stripe Dashboard → Webhooks → Events)

### Issue: Function URL returns 403 or CORS errors

**Check:**
- Function URL auth type is set to `NONE`
- CORS is enabled and configured correctly
- Allowed origins include your app URL

## Quick Test Checklist

- [ ] All three Lambda functions deployed and active
- [ ] Function URLs created for checkout, portal, and webhook
- [ ] Environment variables configured (frontend and backend)
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Can open Subscription Management UI in app
- [ ] Upgrade button redirects to Stripe Checkout
- [ ] Test checkout completes successfully
- [ ] Redirects back to app after checkout
- [ ] Customer Portal opens correctly
- [ ] Webhook events are received and processed
- [ ] Database updates with subscription information

## Next Steps

Once integration is verified:

1. **Test in production** (use Stripe live mode keys)
2. **Set up monitoring** - CloudWatch alarms for webhook failures
3. **Add feature gating** - Use subscription tier to control features
4. **Test subscription cancellation** - Verify it updates correctly
5. **Test subscription renewal** - Monitor invoice events

## Support

- **Stripe Dashboard**: https://dashboard.stripe.com/test/logs
- **AWS CloudWatch**: Check Lambda function logs
- **Amplify Console**: Check build and deployment logs
- **Documentation**: See `STRIPE_SETUP.md` for setup details
