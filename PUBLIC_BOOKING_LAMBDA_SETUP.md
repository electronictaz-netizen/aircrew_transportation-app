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

### Step 2: Function URL (create in Lambda Console)

The Function URL is **not** managed by the backend (CDK `addFunctionUrl` caused CloudFormation "Properties validation failed"). Create it in the Lambda Console:

1. [AWS Lambda Console](https://console.aws.amazon.com/lambda/) → **Functions** → search for `publicBooking` (or `ma-publicBookinglambda`) and open it
2. **Configuration** tab → **Function URL** (left) → **Create function URL**
3. **Auth type:** `NONE`
4. **CORS:** Enable and set:
   - **Allow origin:** `*` (or your app’s origin, e.g. `https://onyxdispatch.us`)
   - **Allow methods:** `GET`, `POST`
   - **Allow headers:** `Content-Type`
5. **Save** and copy the URL (e.g. `https://xxxxx.lambda-url.us-east-1.on.aws/`)

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

If you re-enable `addFunctionUrl` in `amplify/backend.ts` and deploy, CloudFormation can fail with 409 because the Lambda already has a Function URL. **Fix:** Lambda Console → publicBooking → **Configuration** → **Function URL** → **Delete**, then redeploy. (The backend does not currently use `addFunctionUrl`; create the URL manually per Step 2.)

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

### POST to Lambda URL returns 404 (Not Found)

The booking portal sends requests to `VITE_BOOKING_API_URL`. A **404** means that URL is wrong or the Function URL was removed/recreated.

1. **Get the current Function URL**
   - [AWS Lambda Console](https://console.aws.amazon.com/lambda/) → **Functions**
   - Search for `publicBooking` (or `ma-publicBookinglambda`) and open it
   - **Configuration** tab → **Function URL** (left). If you see **Create function URL**, the Lambda has no URL yet—create it, or redeploy the app so the backend can create it.
   - Copy the URL (e.g. `https://xxxxx.lambda-url.us-east-1.on.aws/`).

2. **Set it in Amplify**
   - [Amplify Console](https://console.aws.amazon.com/amplify/) → your app → **Environment variables**
   - Set `VITE_BOOKING_API_URL` = the URL you copied (with or without a trailing slash).
   - **Save** and **Redeploy** the app (or run a new build for the frontend).

3. **After any change to the Lambda** (new deploy, URL recreated), copy the URL from Lambda → **Configuration** → **Function URL** and set `VITE_BOOKING_API_URL` in Amplify, then redeploy the app.

### Booking requests not showing in Management / `listBookingRequests` or `ModelBookingRequestFilterInput` undefined

If the Lambda creates booking requests (CloudWatch shows "Booking request created") but the Management **Booking Requests** view is empty and the console shows:
- `Field 'listBookingRequests' in type 'Query' is undefined`
- `Unknown type ModelBookingRequestFilterInput`

then the **deployed AppSync (Data) API does not include the BookingRequest model’s list/filter**. That usually happens when the backend deploy that added BookingRequest **rolled back** (e.g. due to the addFunctionUrl error). The Lambda uses the `createBookingRequest` mutation, which can exist even if the list was never deployed successfully. The Management **Booking Requests** view now shows an inline error when this happens; portal bookings are still saved.

**Workaround (implemented):** A **custom query** `listBookingRequestsForCompany` with an **AppSync JavaScript resolver** (`a.handler.custom`) was added. The Management **Booking Requests** view uses `client.queries.listBookingRequestsForCompany({ companyId })` instead of `client.models.BookingRequest.list`. The resolver (`amplify/data/list-booking-requests-by-company.js`) Scans the BookingRequest table filtered by `companyId`. This does not depend on the model-generated `listBookingRequests` or `ModelBookingRequestFilterInput`.

**To use the workaround:** Redeploy the backend (push a commit or Redeploy in Amplify) so the **Backend** phase runs successfully. The deploy adds the custom query `listBookingRequestsForCompany` and its resolver. After a successful deploy, the **Booking Requests** view will load via the custom query.

**Fix (alternative – restore model list):**
1. Ensure `amplify/backend.ts` does **not** use `addFunctionUrl` for publicBooking (it was removed to avoid CloudFormation "Properties validation failed").
2. **Redeploy the app** (push a commit or “Redeploy this version” in Amplify) so the **Backend** phase runs `npx ampx pipeline-deploy` without errors.
3. In Amplify build logs, confirm the **Backend** step completes and there is **no** `UPDATE_ROLLBACK_COMPLETE` or CloudFormation failure.
4. After a successful backend deploy, the Data/AppSync API should include `listBookingRequests` and `ModelBookingRequestFilterInput`. You can then switch the UI back to `BookingRequest.list` and remove the `listBookingRequestsForCompany` custom query and `amplify/data/list-booking-requests-by-company.js` if desired.

### 404 on /booking/CODE – "Booking portal not found", no CloudWatch

If `/booking/TEST` (or `/booking/<code>`) returns **404** in the browser and there is **no** corresponding request in the publicBooking Lambda’s CloudWatch logs, the request never reaches your app or the Lambda. The host is returning 404 for the path because:

- The app is a **SPA**: routes like `/booking/TEST` are handled by React Router only after `index.html` and the JS have loaded.
- For a direct request to `https://onyxdispatch.us/booking/TEST`, the host looks for a file at that path, does not find one, and returns 404. The React app and Lambda are never hit.

**Fix: SPA redirect/rewrite in Amplify**

1. [Amplify Console](https://console.aws.amazon.com/amplify/) → your app → **Hosting** → **Rewrites and redirects** → **Manage redirects**.
2. In the JSON editor, add a **rewrite (200)** so that paths that don’t match static assets are served by `index.html`.  
   - If you have no rules yet, use:
     ```json
     [
       {"source": "/^[^.]+$|[.](?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/", "status": "200", "target": "/index.html", "condition": null}
     ]
     ```
   - If you already have redirects (e.g. Amplify URL → custom domain), **append** this object to the existing array (order matters; this SPA rule is often last so it doesn’t override more specific ones):
     ```json
     {"source": "/^[^.]+$|[.](?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/", "status": "200", "target": "/index.html", "condition": null}
     ```
3. **Save**. Reload `https://onyxdispatch.us/booking/TEST`; it should load the app and the portal.

Copy‑paste: `docs/amplify-spa-redirects.json` (regex, preferred) or `docs/amplify-spa-redirects-simple.json` (catch‑all). If you already have rules, add only the new object to the array.

**Simpler fallback (rewrite everything):**  
If the regex is rejected or doesn’t work, you can try a catch‑all (only if you have no static files at unknown paths, or you’re ok risking breaking some assets):
```json
{"source": "/<<*>>", "status": "200", "target": "/index.html", "condition": null}
```
(`<<*>>` is Amplify’s wildcard for “any path”. Prefer the regex rule so assets like `/assets/…/*.js` are not rewritten.)

### Company shows enabled in UI but Lambda returns "Not found"

If **Configuration → Company Settings** shows "Enable Public Booking Portal" checked, **Booking Code** (e.g. TEST) set and "Active", but the Lambda logs **Company lookup result: Not found** for that code:

1. **Save the form** – Ensure you clicked **Save Changes** after enabling the portal and setting the booking code. The UI can show the values before they are persisted.
2. **Multi-company / Admin** – The Lambda only sees companies with `bookingEnabled: true`. If you use **Admin** and switch companies, the company you are editing must be the one that should have this booking code. Only one company in the filtered list can match a given code. If two companies both had `bookingEnabled: true` and the same code, behavior would be ambiguous; keep codes unique per company.
3. **CloudWatch `codes` log** – After the change, the Lambda logs `getCompanyByCode: { normalized, totalBookingEnabled, afterIsActiveFilter, matched, codes }`. The `codes` array lists each company's `id`, `bookingCode`, and `isActive` (the Lambda paginates through all `listCompanies` pages). If your code (e.g. TEST) does not appear there, no company in the database has `bookingEnabled: true` and that booking code — re-save the form for the correct company. If your code appears but `isActive` is `false`, the company is excluded; the app does not yet expose `isActive` in Company Settings; you would need to set `isActive: true` via the AppSync/Data API or a backend change.

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
