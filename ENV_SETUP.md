# Environment Variables Setup Guide

## File Locations

### Frontend Environment Variables

**Location**: `.env.local` in the **project root directory** (same level as `package.json`, `vite.config.ts`)

```
Aircrew transportation app/
├── .env.local          ← Frontend environment variables go here
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
```

### Creating `.env.local`

1. Create a file named `.env.local` in the root directory:
   ```
   Aircrew transportation app/.env.local
   ```

2. Add your Stripe keys and Function URLs:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_ID_BASIC=price_...
   VITE_STRIPE_PRICE_ID_PREMIUM=price_...
   VITE_STRIPE_CHECKOUT_URL=https://[function-id].lambda-url.[region].on.aws/
   VITE_STRIPE_PORTAL_URL=https://[function-id].lambda-url.[region].on.aws/
   ```
   
   **Note**: The Function URLs (`VITE_STRIPE_CHECKOUT_URL` and `VITE_STRIPE_PORTAL_URL`) need to be obtained from AWS Lambda Console after deployment. See STRIPE_SETUP.md for instructions.

### Important Notes

- ✅ **`.env.local` is git-ignored** - Your secrets won't be committed
- ✅ **Vite prefix required** - All frontend env vars must start with `VITE_`
- ✅ **Restart dev server** - Changes to `.env.local` require restarting `npm run dev`

### Backend Environment Variables (AWS Amplify)

**Location**: AWS Amplify Console → App Settings → Environment Variables

These are set in the AWS Amplify Console, NOT in a file:

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Add:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_BASIC=price_...
   STRIPE_PRICE_ID_PREMIUM=price_...
   ```

### Environment Variable Naming

- **Frontend (`.env.local`)**: Must start with `VITE_`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `VITE_STRIPE_PRICE_ID_BASIC`
  - `VITE_STRIPE_PRICE_ID_PREMIUM`

- **Backend (AWS Console)**: No prefix needed
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_BASIC`
  - `STRIPE_PRICE_ID_PREMIUM`

### Accessing Variables in Code

**Frontend** (React/Vite):
```typescript
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const basicPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_BASIC;
```

**Backend** (Lambda functions):
```typescript
const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
```

### File Structure Example

```
Aircrew transportation app/
├── .env.local                    ← CREATE THIS FILE HERE
├── .env.example                  ← Optional: template file (can commit)
├── .gitignore                    ← Should include .env.local
├── package.json
├── vite.config.ts
├── src/
│   └── utils/
│       └── stripe.ts            ← Uses import.meta.env.VITE_...
└── amplify/
    └── functions/
        └── stripeWebhook/
            └── handler.ts       ← Uses process.env.STRIPE_SECRET_KEY
```

### Testing Environment Variables

After creating `.env.local`:

1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Check in browser console: `console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)`

### Security Best Practices

- ❌ **Never commit** `.env.local` to git
- ✅ **Do commit** `.env.example` (without real values) as a template
- ✅ **Use test keys** during development
- ✅ **Rotate keys** if accidentally committed
- ✅ **Use different keys** for dev/staging/production
