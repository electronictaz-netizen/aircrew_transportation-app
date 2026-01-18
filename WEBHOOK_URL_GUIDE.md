# How to Get Your Stripe Webhook URL

## Overview

After deploying your Amplify app, you need to get the webhook endpoint URL to configure in Stripe Dashboard.

## Method 1: After Deployment (Recommended)

### Step 1: Deploy Your App

Deploy your Amplify app to get the function URLs:

```bash
# Deploy to a branch
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID

# Or use sandbox for testing
npx ampx sandbox
```

### Step 2: Find the Webhook URL

After deployment, the webhook URL will be available in one of these locations:

#### Option A: Amplify Console

1. Go to **AWS Amplify Console** → Your App
2. Go to **Backend environments** → Your branch
3. Click on **Functions** or **Backend**
4. Find `stripeWebhook` function
5. Look for the **Function URL** or **API endpoint**

#### Option B: AWS Lambda Console

1. Go to **AWS Lambda Console**
2. Find the function named: `[app-id]-[branch]-stripeWebhook-[hash]`
3. Go to **Configuration** → **Function URL**
4. Copy the **Function URL**

#### Option C: Amplify Outputs

After deployment, check `amplify_outputs.json` or the Amplify Console for function URLs.

### Step 3: Format

The webhook URL will look like one of these:

```
https://[function-id].lambda-url.[region].on.aws/
```

or

```
https://[app-id].amplifyapp.com/api/stripe-webhook
```

or (if using custom domain)

```
https://yourdomain.com/api/stripe-webhook
```

## Method 2: Using AWS CLI

If you have AWS CLI configured:

```bash
# List all Lambda functions
aws lambda list-functions --query "Functions[?contains(FunctionName, 'stripeWebhook')].FunctionName"

# Get function URL (if configured)
aws lambda get-function-url-config --function-name [function-name]
```

## Method 3: Check Function Configuration

The webhook function needs to be configured to accept HTTP requests. Currently, it's set up as a standard Lambda function. You may need to:

1. **Add HTTP API route** in Amplify backend configuration
2. **Or configure Function URL** in AWS Lambda Console

## Current Setup Status

⚠️ **Note**: The current `stripeWebhook` function is configured but may need additional setup to expose it as an HTTP endpoint.

### Option 1: Add HTTP API Route (Recommended)

Update `amplify/backend.ts` to add an HTTP API route:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { stripeWebhook } from './functions/stripeWebhook/resource';
import { HttpApi } from '@aws-amplify/backend';

export const backend = defineBackend({
  auth,
  data,
  stripeWebhook,
});

// Add HTTP API route for webhook
backend.addOutput({
  custom: {
    webhookUrl: backend.stripeWebhook.resources.lambda.functionUrl,
  },
});
```

### Option 2: Configure Function URL Manually

1. Go to **AWS Lambda Console**
2. Find your `stripeWebhook` function
3. Go to **Configuration** → **Function URL**
4. Click **Create function URL**
5. Set:
   - **Auth type**: NONE (Stripe will verify signatures)
   - **CORS**: Configure if needed
6. Copy the **Function URL**

## Testing the Webhook URL

Once you have the URL, test it:

```bash
# Test with curl
curl -X POST https://your-webhook-url.com \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## Next Steps

1. ✅ Get the webhook URL (using one of the methods above)
2. ✅ Add it to Stripe Dashboard (see Step 4 in STRIPE_SETUP.md)
3. ✅ Configure webhook events
4. ✅ Test with Stripe CLI or test events

## Troubleshooting

**Can't find the function?**
- Make sure you've deployed the backend: `npx ampx pipeline-deploy`
- Check AWS Lambda Console directly
- Verify the function name includes "stripeWebhook"

**Function exists but no URL?**
- You may need to configure Function URL manually in AWS Console
- Or add HTTP API route configuration in backend.ts

**Need help?**
- Check AWS Amplify documentation for function URLs
- Check AWS Lambda documentation for Function URLs
- See STRIPE_SETUP.md for Stripe webhook configuration
