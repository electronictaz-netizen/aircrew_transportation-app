# How to Set Lambda Environment Variables in Amplify

## Important: Use Amplify Console, NOT Lambda Console

In AWS Amplify Gen 2, environment variables for Lambda functions are set in the **AWS Amplify Console**, not directly in the Lambda Console. The Amplify Console automatically makes these variables available to all Lambda functions.

## Step-by-Step Instructions

### Step 1: Go to AWS Amplify Console

1. Go to **AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. Select your app (the one with your application)
3. Make sure you're on the correct branch (usually `main`)

### Step 2: Navigate to Environment Variables

1. In the left sidebar, click **App settings**
2. Click **Environment variables** (under "App settings")

### Step 3: Add Environment Variables

Click **Manage variables** or **Add variable** and add these variables:

**Required Variables:**

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
```

**How to add each variable:**

1. Click **Add variable** or **+ Add environment variable**
2. **Key**: Enter the variable name (e.g., `STRIPE_SECRET_KEY`)
3. **Value**: Enter the value (e.g., your Stripe secret key starting with `sk_test_`)
4. **Branch**: Select which branch(es) this applies to (usually `main` or `*` for all)
5. Click **Save**

### Step 4: Verify Variables Are Set

After adding all variables, you should see them listed in the Environment variables section.

### Step 5: Redeploy Your App

After adding environment variables:

1. Go to your app's main page
2. Click **Redeploy this version** (or trigger a new deployment)
3. Wait for the deployment to complete

**OR** if you have auto-deploy enabled, just push a commit to trigger a new build.

## Where to Get the Values

### STRIPE_SECRET_KEY
- Go to Stripe Dashboard → Developers → API keys
- Copy the **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

### STRIPE_WEBHOOK_SECRET
- Go to Stripe Dashboard → Developers → Webhooks
- Click on your webhook endpoint
- Copy the **Signing secret** (starts with `whsec_`)

### STRIPE_PRICE_ID_BASIC
- Go to Stripe Dashboard → Products
- Find your Basic plan product
- Click on the price
- Copy the **Price ID** (starts with `price_`)

### STRIPE_PRICE_ID_PREMIUM
- Same as above, but for your Premium plan

## Important Notes

⚠️ **Security:**
- These are **secret keys** - never commit them to git
- They're stored securely in AWS Amplify Console
- Only people with Amplify Console access can see them

⚠️ **Branch-Specific:**
- You can set different values for different branches
- For example, use test keys for `dev` branch and live keys for `main` branch

⚠️ **After Adding Variables:**
- You **must redeploy** for changes to take effect
- The Lambda functions will automatically have access to these variables
- They're available as `process.env.STRIPE_SECRET_KEY`, etc.

## Troubleshooting

### Variables Not Working?

1. **Check you're in the right place:**
   - ✅ AWS Amplify Console → App Settings → Environment Variables
   - ❌ NOT AWS Lambda Console → Configuration → Environment Variables

2. **Verify the variable names:**
   - Must be exactly: `STRIPE_SECRET_KEY` (case-sensitive)
   - No spaces or typos

3. **Check branch selection:**
   - Make sure variables are set for the branch you're deploying
   - Use `*` to apply to all branches

4. **Redeploy after adding:**
   - Environment variables only take effect after a new deployment
   - Trigger a new build/deployment

5. **Check CloudWatch logs:**
   - If still not working, check CloudWatch logs
   - Look for "STRIPE_SECRET_KEY not configured" errors

## Verification

After setting variables and redeploying, you can verify they're working by:

1. Check CloudWatch logs - should NOT see "STRIPE_SECRET_KEY not configured"
2. Try the checkout flow again - should work now
3. The Lambda function will have access to `process.env.STRIPE_SECRET_KEY`

## Related Documentation

- `ENV_SETUP.md` - General environment variable setup
- `STRIPE_SETUP.md` - Complete Stripe integration guide
- `FUNCTION_URLS_GUIDE.md` - Function URL configuration
