# AviationStack API Setup Guide

This guide will walk you through setting up the AviationStack API for real-time flight status tracking in the Onyx Transportation App.

## Step 1: Create an AviationStack Account

1. **Visit AviationStack**
   - Go to [https://aviationstack.com/](https://aviationstack.com/)
   - Click "Sign Up" or "Get Started"

2. **Choose a Plan**
   - **Free Plan**: 1,000 requests/month (perfect for testing)
   - **Basic Plan**: 10,000 requests/month ($49.99/month)
   - **Professional Plan**: 100,000 requests/month ($199.99/month)
   - Start with the free plan for development

3. **Complete Registration**
   - Enter your email address
   - Create a password
   - Verify your email address
   - Complete the registration process

## Step 2: Get Your API Key

1. **Log in to Your Account**
   - Go to [https://aviationstack.com/account](https://aviationstack.com/account)
   - Log in with your credentials

2. **Access API Dashboard**
   - Navigate to "Dashboard" or "API Keys" section
   - You'll see your API key (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

3. **Copy Your API Key**
   - Click "Copy" or manually copy the API key
   - **Important**: Keep this key secure and never commit it to Git

## Step 3: Configure API Key for Local Development

### Option A: Using .env File (Recommended for Local)

1. **Create `.env` file** in the project root:
   ```bash
   cd "Aircrew transportation app"
   ```

2. **Add your API key** to `.env`:
   ```env
   VITE_FLIGHT_API_KEY=your_actual_api_key_here
   VITE_FLIGHT_API_PROVIDER=aviationstack
   ```

3. **Verify `.env` is in `.gitignore`**:
   - Check that `.env` is listed in `.gitignore` (it should be)
   - This prevents accidentally committing your API key

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Option B: Using Environment Variables (Alternative)

**Windows (PowerShell):**
```powershell
$env:VITE_FLIGHT_API_KEY="your_actual_api_key_here"
$env:VITE_FLIGHT_API_PROVIDER="aviationstack"
npm run dev
```

**Windows (Command Prompt):**
```cmd
set VITE_FLIGHT_API_KEY=your_actual_api_key_here
set VITE_FLIGHT_API_PROVIDER=aviationstack
npm run dev
```

**Mac/Linux:**
```bash
export VITE_FLIGHT_API_KEY="your_actual_api_key_here"
export VITE_FLIGHT_API_PROVIDER="aviationstack"
npm run dev
```

## Step 4: Configure API Key for AWS Amplify (Production)

1. **Go to AWS Amplify Console**
   - Navigate to [https://console.aws.amazon.com/amplify/](https://console.aws.amazon.com/amplify/)
   - Select your app

2. **Navigate to Environment Variables**
   - Click on your app
   - Go to "Environment variables" in the left sidebar
   - Click "Manage variables"

3. **Add Environment Variables**
   - Click "Add variable"
   - **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: Your AviationStack API key
   - Click "Save"
   
   - Add another variable:
   - **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `aviationstack`
   - Click "Save"

4. **Redeploy Your App**
   - After adding variables, Amplify will prompt you to redeploy
   - Or manually trigger a redeploy from the "Deployments" section
   - Wait for deployment to complete

## Step 5: Test the API Connection

### Test in Browser Console

1. **Open your app** in the browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Run this test**:
   ```javascript
   // Test API connection
   const testFlight = async () => {
     const apiKey = import.meta.env.VITE_FLIGHT_API_KEY;
     console.log('API Key configured:', apiKey ? 'Yes' : 'No');
     
     if (!apiKey || apiKey === 'YOUR_API_KEY') {
       console.error('API key not configured!');
       return;
     }
     
     try {
       const response = await fetch(
         `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=AA100&limit=1`
       );
       const data = await response.json();
       console.log('API Test Result:', data);
       
       if (data.error) {
         console.error('API Error:', data.error);
       } else {
         console.log('✅ API connection successful!');
       }
     } catch (error) {
       console.error('API Test Failed:', error);
     }
   };
   
   testFlight();
   ```

### Test in Application

1. **Create a test trip** with a real flight number (e.g., AA100, UA200)
2. **Check the trip list** - you should see flight status badges
3. **Status should show**: "On Time", "Delayed", "Cancelled", "Landed", or "Unknown"

## Step 6: Verify API Usage

1. **Check API Usage in AviationStack Dashboard**
   - Log in to [https://aviationstack.com/account](https://aviationstack.com/account)
   - Go to "Usage" or "Statistics"
   - Monitor your API request count
   - Free tier: 1,000 requests/month

2. **Monitor Rate Limits**
   - Free tier: ~33 requests/day
   - The app fetches status for each trip on page load
   - Consider implementing caching to reduce API calls

## Troubleshooting

### Issue: "Unknown" status for all flights

**Possible causes:**
- API key not configured
- Invalid API key
- Flight number format incorrect
- API quota exceeded

**Solutions:**
1. Check browser console for errors
2. Verify API key is set correctly
3. Check API usage in AviationStack dashboard
4. Ensure flight numbers are in correct format (e.g., AA1234, not AA 1234)

### Issue: "API key not configured"

**Solution:**
- Verify `.env` file exists and contains `VITE_FLIGHT_API_KEY`
- Restart development server after adding `.env`
- Check that variable name starts with `VITE_` (required for Vite)

### Issue: "Invalid API key" error

**Solution:**
- Verify API key is correct (no extra spaces)
- Check API key in AviationStack dashboard
- Ensure you're using the correct key for your plan

### Issue: API quota exceeded

**Solution:**
- Check usage in AviationStack dashboard
- Wait for monthly reset or upgrade plan
- Implement caching to reduce API calls
- Consider using mock data for development

## API Response Format

The AviationStack API returns data in this format:
```json
{
  "pagination": { ... },
  "data": [
    {
      "flight": {
        "iata": "AA100",
        "icao": "AAL100",
        "number": "100"
      },
      "flight_status": "active",
      "departure": {
        "airport": "John F Kennedy International Airport",
        "iata": "JFK",
        "scheduled": "2024-01-15T10:00:00+00:00",
        "estimated": "2024-01-15T10:15:00+00:00",
        "delay": 15
      },
      "arrival": { ... }
    }
  ]
}
```

## Security Best Practices

1. **Never commit API keys to Git**
   - Always use `.env` file for local development
   - Use environment variables in production
   - Add `.env` to `.gitignore`

2. **Rotate API keys regularly**
   - Change API key if exposed
   - Use different keys for dev/staging/production

3. **Monitor API usage**
   - Set up alerts for quota limits
   - Monitor for unusual activity

4. **Use HTTPS**
   - API calls are made over HTTPS
   - Never send API keys over HTTP

## Cost Optimization

1. **Implement Caching**
   - Cache flight status for 5-15 minutes
   - Reduces API calls significantly

2. **Batch Requests** (if supported)
   - Request multiple flights in one call
   - Check AviationStack documentation

3. **Use Free Tier Wisely**
   - Test with limited trips
   - Upgrade when needed for production

## Next Steps

After setup:
1. ✅ Test with a few trips
2. ✅ Monitor API usage
3. ✅ Verify flight statuses appear correctly
4. ✅ Consider implementing caching (future enhancement)

## Support

- **AviationStack Support**: [https://aviationstack.com/support](https://aviationstack.com/support)
- **Documentation**: [https://aviationstack.com/documentation](https://aviationstack.com/documentation)
- **API Status**: [https://status.aviationstack.com/](https://status.aviationstack.com/)

---

**Note**: The free tier is perfect for development and testing. For production use with many trips, consider upgrading to a paid plan.
