# Flight Status API Setup Guide

This application supports multiple flight status API providers. Choose the one that best fits your needs.

## Supported APIs

1. **AviationStack** (Recommended) - Easy setup, good free tier
2. **FlightAware** - Comprehensive data, requires account approval (Note: Has CORS restrictions)

---

## AviationStack API Setup

### Step 1: Create Account
1. Go to [https://aviationstack.com/](https://aviationstack.com/)
2. Click "Sign Up" or "Get Started"
3. Create a free account (free tier includes 1,000 requests/month)

### Step 2: Get API Key
1. After signing up, go to your dashboard
2. Navigate to "API Access" or "API Keys"
3. Copy your API key (starts with something like `abc123...`)

### Step 3: Configure in AWS Amplify
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add the following variables:
   - **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `aviationstack`
   - **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: `your_api_key_here` (paste your actual API key)

### Step 4: Verify Setup
1. Deploy your app
2. Open browser console (F12)
3. Run: `debugFlightAPI()`
4. You should see successful API connection

**Free Tier Limits:**
- 1,000 requests/month
- 100 requests/day
- Perfect for small to medium operations

**Pricing:**
- Free: 1,000 requests/month
- Basic: $49/month - 10,000 requests/month
- Professional: $99/month - 50,000 requests/month

---

## FlightAware AeroAPI Setup

⚠️ **IMPORTANT CORS LIMITATION**: FlightAware AeroAPI does **NOT** support direct browser calls due to CORS (Cross-Origin Resource Sharing) restrictions. 

**Options:**
1. **Remove FlightAware** from your provider list (recommended for browser-only apps)
2. **Use a backend proxy** - Create an AWS Lambda function or API Gateway endpoint to proxy requests to AeroAPI
3. **Use AviationStack or FlightRadar24** instead, which support browser requests

If you still want to configure FlightAware (for future backend implementation), here's how:

FlightAware's AeroAPI is their modern REST API that uses API key authentication via headers.

### Step 1: Create Account
1. Go to [https://flightaware.com/](https://flightaware.com/)
2. Click "Sign Up" or "Create Account"
3. Complete registration

### Step 2: Get AeroAPI Access
1. Go to [FlightAware AeroAPI](https://www.flightaware.com/aeroapi/)
2. Sign up for AeroAPI access
3. You may need to:
   - Verify your account
   - Request API access (may require approval for some plans)
   - Choose a plan (free tier available with limitations)

### Step 3: Get API Key
1. Log into your FlightAware account
2. Navigate to **AeroAPI** section or **API Keys**
3. Generate or copy your **AeroAPI Key**
   - This is different from FlightXML credentials
   - Format: Usually a long alphanumeric string

### Step 4: Configure in AWS Amplify
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add the following variables:

**For Multi-Provider Setup (Recommended):**
   - **Key**: `VITE_FLIGHT_API_PROVIDERS`
   - **Value**: `aviationstack,flightaware` (or include flightradar24 if you have access)
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTAWARE`
   - **Value**: `your_aeroapi_key_here` (paste your AeroAPI key)

**For Single Provider Setup:**
   - **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `flightaware`
   - **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: `your_aeroapi_key_here` (paste your AeroAPI key)

### Step 5: Verify Configuration
1. Deploy your app
2. Test flight status check
3. Check browser console for `[flightaware]` logs
4. Should see successful API calls or clear error messages

**Note:** AeroAPI uses header-based authentication (`x-apikey` header). The current implementation handles this automatically.

**Pricing:**
- Free tier: Limited (check current offerings)
- Commercial: Contact FlightAware for pricing
- Enterprise: Custom pricing

**API Documentation:**
- [FlightAware FlightXML Documentation](https://flightaware.com/commercial/flightxml/v3/documentation)

---

## FlightRadar24 API Setup

⚠️ **IMPORTANT NOTE:** FlightRadar24 API is not publicly available and requires special business access. The current implementation is a placeholder and may return 400 errors. If you see 400 Bad Request errors, FlightRadar24 is likely not configured correctly or not available for your use case.

### Current Status
- FlightRadar24 API endpoint structure in this code is a placeholder
- The API may require different authentication or endpoint format
- 400 Bad Request errors indicate the API call format is incorrect
## FlightRadar24 API Setup

FlightRadar24 provides a REST API that requires a valid API subscription and API key. The API uses header-based authentication.

### Step 1: Create Account and Subscribe
1. Go to [FlightRadar24 Business API](https://www.flightradar24.com/business/api)
2. Sign up for a business/enterprise account
3. Subscribe to an API plan that suits your needs
4. You can also use the Sandbox environment for free testing

### Step 2: Generate API Token
1. Log into your FlightRadar24 account
2. Navigate to **Key Management** page
3. Generate your API token
4. Copy the API token (keep it secure)

### Step 3: Configure in AWS Amplify

**For Multi-Provider Setup (Recommended):**
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add the following variables:
   - **Key**: `VITE_FLIGHT_API_PROVIDERS`
   - **Value**: `flightradar24` (or `aviationstack,flightradar24` for multiple providers)
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTRADAR24`
   - **Value**: `your_api_token_here` (paste your actual API token)

**For Single Provider Setup:**
1. **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `flightradar24`
2. **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: `your_api_token_here`

### Step 4: Verify Configuration
1. Deploy your app
2. Test flight status check
3. Check browser console for `[flightradar24]` logs
4. Should see successful API calls or clear error messages

### How It Works

The implementation uses:
- **Endpoint**: `https://api.flightradar24.com/common/v1/flight/list.json`
- **Authentication**: API token in `x-api-key` header
- **Parameters**: Flight number in query string
- **Date Filtering**: Optional date parameter for historical flights

### Error Handling

The code handles:
- **400 Bad Request**: Invalid API endpoint, parameters, or API key
- **401 Unauthorized**: Invalid API token
- **403 Forbidden**: Access denied or quota exceeded
- **429 Too Many Requests**: Rate limit exceeded

All errors trigger automatic fallback to the next provider in your list.

### Pricing

- **Sandbox**: Free for testing (limited)
- **Commercial**: Contact FlightRadar24 for pricing
- **Enterprise**: Custom pricing based on request volume

### API Documentation

For detailed API documentation:
- [FlightRadar24 API Documentation](https://www.flightradar24.com/business/api)
- [FlightRadar24 Support](https://support.fr24.com/)

### Notes

- FlightRadar24 API requires a valid subscription
- API token must be kept secure
- Rate limits apply based on your plan
- The code automatically handles authentication headers
- Date filtering is supported for historical flights

---

## Local Development Setup

For local testing, you can create a local config file (this file is gitignored and won't be committed):

### Option 1: Create Local Config File
1. Create file: `src/config/apiKey.local.ts`
2. Add your API key:
   ```typescript
   export const LOCAL_API_KEY = 'your_api_key_here';
   ```
3. Uncomment the import in `src/utils/flightStatus.ts`

### Option 2: Use Environment Variables
1. Create `.env` file in project root:
   ```
   VITE_FLIGHT_API_PROVIDER=aviationstack
   VITE_FLIGHT_API_KEY=your_api_key_here
   ```
2. Restart your development server

**⚠️ Security Warning:**
- Never commit API keys to Git
- The `.env` file should be in `.gitignore`
- `apiKey.local.ts` is already gitignored

---

## Testing Your API Setup

### Browser Console Commands

1. **Test API Connection:**
   ```javascript
   debugFlightAPI()
   ```
   This will test your API configuration and show connection status.

2. **Test Specific Flight:**
   ```javascript
   // In browser console
   import { fetchFlightStatus } from './src/utils/flightStatus';
   await fetchFlightStatus('AA1234', new Date())
   ```

### Expected Behavior

- **Success:** Returns flight status (On Time, Delayed, Cancelled, etc.)
- **API Key Error:** Shows "401 Unauthorized" or authentication error
- **No API Key:** Shows warning about missing API key
- **Invalid Flight:** Returns "Unknown" status

---

## Multiple Provider Configuration (Recommended)

You can configure multiple providers with automatic fallback. The system will try each provider in order until one succeeds.

### Setup Multiple Providers

1. Go to AWS Amplify Console
2. Navigate to **Environment variables**
3. Add the following variables:
   - **Key**: `VITE_FLIGHT_API_PROVIDERS`
   - **Value**: `aviationstack,flightaware` (comma-separated list of providers to try)
   - **Key**: `VITE_FLIGHT_API_KEY_AVIATIONSTACK`
   - **Value**: Your AviationStack API key
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTAWARE`
   - **Value**: Your FlightAware API key (optional)

4. Redeploy your app

**How it works:**
- The system tries providers in the order specified in `VITE_FLIGHT_API_PROVIDERS`
- If the first provider fails or returns "Unknown", it automatically tries the next one
- Only providers with configured API keys will be tried
- This provides redundancy and better reliability

**Example:**
- Set `VITE_FLIGHT_API_PROVIDERS=aviationstack,flightaware`
- Configure both API keys
- If AviationStack fails, FlightAware will be tried automatically

## Switching Between APIs (Single Provider - Legacy)

To use a single provider (legacy method):

1. Go to AWS Amplify Console
2. Navigate to Environment variables
3. Update `VITE_FLIGHT_API_PROVIDER` to:
   - `aviationstack` for AviationStack
   - `flightaware` for FlightAware
   - `flightradar24` for FlightRadar24
4. Update `VITE_FLIGHT_API_KEY` with the appropriate key
5. Redeploy your app

---

## API Comparison

| Feature | AviationStack | FlightAware | FlightRadar24 |
|---------|--------------|-------------|---------------|
| **Setup Difficulty** | Easy | Moderate | Complex |
| **Free Tier** | Yes (1,000/month) | Limited | No |
| **Approval Required** | No | Yes | Yes |
| **Real-time Updates** | Good | Excellent | Excellent |
| **Data Coverage** | Good | Excellent | Excellent |
| **Best For** | Small/Medium ops | Large operations | Enterprise |

---

## Troubleshooting

### Issue: "401 Unauthorized" Error
**Solution:**
- Verify API key is correct (no extra spaces)
- Check API key hasn't expired
- Ensure environment variable name is exactly `VITE_FLIGHT_API_KEY`
- For AWS Amplify, check variable casing (should be uppercase)

### Issue: "API key not configured"
**Solution:**
- Verify environment variables are set in AWS Amplify
- Check variable names match exactly
- Redeploy app after setting variables
- For local dev, check `.env` file exists

### Issue: "Unknown" status for all flights
**Solution:**
- Check API key is valid
- Verify API provider is set correctly
- Check browser console for API errors
- Test API connection with `debugFlightAPI()`

### Issue: API calls not working
**Solution:**
- Check API rate limits haven't been exceeded
- Verify API account is active
- Check API endpoint URLs are correct
- Review API provider's status page

---

## Current Implementation Notes

### AviationStack
- ✅ Fully implemented
- ✅ Date filtering supported
- ✅ Tested and working

### FlightAware
- ⚠️ Partial implementation
- ⚠️ May need authentication adjustments
- ⚠️ Response parsing may need updates based on current API

### FlightRadar24
- ⚠️ Partial implementation
- ⚠️ May need endpoint adjustments
- ⚠️ Response parsing may need updates based on current API

**Recommendation:** Start with AviationStack for easiest setup, then add FlightAware if you need more features or higher limits (note: FlightAware requires a backend proxy due to CORS).

---

## Support

For API-specific issues:
- **AviationStack:** [support@aviationstack.com](mailto:support@aviationstack.com)
- **FlightAware:** [FlightAware Support](https://flightaware.com/about/contact/)

For application issues, check the browser console logs and use the debug functions.
