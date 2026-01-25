# Public Booking Lambda Function Setup

## Overview

The `publicBooking` Lambda function provides public (unauthenticated) access to the booking portal functionality. This allows customers to book trips without requiring authentication.

## What's Implemented

### Lambda Function
- **Location:** `amplify/functions/publicBooking/`
- **Handler:** `handler.ts`
- **Resource:** `resource.ts`
- **Package:** `package.json`

### Functionality
1. **Get Company by Booking Code** (`getCompany` action)
   - Validates booking code
   - Returns company information (name, logo, etc.)
   - Only returns companies with `bookingEnabled: true`

2. **Create Booking** (`createBooking` action)
   - Creates customer record (or updates existing)
   - Creates trip record
   - Validates company and booking enabled status

## Setup Instructions

### Step 1: Deploy the Lambda Function

The Lambda function is already added to `amplify/backend.ts`. After deployment:

```bash
# The function will be deployed automatically with your next Amplify deployment
git add .
git commit -m "Add public booking Lambda function"
git push
```

### Step 2: Function URL (automatic)

The Function URL is created automatically by the backend (see `amplify/backend.ts`). It uses:
- **Auth type:** `NONE` (public access)
- **CORS:** `*` origins, `GET`/`POST`/`OPTIONS`, `Content-Type` header

After deployment, get the URL from:
1. [AWS Lambda Console](https://console.aws.amazon.com/lambda/) → your `publicBooking-*` function
2. **Configuration** → **Function URL** → copy the URL (e.g. `https://xxxxx.lambda-url.us-east-1.on.aws/`)

### Step 3: Configure Environment Variable

Add the Function URL to your Amplify app environment variables:

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to "Environment variables"
4. Add:
   - **Key:** `VITE_BOOKING_API_URL`
   - **Value:** Your Lambda Function URL (from Step 2)
5. Save and redeploy

### Step 4: Configure IAM Permissions

The Lambda function needs IAM permissions to access Amplify Data API. These should be automatically granted by Amplify, but verify:

1. Go to Lambda function → "Configuration" → "Permissions"
2. Check the execution role has permissions for:
   - `appsync:GraphQL` (for Data API access)
   - DynamoDB read/write (for data access)

If permissions are missing, Amplify should grant them automatically. If not, you may need to add them manually or check Amplify backend configuration.

### Step 5: Test the Function

The API expects **POST** with JSON body. `companyId` in createBooking is the **booking code**, not the company UUID.

```bash
# Test getCompany action (POST with JSON)
curl -X POST "https://YOUR-FUNCTION-URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCompany","code":"YOURCODE"}'

# Test createBooking action (companyId = booking code)
curl -X POST "https://YOUR-FUNCTION-URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createBooking",
    "companyId": "YOUR_BOOKING_CODE",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "555-1234",
    "tripType": "Airport Trip",
    "pickupDate": "2025-01-30T10:00:00Z",
    "flightNumber": "AA1234",
    "pickupLocation": "123 Main St",
    "dropoffLocation": "456 Oak Ave",
    "numberOfPassengers": 2,
    "isRoundTrip": false
  }'
```

## Important Notes

### How the Lambda Calls AppSync

The Lambda calls the AppSync GraphQL API over HTTP with **IAM signing** (aws4). The backend sets:

- `AMPLIFY_DATA_GRAPHQL_ENDPOINT` – AppSync GraphQL URL
- `AMPLIFY_DATA_REGION` – AWS region

Amplify grants the function IAM access to the Data API; no extra config is needed.

## Troubleshooting

### Error: "FunctionUrlConfig exists for this Lambda function" (409) on deploy

The Lambda already has a Function URL (from a prior deploy or manual setup). Lambda allows only one Function URL per function, so CloudFormation cannot create another.

**Fix: delete the existing Function URL, then redeploy.**

**Option A – Lambda Console**

1. [AWS Lambda Console](https://console.aws.amazon.com/lambda/) → **Functions**
2. Search for `publicBooking` and open the `amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda...` function
3. **Configuration** tab → **Function URL** (left) → **Delete**
4. Trigger a new Amplify deploy (push to `main` or “Redeploy this version” in Amplify). The backend will recreate the Function URL via CloudFormation.

**Option B – AWS CLI**

```bash
# Replace with your function name if it differs (e.g. from Lambda console)
aws lambda delete-function-url-config \
  --function-name "amplify-d1wxo3x0z5r1oq-ma-publicBookinglambda48251-BidjAte9Ibm6" \
  --region us-east-1
```

Then push to `main` or redeploy in Amplify.

### Error: "Cannot find module '@aws-amplify/backend'"
- Make sure `package.json` includes the dependency
- Run `npm install` in the function directory

### Error: "Access denied" or "Unauthorized"
- Check IAM permissions for the Lambda execution role
- Verify the role has AppSync/Data API access

### Error: "Company not found"
- Verify the booking code is correct
- Check that `bookingEnabled: true` for the company
- Verify the company is active

### Portal booking shows confirmation but does not appear in Management dashboard

Trips from the booking portal are created for the **company that has the booking code** you used in the URL. They only show in Management when you are viewing **that same company**.

**Checklist:**
1. **Same company** – In **Configuration → Company Settings**, ensure **Enable Public Booking Portal** is on and **Booking Code** is set. The code in your booking URL (e.g. `/booking/GLS`) must match this code. Trips are created for this company only.
2. **Management company** – The Management dashboard lists trips for the company you’re logged into (from **CompanyUser**). If you use **Admin mode**, the selected company in Admin must be the one with the booking code. If you manage multiple companies, switch to the company that owns the booking code.
3. **Date / filters** – In the trip list, set **View** to **All Trips** so the date filter doesn’t hide the new booking. Check **Status** (e.g. Unassigned) and other filters.
4. **Logs** – After a booking, the Lambda logs `Booking created: { companyId, tripId, bookingCode }`. In Management, the browser console logs `Loaded trips: N companyId: <id>`. The `companyId` in both must match. In **AWS Lambda → publicBooking → Monitor → View logs**, search for `Booking created` and note `companyId`. In the Management page (F12 → Console), confirm `companyId` in `Loaded trips` is the same.

### CORS Errors
- Check Function URL CORS configuration
- Verify `Access-Control-Allow-Origin` header is set correctly
- Test with `curl` to see actual response headers

## Security Considerations

1. **Rate Limiting:** Consider adding rate limiting to prevent abuse
2. **Input Validation:** All inputs are validated in the Lambda
3. **Company Validation:** Only companies with `bookingEnabled: true` can be accessed
4. **Data Isolation:** Bookings are scoped to the specific company
5. **No Sensitive Data:** Company data returned excludes sensitive information

## Next Steps

1. Deploy the Lambda function
2. Create Function URL
3. Configure environment variable
4. Test end-to-end booking flow
5. Monitor Lambda logs for errors
6. Consider adding rate limiting
7. Consider adding request validation/rate limiting

## Testing Checklist

- [ ] Lambda function deploys successfully
- [ ] Function URL is created and accessible
- [ ] CORS is configured correctly
- [ ] Environment variable is set in Amplify
- [ ] `getCompany` action works
- [ ] `createBooking` action works
- [ ] Booking appears in management dashboard
- [ ] Customer record is created/updated
- [ ] Error handling works correctly
