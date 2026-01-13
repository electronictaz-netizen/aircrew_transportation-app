# Multiple Flight Status Provider Setup Guide

This application supports using **multiple flight status API providers** simultaneously with automatic failover. This provides redundancy and better reliability.

## Quick Setup

### Step 1: Configure Providers List

In AWS Amplify Console → Environment Variables, add:

**Key:** `VITE_FLIGHT_API_PROVIDERS`  
**Value:** `aviationstack,flightaware,flightradar24`

(You can include any combination of the three supported providers, separated by commas)

### Step 2: Add API Keys

Add the API key for each provider you want to use:

**For AviationStack:**
- **Key:** `VITE_FLIGHT_API_KEY_AVIATIONSTACK`
- **Value:** Your AviationStack API key

**For FlightAware:**
- **Key:** `VITE_FLIGHT_API_KEY_FLIGHTAWARE`
- **Value:** Your FlightAware API key

**For FlightRadar24:**
- **Key:** `VITE_FLIGHT_API_KEY_FLIGHTRADAR24`
- **Value:** Your FlightRadar24 API key

### Step 3: Deploy

After adding the environment variables, redeploy your application.

## How It Works

1. **Provider Order**: The system tries providers in the order specified in `VITE_FLIGHT_API_PROVIDERS`
2. **Automatic Failover**: If the first provider fails (error, rate limit, timeout), it automatically tries the next one
3. **Smart Filtering**: Only providers with valid API keys are used
4. **Cost Control**: Each API call only uses one provider (the first successful one)

## Example Configurations

### Example 1: Two Providers (Recommended)
```
VITE_FLIGHT_API_PROVIDERS=aviationstack,flightaware
VITE_FLIGHT_API_KEY_AVIATIONSTACK=your_aviationstack_key
VITE_FLIGHT_API_KEY_FLIGHTAWARE=your_flightaware_key
```
- Tries AviationStack first
- Falls back to FlightAware if AviationStack fails

### Example 2: All Three Providers
```
VITE_FLIGHT_API_PROVIDERS=aviationstack,flightaware,flightradar24
VITE_FLIGHT_API_KEY_AVIATIONSTACK=your_aviationstack_key
VITE_FLIGHT_API_KEY_FLIGHTAWARE=your_flightaware_key
VITE_FLIGHT_API_KEY_FLIGHTRADAR24=your_flightradar24_key
```
- Maximum redundancy
- Tries all three in order until one succeeds

### Example 3: Single Provider (Legacy)
```
VITE_FLIGHT_API_PROVIDER=aviationstack
VITE_FLIGHT_API_KEY=your_api_key
```
- Still supported for backward compatibility
- Uses only one provider

## Testing Your Configuration

Open your browser console and run:
```javascript
debugFlightAPI()
```

This will show:
- Which providers are configured
- Which providers have valid API keys
- Configuration mode (single or multiple)
- Test results for each provider

## Benefits of Multiple Providers

✅ **Redundancy**: If one provider is down, others can still work  
✅ **Rate Limit Protection**: If one provider hits limits, others are available  
✅ **Better Reliability**: Higher chance of successful API calls  
✅ **Cost Optimization**: Can use free tier of one provider as primary, paid as backup  

## Troubleshooting

### Issue: "No providers are fully configured"
**Solution:** 
- Check that `VITE_FLIGHT_API_PROVIDERS` is set correctly
- Verify each provider's API key environment variable is set
- Ensure API keys are valid (not expired, correct format)

### Issue: "Provider skipped - no API key configured"
**Solution:**
- Add the missing `VITE_FLIGHT_API_KEY_*` environment variable
- Redeploy the application

### Issue: All providers failing
**Solution:**
- Check API keys are valid
- Verify API accounts are active
- Check rate limits haven't been exceeded
- Review provider status pages

## Provider Priority Recommendations

**For Cost-Conscious Users:**
1. AviationStack (free tier: 1,000/month)
2. FlightAware (if you have access)
3. FlightRadar24 (if you have access)

**For Maximum Reliability:**
1. FlightAware (most comprehensive)
2. AviationStack (good backup)
3. FlightRadar24 (additional backup)

**For Free Tier Users:**
1. AviationStack (only free tier available)
2. (Add paid providers as backup if needed)

## Notes

- Providers are tried in the exact order specified in `VITE_FLIGHT_API_PROVIDERS`
- Only providers with valid API keys are included in the failover chain
- Each API call uses only one provider (the first successful one)
- Failed providers are logged in the console for debugging

## See Also

- [FLIGHT_API_SETUP.md](./FLIGHT_API_SETUP.md) - Detailed setup for each provider
- [API_KEY_SECURITY_WARNING.md](./API_KEY_SECURITY_WARNING.md) - Security best practices
