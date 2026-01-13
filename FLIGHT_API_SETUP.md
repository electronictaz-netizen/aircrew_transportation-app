# Flight Status API Setup Guide

This application supports multiple flight status API providers. Choose the one that best fits your needs.

## Supported APIs

1. **AviationStack** (Recommended) - Easy setup, good free tier
2. **FlightAware** - Comprehensive data, requires account approval
3. **FlightRadar24** - Real-time tracking, commercial API

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

## FlightAware API Setup

### Step 1: Create Account
1. Go to [https://flightaware.com/](https://flightaware.com/)
2. Click "Sign Up" or "Create Account"
3. Complete registration (may require approval for API access)

### Step 2: Request API Access
1. Go to [FlightAware FlightXML API](https://flightaware.com/commercial/flightxml/)
2. Click "Request API Access" or "Get Started"
3. Fill out the application form:
   - Business/Organization name
   - Use case description
   - Expected request volume
4. Wait for approval (can take 1-3 business days)

### Step 3: Get API Credentials
1. Once approved, log into your FlightAware account
2. Go to "My Account" → "API Keys" or "FlightXML"
3. You'll receive:
   - **Username**: Your FlightAware username
   - **API Key**: Your API key (different from password)

### Step 4: Configure in AWS Amplify
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add the following variables:
   - **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `flightaware`
   - **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: `your_api_key_here` (paste your actual API key)

**Note:** FlightAware uses username/password authentication. The current implementation uses the API key as the username parameter. You may need to adjust the authentication method based on FlightAware's current API requirements.

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
- **Recommendation:** Use AviationStack or FlightAware instead, or contact FlightRadar24 for proper API documentation

### If You Have FlightRadar24 Access

### Step 1: Create Account
1. Go to [https://www.flightradar24.com/](https://www.flightradar24.com/)
2. Click "Sign Up" or "Create Account"
3. Complete registration

### Step 2: Request API Access
1. Go to [FlightRadar24 Business API](https://www.flightradar24.com/business/api)
2. Click "Request Access" or "Contact Sales"
3. Fill out the business inquiry form:
   - Company information
   - Use case
   - Expected usage
4. Wait for response from FlightRadar24 sales team

### Step 3: Get API Token
1. Once approved, you'll receive API credentials
2. Log into your FlightRadar24 business account
3. Navigate to API settings
4. Generate or copy your API token
5. **Important:** Get the correct API endpoint and parameter format from FlightRadar24 documentation

### Step 4: Update Code (Required)
The current FlightRadar24 implementation may need to be updated based on their actual API:
1. Check FlightRadar24 API documentation for correct endpoint
2. Update the API URL format in `src/utils/flightStatus.ts`
3. Update the response parsing function `parseFlightRadar24Response()`
4. Test with your API credentials

### Step 5: Configure in AWS Amplify
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add the following variables:
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTRADAR24`
   - **Value**: `your_api_token_here` (paste your actual token)

**Note:** If you continue to see 400 errors, the API endpoint or parameters in the code need to be updated to match FlightRadar24's current API specification.

**Pricing:**
- Contact FlightRadar24 for commercial pricing
- Typically requires business/enterprise account
- Pricing based on request volume

**API Documentation:**
- [FlightRadar24 API Documentation](https://www.flightradar24.com/business/api)

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
   - **Value**: `aviationstack,flightaware,flightradar24` (comma-separated list of providers to try)
   - **Key**: `VITE_FLIGHT_API_KEY_AVIATIONSTACK`
   - **Value**: Your AviationStack API key
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTAWARE`
   - **Value**: Your FlightAware API key (optional)
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTRADAR24`
   - **Value**: Your FlightRadar24 API key (optional)

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

**Recommendation:** Start with AviationStack for easiest setup, then migrate to FlightAware or FlightRadar24 if you need more features or higher limits.

---

## Support

For API-specific issues:
- **AviationStack:** [support@aviationstack.com](mailto:support@aviationstack.com)
- **FlightAware:** [FlightAware Support](https://flightaware.com/about/contact/)
- **FlightRadar24:** [FlightRadar24 Business Contact](https://www.flightradar24.com/business/contact)

For application issues, check the browser console logs and use the debug functions.
