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

### Step 2: Create Function URL

After deployment, create a Function URL in AWS Lambda Console:

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find the function: `publicBooking-<environment>`
3. Go to "Configuration" → "Function URL"
4. Click "Create function URL"
5. Configure:
   - **Auth type:** `NONE` (for public access)
   - **CORS:** Enable and configure:
     - **Allow origins:** `*` (or your specific domain)
     - **Allow methods:** `GET, POST, OPTIONS`
     - **Allow headers:** `Content-Type`
     - **Expose headers:** (leave empty)
     - **Max age:** `3600`
6. Click "Save"
7. Copy the Function URL (e.g., `https://xxxxx.lambda-url.us-east-1.on.aws/`)

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

Test the Function URL:

```bash
# Test getCompany action
curl "https://YOUR-FUNCTION-URL?action=getCompany&code=YOURCODE"

# Test createBooking action
curl -X POST "https://YOUR-FUNCTION-URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createBooking",
    "companyId": "YOUR-COMPANY-ID",
    "customerName": "Test Customer",
    "customerEmail": "test@onyxdispatch.us",
    "customerPhone": "555-1234",
    "tripType": "Airport Trip",
    "pickupDate": "2024-01-01T10:00:00Z",
    "flightNumber": "AA1234",
    "pickupLocation": "123 Main St",
    "dropoffLocation": "456 Oak Ave",
    "numberOfPassengers": 2
  }'
```

## Important Notes

### Amplify Configuration in Lambda

The Lambda function uses `generateClient<Schema>({ authMode: 'iam' })` to access the Data API. This requires:

1. **Amplify Backend Outputs:** The Lambda needs access to Amplify backend configuration
2. **IAM Permissions:** The Lambda execution role must have permissions to call AppSync/Data API
3. **Environment Variables:** May need to pass Amplify outputs as environment variables

### Current Limitation

The Lambda handler currently initializes the Amplify client, but it may need Amplify configuration (backend outputs) to work properly. You may need to:

1. Pass Amplify outputs as environment variables to the Lambda
2. Or use AWS SDK directly to access DynamoDB/AppSync
3. Or configure the Lambda with proper Amplify backend references

### Alternative Approach (If Needed)

If the Amplify Data client doesn't work in Lambda, you can:

1. Use AWS SDK to directly access DynamoDB tables
2. Use AppSync GraphQL API directly with IAM auth
3. Create a separate API Gateway endpoint

## Troubleshooting

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
