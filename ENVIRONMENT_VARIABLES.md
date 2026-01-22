# Environment Variables Setup Guide

## Overview

**Yes, you should set production environment variables on the `main` branch.**

Each branch (main/dev) can have different environment variables. This allows you to:
- Use production values on `main` (production)
- Use test/dev values on `dev` (staging)

## Environment Variables by Branch

### Main Branch (Production) ✅

Set these in: **Amplify Console → App settings → Environment variables → Select `main` branch**

#### Frontend Variables (VITE_*)
These are used by the React app and are public (visible in browser):

```bash
# Email Function
VITE_SEND_INVITATION_EMAIL_URL=https://[main-lambda-function-url].lambda-url.us-east-1.on.aws/

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (production key)
VITE_STRIPE_PRICE_ID_BASIC=price_... (production price ID)
VITE_STRIPE_PRICE_ID_PREMIUM=price_... (production price ID)
VITE_STRIPE_CHECKOUT_URL=https://[main-checkout-lambda-url].lambda-url.us-east-1.on.aws/
VITE_STRIPE_PORTAL_URL=https://[main-portal-lambda-url].lambda-url.us-east-1.on.aws/

# Flight Status API
VITE_FLIGHT_API_PROVIDER=aviationstack (or flightaware)
VITE_FLIGHT_API_KEY=your_production_key
# OR for multiple providers:
VITE_FLIGHT_API_PROVIDERS=aviationstack,flightaware
VITE_FLIGHT_API_KEY_AVIATIONSTACK=your_key
VITE_FLIGHT_API_KEY_FLIGHTAWARE=your_key

# Google Places (optional)
VITE_GOOGLE_PLACES_API_KEY=your_production_key (if using Google Places)

# Branding
VITE_SERVICE_PROVIDER_NAME=Onyx Transportation (or your company name)
VITE_SERVICE_PROVIDER_TAGLINE=Your tagline (optional)
VITE_SERVICE_PROVIDER_LOGO=https://your-logo-url.com/logo.png (optional)
```

#### Backend Variables (Lambda Functions)
These are used by Lambda functions and are private:

**For `sendInvitationEmail` Lambda:**
```bash
SENDGRID_API_KEY=your_production_sendgrid_key (or POSTMARK_API_KEY)
EMAIL_FROM=noreply@onyxdispatch.us
```

**For `stripeCheckout` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_live_... (production secret key)
FRONTEND_URL=https://main.d1wxo3x0z5r1oq.amplifyapp.com (your production URL)
```

**For `stripePortal` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_live_... (production secret key)
FRONTEND_URL=https://main.d1wxo3x0z5r1oq.amplifyapp.com (your production URL)
```

**For `stripeWebhook` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_live_... (production secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (production webhook secret)
STRIPE_PRICE_ID_BASIC=price_... (production price ID)
STRIPE_PRICE_ID_PREMIUM=price_... (production price ID)
```

### Dev Branch (Staging/Testing) 🧪

Set these in: **Amplify Console → App settings → Environment variables → Select `dev` branch**

#### Frontend Variables (VITE_*)
```bash
# Email Function (use dev Lambda URL)
VITE_SEND_INVITATION_EMAIL_URL=https://[dev-lambda-function-url].lambda-url.us-east-1.on.aws/

# Stripe (can use test mode keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (test mode key is OK for dev)
VITE_STRIPE_PRICE_ID_BASIC=price_... (can use test price IDs)
VITE_STRIPE_PRICE_ID_PREMIUM=price_... (can use test price IDs)
VITE_STRIPE_CHECKOUT_URL=https://[dev-checkout-lambda-url].lambda-url.us-east-1.on.aws/
VITE_STRIPE_PORTAL_URL=https://[dev-portal-lambda-url].lambda-url.us-east-1.on.aws/

# Flight Status API (can use same keys or test keys)
VITE_FLIGHT_API_PROVIDER=aviationstack
VITE_FLIGHT_API_KEY=your_key (can be same as production or test key)

# Google Places (optional, can use same key)
VITE_GOOGLE_PLACES_API_KEY=your_key

# Branding (same as production usually)
VITE_SERVICE_PROVIDER_NAME=Onyx Transportation
VITE_SERVICE_PROVIDER_TAGLINE=Your tagline
VITE_SERVICE_PROVIDER_LOGO=https://your-logo-url.com/logo.png
```

#### Backend Variables (Lambda Functions)
**For `sendInvitationEmail` Lambda:**
```bash
SENDGRID_API_KEY=your_sendgrid_key (can use same or test server)
EMAIL_FROM=noreply@onyxdispatch.us
```

**For `stripeCheckout` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_test_... (test mode key recommended for dev)
FRONTEND_URL=https://dev.d1wxo3x0z5r1oq.amplifyapp.com (your dev URL)
```

**For `stripePortal` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_test_... (test mode key recommended for dev)
FRONTEND_URL=https://dev.d1wxo3x0z5r1oq.amplifyapp.com (your dev URL)
```

**For `stripeWebhook` Lambda:**
```bash
STRIPE_SECRET_KEY=sk_test_... (test mode key recommended for dev)
STRIPE_WEBHOOK_SECRET=whsec_... (dev webhook secret)
STRIPE_PRICE_ID_BASIC=price_... (test price IDs)
STRIPE_PRICE_ID_PREMIUM=price_... (test price IDs)
```

## How to Set Environment Variables in Amplify

### Step-by-Step

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Go to **"App settings"** → **"Environment variables"**
4. **Important**: Use the branch selector at the top to choose:
   - `main` for production variables
   - `dev` for staging variables
5. Click **"Manage variables"** or **"Add variable"**
6. Add each variable:
   - **Key**: Variable name (e.g., `VITE_SEND_INVITATION_EMAIL_URL`)
   - **Value**: Variable value
7. Click **"Save"**
8. **Redeploy** the branch (Amplify may auto-redeploy, or trigger manually)

### For Lambda Function Variables

Lambda function environment variables are set differently:

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your function (e.g., `amplify-...-main-...-sendInvitationEmail-...`)
3. Go to **"Configuration"** → **"Environment variables"**
4. Click **"Edit"**
5. Add variables
6. **Save**

**Note**: For each branch, you'll have separate Lambda functions, so set variables for:
- Main branch functions: `amplify-...-main-...-*`
- Dev branch functions: `amplify-...-dev-...-*`

## Best Practices

### ✅ DO

- **Use production keys on `main`** - Real API keys, production Stripe keys
- **Use test keys on `dev`** - Test Stripe keys, test email servers (if available)
- **Use dev Lambda URLs on dev** - Each branch has its own Lambda functions
- **Use production URLs on main** - Production frontend URL for redirects
- **Keep secrets secure** - Never commit API keys to git
- **Document your variables** - Keep a list (like this guide)

### ❌ DON'T

- **Don't use production Stripe keys on dev** - Use test mode keys
- **Don't mix branch URLs** - Don't use dev Lambda URL on main branch
- **Don't commit `.env` files** - They're in `.gitignore` for a reason
- **Don't hardcode values** - Always use environment variables

## Quick Checklist

### Main Branch (Production)
- [ ] `VITE_SEND_INVITATION_EMAIL_URL` → Main Lambda Function URL
- [ ] `SENDGRID_API_KEY` (or `POSTMARK_API_KEY`) → Production key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` → Production key (`pk_live_...`)
- [ ] `STRIPE_SECRET_KEY` (Lambda) → Production key (`sk_live_...`)
- [ ] `VITE_FLIGHT_API_KEY` → Production API key
- [ ] All Lambda functions have production keys
- [ ] All `FRONTEND_URL` variables point to production URL

### Dev Branch (Staging)
- [ ] `VITE_SEND_INVITATION_EMAIL_URL` → Dev Lambda Function URL
- [ ] `SENDGRID_API_KEY` (or `POSTMARK_API_KEY`) → Can use same or test key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` → Test key (`pk_test_...`) recommended
- [ ] `STRIPE_SECRET_KEY` (Lambda) → Test key (`sk_test_...`) recommended
- [ ] `VITE_FLIGHT_API_KEY` → Can use same or test key
- [ ] All Lambda functions have dev/test keys
- [ ] All `FRONTEND_URL` variables point to dev URL

## Finding Your Lambda Function URLs

### For Main Branch
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find function: `amplify-d1wxo3x0z5r1oq-main-*-sendInvitationEmail-*`
3. Configuration → Function URL → Copy URL

### For Dev Branch
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find function: `amplify-d1wxo3x0z5r1oq-dev-*-sendInvitationEmail-*`
3. Configuration → Function URL → Copy URL

## Summary

**Yes, set all production environment variables on the `main` branch.**

- **Main branch** = Production environment = Production values
- **Dev branch** = Staging environment = Test/dev values (or same values if you prefer)

Each branch is completely independent, so you can have different configurations for testing vs. production.
