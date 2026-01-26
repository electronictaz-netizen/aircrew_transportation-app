# Update Booking API URL and Fix CORS

## The Problem

Your frontend is calling: `https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/`
But the correct Function URL is: `https://u24vdtk7ozscwy2jdpqdq2wwzy0kmpid.lambda-url.us-east-1.on.aws/`

This mismatch causes CORS errors because:
1. The wrong Function URL might not have CORS configured
2. The wrong Function URL might belong to a different Lambda function
3. The environment variable needs to be updated

## Solution: Update Environment Variable and Configure CORS

### Step 1: Verify Which Lambda Function Has Which Function URL

**For the correct URL (`u24vdtk7ozscwy2jdpqdq2wwzy0kmpid`):**

1. Go to **AWS Lambda** → **Functions**
2. Search for Function URLs or filter by the Function URL ID
3. Find which Lambda function has: `https://u24vdtk7ozscwy2jdpqdq2wwzy0kmpid.lambda-url.us-east-1.on.aws/`
4. Note the function name (should be the main branch `publicBooking`)

**For the wrong URL (`4wibyonzgd6tolxdyod3seii5e0rfgog`):**

1. Find which Lambda function has this Function URL
2. This might be:
   - An old Function URL that should be deleted
   - A dev branch Function URL
   - A different Lambda function

### Step 2: Configure CORS on the Correct Function URL

1. Go to **AWS Lambda** → Functions
2. Find the Lambda function that has Function URL: `u24vdtk7ozscwy2jdpqdq2wwzy0kmpid`
3. **Configuration** → **Function URL** → **Edit**
4. **Enable CORS** and configure:
   - **Allow origins:** `https://onyxdispatch.us`
   - **Allow methods:** `POST, GET`
   - **Allow headers:** `Content-Type`
   - **Max age:** `86400`
5. **Save**

### Step 3: Update Environment Variable in Amplify

1. Go to **AWS Amplify** → Your app (`d1wxo3x0z5r1oq`)
2. **App settings** → **Environment variables**
3. Find `VITE_BOOKING_API_URL`
4. **Update** the value to: `https://u24vdtk7ozscwy2jdpqdq2wwzy0kmpid.lambda-url.us-east-1.on.aws/`
   - ⚠️ **Important:** No trailing slash (or with trailing slash, but be consistent)
5. **Save**

### Step 4: Redeploy Frontend

After updating the environment variable:

1. **Option A: Trigger a new build**
   - Go to **Hosting** → Click **Redeploy this version** (if available)
   - Or make a small commit and push to trigger a new build

2. **Option B: Wait for next deployment**
   - The next time you push code, the frontend will rebuild with the new environment variable

### Step 5: Verify the Fix

After the frontend redeploys:

1. Open your booking portal: `https://onyxdispatch.us/booking/GLS`
2. Open browser DevTools → **Console**
3. Check **Network** tab:
   - Requests should go to: `https://u24vdtk7ozscwy2jdpqdq2wwzy0kmpid.lambda-url.us-east-1.on.aws/`
   - Should NOT go to: `https://4wibyonzgd6tolxdyod3seii5e0rfgog.lambda-url.us-east-1.on.aws/`
4. No CORS errors should appear

## Quick Fix Checklist

- [ ] Identified which Lambda function has Function URL `u24vdtk7ozscwy2jdpqdq2wwzy0kmpid`
- [ ] Configured CORS on that Function URL (allow `https://onyxdispatch.us`)
- [ ] Updated `VITE_BOOKING_API_URL` in Amplify environment variables
- [ ] Redeployed frontend (or triggered new build)
- [ ] Verified frontend now calls the correct Function URL
- [ ] Tested booking portal - no CORS errors

## If You Can't Find the Function URL

If you can't find which Lambda function has the Function URL `u24vdtk7ozscwy2jdpqdq2wwzy0kmpid`:

1. **Check all publicBooking functions:**
   - Go to Lambda → Functions
   - Filter/search for `publicBooking`
   - Check each one's Function URL configuration
   - Find the one with URL ending in `u24vdtk7ozscwy2jdpqdq2wwzy0kmpid`

2. **Or create a new Function URL:**
   - If the Function URL doesn't exist, create it on the main branch `publicBooking` function
   - Then update the environment variable to the new URL

## Cleanup: Delete Old Function URL

After updating to the correct URL:

1. Find the Lambda function with the old Function URL (`4wibyonzgd6tolxdyod3seii5e0rfgog`)
2. If it's not needed:
   - Go to **Configuration** → **Function URL**
   - Click **Delete** (or **Edit** → **Delete**)
   - This prevents confusion

## Troubleshooting

### Issue: Environment variable not updating

**Check:**
1. Did you save the environment variable in Amplify?
2. Did the frontend rebuild after the change?
3. Check the deployed app's build logs to see if `VITE_BOOKING_API_URL` is set

**Fix:**
1. Verify the environment variable is saved in Amplify Console
2. Trigger a new frontend build
3. Check build logs to confirm the variable is being used

### Issue: Still calling wrong URL after update

**Possible causes:**
1. Browser cache (hard refresh: Ctrl+Shift+R)
2. Frontend didn't rebuild yet
3. Environment variable has trailing slash but code expects no slash (or vice versa)

**Fix:**
1. Hard refresh browser
2. Wait for frontend build to complete
3. Check the actual network request in DevTools to see what URL is being called
4. Verify the environment variable format matches what the code expects
