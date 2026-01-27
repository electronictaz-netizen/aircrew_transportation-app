# Customer Portal Setup Instructions

This guide provides step-by-step instructions for setting up the Customer Portal feature after the code has been deployed.

## Prerequisites

- ✅ Code has been pushed and deployed to Amplify
- ✅ AWS Lambda Console access
- ✅ Amplify Console access (for environment variables)

---

## Step 1: Deploy Backend Changes

1. **Push code to repository** (if not already done)
   ```bash
   git add .
   git commit -m "Add Customer Portal feature"
   git push origin main
   ```

2. **Wait for Amplify deployment** to complete
   - Monitor the deployment in AWS Amplify Console
   - Ensure backend deployment succeeds (Lambda function is created)

---

## Step 2: Create Lambda Function URL

1. **Navigate to AWS Lambda Console**
   - Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
   - Select your region (same as Amplify app)

2. **Find the `customerPortal` function**
   - Search for function name containing "customerPortal"
   - Click on the function

3. **Create Function URL**
   - Go to **Configuration** tab
   - Click **Function URL** in the left sidebar
   - Click **Create function URL**
   - Configure:
     - **Auth type**: `NONE` (public access)
     - **CORS**: Enable CORS (or configure manually)
   - Click **Save**

4. **Copy the Function URL**
   - The URL will look like: `https://xxxxxxxxxxxx.lambda-url.us-east-1.on.aws/`
   - **Save this URL** - you'll need it in the next step

---

## Step 3: Configure Environment Variable

1. **Navigate to Amplify Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Select your app

2. **Set Environment Variable**
   - Go to **App settings** → **Environment variables**
   - Click **Manage variables**
   - Add new variable:
     - **Key**: `VITE_CUSTOMER_PORTAL_API_URL`
     - **Value**: The Function URL from Step 2
   - Click **Save**

3. **Redeploy Frontend** (if needed)
   - Amplify should auto-redeploy, or trigger a new deployment manually
   - Wait for deployment to complete

---

## Step 4: Enable Portal Access for Customers

### Option A: Enable via Management Dashboard (Recommended)

1. **Log in to Management Dashboard**
2. **Navigate to Customer Management**
   - Click **Data Management** → **Manage Customers**
3. **Edit Customer**
   - Find the customer you want to enable
   - Click **Edit**
   - Check **Enable Portal Access** (if UI field exists)
   - Or manually set `portalEnabled: true` in the database

### Option B: Enable via Database (Direct)

If the UI field doesn't exist yet, you can enable it directly:

1. **Access AWS AppSync Console**
   - Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
   - Select your API
   - Go to **Queries** tab

2. **Run GraphQL Mutation**
   ```graphql
   mutation EnableCustomerPortal {
     updateCustomer(input: {
       id: "CUSTOMER_ID_HERE"
       portalEnabled: true
     }) {
       id
       name
       portalEnabled
     }
   }
   ```

3. **Repeat for each customer** you want to enable

---

## Step 5: Test Customer Portal Access

1. **Get Company Booking Code**
   - Log in to Management Dashboard
   - Go to **Configuration** → **Company Settings**
   - Note the **Booking Code** (e.g., "ACME")

2. **Access Customer Portal**
   - Navigate to: `https://your-app.amplifyapp.com/portal/{BOOKING_CODE}`
   - Or: `https://your-app.amplifyapp.com/portal?code={BOOKING_CODE}`

3. **Test Login Flow**
   - Enter a customer's email or phone number
   - Verify access code is generated (check console/logs)
   - Enter access code to log in
   - Verify trips are displayed

---

## Step 6: Configure Email/SMS for Access Codes (Production)

**Current Implementation**: Access codes are returned in the API response (for testing).

**For Production**, you need to:

1. **Send Access Code via Email**
   - Integrate with your email service (SES, SendGrid, etc.)
   - Update `customerPortal/handler.ts` to send email instead of returning code
   - Use the `sendBookingEmail` Lambda or create a new email function

2. **Send Access Code via SMS** (Optional)
   - Use Telnyx SMS integration (already configured)
   - Update `customerPortal/handler.ts` to send SMS
   - Call `sendTelnyxSms` Lambda function

3. **Update Lambda Function**
   ```typescript
   // In customerPortal/handler.ts, findCustomer action
   // Instead of returning accessCode, send it via email/SMS
   await sendAccessCodeEmail(customer.email, code);
   // or
   await sendAccessCodeSMS(customer.phone, code);
   ```

---

## Step 7: Share Portal Links with Customers

1. **Generate Portal URLs**
   - Format: `https://your-app.amplifyapp.com/portal/{BOOKING_CODE}`
   - Or use query parameter: `https://your-app.amplifyapp.com/portal?code={BOOKING_CODE}`

2. **Share with Customers**
   - Include in welcome emails
   - Add to booking confirmations
   - Include in company website
   - Print on business cards/receipts

---

## Troubleshooting

### Issue: "Customer Portal API URL not configured"
**Solution**: Ensure `VITE_CUSTOMER_PORTAL_API_URL` is set in Amplify environment variables and app is redeployed.

### Issue: "No account found"
**Solution**: 
- Verify customer has `portalEnabled: true`
- Verify customer email/phone matches exactly (case-sensitive for email)
- Check customer is active (`isActive: true`)

### Issue: "Invalid access code"
**Solution**:
- Access codes expire after use (cleared on successful login)
- Generate a new code by attempting login again
- Check Lambda logs for code generation

### Issue: CORS errors
**Solution**:
- Ensure Function URL has CORS enabled
- Check Lambda function returns proper CORS headers
- Verify frontend is calling correct URL

### Issue: Trips not loading
**Solution**:
- Verify customer has trips assigned (`customerId` matches)
- Check trips belong to correct company
- Verify Lambda has AppSync GraphQL permissions

---

## Security Considerations

1. **Access Code Expiration**
   - Currently codes expire after use (cleared on login)
   - Consider adding time-based expiration (e.g., 15 minutes)

2. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - Limit login attempts per email/phone

3. **Email/SMS Verification**
   - In production, always send codes via email/SMS
   - Never return codes in API response

4. **Portal Access Control**
   - Only enable portal for customers who request it
   - Regularly audit `portalEnabled` status

---

## Next Steps

- ✅ Customer Portal is now functional
- 📧 Set up email/SMS for access codes (production)
- 📝 Share portal links with customers
- 📊 Monitor usage via CloudWatch logs
- 🔒 Review and enhance security measures

---

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda function errors
2. Review AppSync query logs
3. Verify environment variables are set correctly
4. Test with a known customer account
