# How to Get Stripe Function URLs

## Overview

You need **three different Function URLs** for the Stripe integration:

1. **`VITE_STRIPE_CHECKOUT_URL`** - For creating checkout sessions (upgrade/downgrade subscriptions)
2. **`VITE_STRIPE_PORTAL_URL`** - For customer portal (manage billing)
3. **`VITE_STRIPE_WEBHOOK_URL`** - For Stripe webhooks (already configured)

## Step 1: Deploy Your Backend

First, make sure your backend is deployed:

```bash
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

Or use sandbox for testing:

```bash
npx ampx sandbox
```

## Step 2: Find Function URLs in AWS Lambda Console

### Method 1: AWS Lambda Console (Recommended)

1. Go to **AWS Lambda Console**: https://console.aws.amazon.com/lambda/
2. Find your functions (they will have names like):
   - `[app-id]-[branch]-stripeCheckout-[hash]`
   - `[app-id]-[branch]-stripePortal-[hash]`
   - `[app-id]-[branch]-stripeWebhook-[hash]`

3. For each function:
   - Click on the function name
   - Go to **Configuration** tab
   - Click **Function URL** in the left sidebar
   - Copy the **Function URL** (looks like: `https://[id].lambda-url.[region].on.aws/`)

### Method 2: AWS Amplify Console

1. Go to **AWS Amplify Console** → Your App
2. Go to **Backend environments** → Your branch
3. Click on **Functions** or **Backend**
4. Find each function (`stripeCheckout`, `stripePortal`, `stripeWebhook`)
5. Look for the **Function URL** or **API endpoint**

## Step 3: Add URLs to .env.local

Add the Function URLs to your `.env.local` file in the project root:

```env
# Stripe Function URLs
VITE_STRIPE_CHECKOUT_URL=https://[function-id].lambda-url.[region].on.aws
VITE_STRIPE_PORTAL_URL=https://[function-id].lambda-url.[region].on.aws
VITE_STRIPE_WEBHOOK_URL=https://[function-id].lambda-url.[region].on.aws
```

**Important Notes:**
- ✅ Remove trailing slashes from URLs
- ✅ Don't include `/` at the end
- ✅ Use the full URL including `https://`
- ✅ Restart your dev server after updating `.env.local`

## Step 4: Verify Function URLs Are Configured

After adding the URLs, restart your dev server:

```bash
npm run dev
```

Then check the browser console - you should see no errors about missing Function URLs.

## Troubleshooting

### Error: "Unable to connect to checkout service"

This means `VITE_STRIPE_CHECKOUT_URL` is either:
- ❌ Not set in `.env.local`
- ❌ Set incorrectly (wrong URL, trailing slash, etc.)
- ❌ The Lambda function doesn't exist or isn't deployed
- ❌ CORS is not configured on the Function URL

**Fix:**
1. Verify the function exists in AWS Lambda Console
2. Check that Function URL is enabled
3. Verify the URL in `.env.local` matches exactly
4. Make sure you restarted the dev server after updating `.env.local`

### Error: "Stripe Checkout URL not configured"

This means `VITE_STRIPE_CHECKOUT_URL` is missing from `.env.local`.

**Fix:**
1. Get the Function URL from AWS Lambda Console (see Step 2)
2. Add it to `.env.local` as `VITE_STRIPE_CHECKOUT_URL=...`
3. Restart your dev server

### Function URL Returns 403 or CORS Error

The Function URL might not have CORS configured.

**Fix:**
1. Go to AWS Lambda Console → Your function
2. Configuration → Function URL
3. Edit CORS settings:
   - **Allow origins**: `*` (or your domain)
   - **Allow methods**: `POST`
   - **Allow headers**: `Content-Type`
4. Save and test again

### Can't Find the Functions

If you can't find the functions in AWS Lambda Console:

1. **Check if backend is deployed:**
   ```bash
   npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
   ```

2. **Check function names:**
   - They might have different naming patterns
   - Search for "stripe" in the Lambda Console
   - Check the Amplify Console for function names

3. **Verify functions are defined:**
   - Check `amplify/backend.ts` includes the functions
   - Check `amplify/functions/stripeCheckout/resource.ts` exists
   - Check `amplify/functions/stripePortal/resource.ts` exists

## Testing Function URLs

Once configured, test the URLs:

### Test Checkout URL:
```bash
curl -X POST https://[your-checkout-url] \
  -H "Content-Type: application/json" \
  -d '{"companyId":"test","priceId":"price_test","successUrl":"https://example.com/success","cancelUrl":"https://example.com/cancel"}'
```

### Test Portal URL:
```bash
curl -X POST https://[your-portal-url] \
  -H "Content-Type: application/json" \
  -d '{"companyId":"test","returnUrl":"https://example.com"}'
```

You should get a JSON response (even if it's an error, it means the function is reachable).

## Next Steps

After configuring Function URLs:

1. ✅ Test subscription upgrade in the app
2. ✅ Test customer portal access
3. ✅ Verify webhooks are working (see WEBHOOK_URL_GUIDE.md)
4. ✅ Check CloudWatch logs for any errors

## Related Documentation

- `STRIPE_SETUP.md` - Complete Stripe setup guide
- `WEBHOOK_URL_GUIDE.md` - Webhook configuration
- `ENV_SETUP.md` - Environment variable setup
