# ⚠️ IMPORTANT: Environment Variable Security

## Critical Security Warning

**DO NOT put your Stripe Secret Key in `.env.local`!**

The `.env.local` file is for **frontend** environment variables only. Since frontend code runs in the browser, anything in `.env.local` becomes **publicly visible** to anyone who views your website's source code.

## What Goes Where

### ✅ `.env.local` (Frontend - Public)
**Location**: Project root directory  
**Use for**: Values that are safe to expose publicly

```env
# ✅ SAFE - These are meant to be public
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...     # Public key, safe to expose
VITE_STRIPE_PRICE_ID_BASIC=price_...
VITE_STRIPE_PRICE_ID_PREMIUM=price_...
```

**Why safe?** Stripe publishable keys are designed to be used in frontend code.

### ❌ `.env.local` (Frontend - DO NOT ADD)
```env
# ❌ NEVER PUT THESE IN .env.local
STRIPE_SECRET_KEY=sk_test_...              # SECRET - Keep this private!
STRIPE_WEBHOOK_SECRET=whsec_...            # SECRET - Keep this private!
```

**Why dangerous?** If these are in `.env.local`, they get bundled into your JavaScript and anyone can see them by inspecting your website!

### ✅ AWS Amplify Console (Backend - Private)
**Location**: AWS Amplify Console → App Settings → Environment Variables  
**Use for**: Secret keys that must stay private

```
STRIPE_SECRET_KEY=sk_test_...              # ✅ Safe here - backend only
STRIPE_WEBHOOK_SECRET=whsec_...            # ✅ Safe here - backend only
STRIPE_PRICE_ID_BASIC=price_...            # Optional: Can be here too
STRIPE_PRICE_ID_PREMIUM=price_...          # Optional: Can be here too
```

**Why safe?** These only run in Lambda functions (backend), never in the browser.

## If You Already Added Secret Key to `.env.local`

1. **Remove it immediately** from `.env.local`
2. **Add it to AWS Amplify Console** instead:
   - Go to AWS Amplify Console
   - Select your app
   - App Settings → Environment Variables
   - Add `STRIPE_SECRET_KEY` with your secret key value
3. **Rotate your Stripe keys** if the secret key was committed to git or deployed
   - Generate new keys in Stripe Dashboard
   - Update both `.env.local` (publishable) and AWS (secret)

## Quick Check

**Correct `.env.local` should ONLY have:**
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY` (starts with `pk_`)
- ✅ `VITE_STRIPE_PRICE_ID_BASIC` (starts with `price_`)
- ✅ `VITE_STRIPE_PRICE_ID_PREMIUM` (starts with `price_`)

**Should NOT have:**
- ❌ `STRIPE_SECRET_KEY` (starts with `sk_`) - Put in AWS Console
- ❌ `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`) - Put in AWS Console
- ❌ Any other secret keys

## Verification

After fixing, verify:
1. `.env.local` only has `VITE_` prefixed variables
2. Secret keys are in AWS Amplify Console Environment Variables
3. Restart dev server: `npm run dev`
