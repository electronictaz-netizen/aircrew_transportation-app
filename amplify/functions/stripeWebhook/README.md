# Stripe Webhook Function

This Lambda function handles Stripe webhook events to keep subscription status in sync.

## Getting the Webhook URL

After deploying, get the webhook URL using one of these methods:

### Method 1: AWS Lambda Console

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find function: `[app-id]-[branch]-stripeWebhook-[hash]`
3. Go to **Configuration** → **Function URL**
4. If not created, click **Create function URL**
   - Auth type: **NONE** (Stripe verifies signatures)
   - CORS: Enable if needed
5. Copy the **Function URL**

### Method 2: AWS CLI

```bash
aws lambda get-function-url-config \
  --function-name [your-function-name]
```

### Method 3: Amplify Console

1. AWS Amplify Console → Your App
2. Backend environments → Your branch
3. Functions → stripeWebhook
4. View function URL or endpoint

## URL Format

The webhook URL will be:
```
https://[function-id].lambda-url.[region].on.aws/
```

## Configure in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. Paste the Function URL
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add to AWS Amplify Console → Environment Variables as `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe CLI to test locally:

```bash
stripe listen --forward-to http://localhost:3000/stripe-webhook
stripe trigger customer.subscription.created
```
