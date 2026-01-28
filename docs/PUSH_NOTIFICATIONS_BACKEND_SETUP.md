# Push Notifications Backend Setup Guide

This guide provides step-by-step instructions for setting up the push notifications backend endpoint.

## Overview

The push notifications backend consists of:
- **Lambda Function**: `pushNotifications` - Handles subscriptions and sending notifications
- **Database Model**: `PushSubscription` - Stores user push subscriptions
- **API Endpoints**: Subscribe, Unsubscribe, Send

## Prerequisites

1. VAPID keys generated (see [PWA_ENHANCEMENTS_SETUP.md](./PWA_ENHANCEMENTS_SETUP.md))
2. AWS Amplify backend deployed
3. Environment variables configured

---

## Step 1: Generate VAPID Keys

If you haven't already, generate VAPID keys:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

**Output:**
```
Public Key: BK8x...your-public-key-here
Private Key: xYz...your-private-key-here
```

**Important:**
- **Public Key**: Used in frontend (safe to expose)
- **Private Key**: Used in backend (keep secret!)

---

## Step 2: Configure Environment Variables

### For AWS Amplify Console

1. Go to **AWS Amplify Console**
2. Navigate to your app
3. Go to **Environment variables**
4. Click **Manage variables**
5. Add the following variables:

#### Frontend Variables (VITE_*)
- **Key:** `VITE_VAPID_PUBLIC_KEY`
- **Value:** Your VAPID public key (from Step 1)

- **Key:** `VITE_PUSH_NOTIFICATIONS_API_URL`
- **Value:** Will be set after Function URL is created (see Step 4)

#### Backend Variables (Lambda)
- **Key:** `VAPID_PUBLIC_KEY`
- **Value:** Your VAPID public key (same as frontend)

- **Key:** `VAPID_PRIVATE_KEY`
- **Value:** Your VAPID private key (from Step 1) - **KEEP SECRET!**

- **Key:** `VAPID_EMAIL`
- **Value:** Email for VAPID (e.g., `noreply@onyxdispatch.us`)

### For Local Development

Create or update `.env` file:

```env
# Frontend
VITE_VAPID_PUBLIC_KEY=BK8x...your-public-key-here
VITE_PUSH_NOTIFICATIONS_API_URL=http://localhost:3000/api/push

# Backend (for local Lambda testing)
VAPID_PUBLIC_KEY=BK8x...your-public-key-here
VAPID_PRIVATE_KEY=xYz...your-private-key-here
VAPID_EMAIL=noreply@onyxdispatch.us
```

---

## Step 3: Deploy Backend

The backend is already configured in `amplify/backend.ts`. Deploy it:

```bash
# Deploy backend
ampx sandbox

# Or for production
ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

**What gets deployed:**
- `PushSubscription` model in GraphQL schema
- `pushNotifications` Lambda function
- IAM permissions for Lambda to access GraphQL API
- Environment variables configured

---

## Step 4: Create Function URL

After deployment, create a Function URL for the Lambda:

### Option A: AWS Console

1. Go to **AWS Lambda Console**
2. Find function: `pushNotifications-*` (or search for "pushNotifications")
3. Go to **Configuration** tab
4. Click **Function URL** in left sidebar
5. Click **Create function URL**
6. Configure:
   - **Auth type:** `AWS_IAM` or `NONE` (for public access)
   - **CORS:** Enable if needed
   - **Cross-origin resource sharing (CORS):**
     - **Allow origin:** `https://onyxdispatch.us` (or `*` for development)
     - **Allow methods:** `POST, OPTIONS`
     - **Allow headers:** `Content-Type`
7. Click **Save**
8. Copy the Function URL

### Option B: AWS CLI

```bash
aws lambda create-function-url-config \
  --function-name pushNotifications-XXXXX \
  --auth-type NONE \
  --cors '{"AllowOrigins": ["https://onyxdispatch.us"], "AllowMethods": ["POST", "OPTIONS"], "AllowHeaders": ["Content-Type"]}'
```

### Option C: CDK (in backend.ts)

Add to `amplify/backend.ts`:

```typescript
// Add Function URL for pushNotifications
backend.pushNotifications.resources.lambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['https://onyxdispatch.us'],
    allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
    allowedHeaders: ['Content-Type'],
  },
});
```

---

## Step 5: Configure Frontend API URL

After creating the Function URL, set it in environment variables:

### AWS Amplify Console

1. Go to **Environment variables**
2. Add or update:
   - **Key:** `VITE_PUSH_NOTIFICATIONS_API_URL`
   - **Value:** Your Function URL (from Step 4)
3. **Redeploy** frontend

### Local Development

Update `.env`:

```env
VITE_PUSH_NOTIFICATIONS_API_URL=https://xxxxx.lambda-url.us-east-1.on.aws/
```

---

## Step 6: Configure CORS (If Using NONE Auth)

If you set auth type to `NONE`, configure CORS in the Function URL settings:

**Allowed Origins:**
- Production: `https://onyxdispatch.us`
- Development: `*` or `http://localhost:3000`

**Allowed Methods:**
- `POST`
- `OPTIONS`

**Allowed Headers:**
- `Content-Type`

**Max Age:**
- `3600` (1 hour)

---

## Step 7: Test the Backend

### Test Subscribe Endpoint

```bash
curl -X POST https://YOUR-FUNCTION-URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "subscribe",
    "userId": "test-user-123",
    "companyId": "test-company-123",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "userAgent": "Mozilla/5.0..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription created",
  "id": "subscription-id-123"
}
```

### Test Send Endpoint

```bash
curl -X POST https://YOUR-FUNCTION-URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "userId": "test-user-123",
    "companyId": "test-company-123",
    "payload": {
      "title": "Test Notification",
      "body": "This is a test",
      "icon": "/icon-192x192.png"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Sent to 1 subscription(s)",
  "sent": 1,
  "failed": 0,
  "total": 1
}
```

### Test Unsubscribe Endpoint

```bash
curl -X POST https://YOUR-FUNCTION-URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "unsubscribe",
    "userId": "test-user-123",
    "companyId": "test-company-123",
    "endpoint": "https://fcm.googleapis.com/fcm/send/..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

---

## API Reference

### Subscribe Endpoint

**Action:** `subscribe`

**Request:**
```json
{
  "action": "subscribe",
  "userId": "cognito-user-id",
  "companyId": "company-id",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    }
  },
  "userAgent": "Mozilla/5.0..." // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created" | "Subscription updated",
  "id": "subscription-id"
}
```

### Unsubscribe Endpoint

**Action:** `unsubscribe`

**Request:**
```json
{
  "action": "unsubscribe",
  "userId": "cognito-user-id",
  "companyId": "company-id",
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

### Send Notification Endpoint

**Action:** `send`

**Request:**
```json
{
  "action": "send",
  "userId": "cognito-user-id", // Optional: send to specific user
  "companyId": "company-id", // Optional: send to all users in company
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "/icon-192x192.png", // Optional
    "badge": "/icon-192x192.png", // Optional
    "image": "https://...", // Optional
    "data": { // Optional: custom data
      "url": "/driver",
      "tripId": "trip-123"
    },
    "tag": "trip-assignment", // Optional
    "requireInteraction": false // Optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent to N subscription(s)",
  "sent": 5,
  "failed": 0,
  "total": 5
}
```

**Note:** Either `userId` or `companyId` (or both) must be provided.

---

## Usage Examples

### Send Notification When Trip is Assigned

```typescript
// In your Lambda or backend code
const response = await fetch(PUSH_NOTIFICATIONS_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send',
    userId: driver.userId, // Send to specific driver
    payload: {
      title: 'New Trip Assignment',
      body: `You have been assigned to trip ${trip.flightNumber}`,
      icon: '/icon-192x192.png',
      data: {
        url: '/driver',
        tripId: trip.id,
      },
      tag: 'trip-assignment',
    },
  }),
});
```

### Send Notification to All Users in Company

```typescript
const response = await fetch(PUSH_NOTIFICATIONS_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send',
    companyId: company.id, // Send to all users in company
    payload: {
      title: 'System Maintenance',
      body: 'Scheduled maintenance will occur tonight at 2 AM',
      icon: '/icon-192x192.png',
      tag: 'system-notification',
    },
  }),
});
```

### Send Notification from Management Dashboard

```typescript
// In ManagementDashboard.tsx or similar
import { sendPushNotification } from '../utils/pushNotifications';

// When trip is assigned
await sendPushNotification({
  userId: driver.userId,
  companyId: companyId,
  payload: {
    title: 'New Trip Assignment',
    body: `Trip ${trip.flightNumber} assigned to you`,
    data: { url: '/driver', tripId: trip.id },
  },
});
```

---

## Frontend Integration

The frontend is already integrated. Users can:

1. Click "Notifications" in navigation
2. Grant permission
3. Subscribe to push notifications
4. Subscription is automatically saved to backend

**No additional frontend code needed!**

---

## Security Considerations

### VAPID Private Key

- **NEVER** expose the private key in frontend code
- **NEVER** commit private key to git
- Store in environment variables only
- Use AWS Secrets Manager for production (optional)

### Function URL Security

**Option 1: AWS_IAM Auth (Recommended)**
- More secure
- Requires IAM signing for requests
- Frontend needs to sign requests with AWS credentials

**Option 2: NONE Auth with CORS**
- Simpler to implement
- Less secure
- Use CORS to restrict origins
- Consider adding API key or custom auth header

### Subscription Validation

The backend validates:
- User ID matches authenticated user
- Company ID is valid
- Subscription endpoint is valid
- Keys are properly formatted

---

## Monitoring and Logging

### CloudWatch Logs

View Lambda logs in AWS CloudWatch:

1. Go to **CloudWatch Console**
2. Click **Log groups**
3. Find: `/aws/lambda/pushNotifications-*`
4. View logs for:
   - Subscription events
   - Send attempts
   - Errors

### Metrics to Monitor

- **Invocation count**: How many requests
- **Error rate**: Failed requests
- **Duration**: Function execution time
- **Throttles**: Rate limiting issues

### Common Log Messages

**Success:**
```
[PushNotifications] Subscription created
[PushNotifications] Sent to 5 subscription(s)
```

**Errors:**
```
[PushNotifications] Error subscribing: ...
[PushNotifications] Error sending to subscription: ...
```

---

## Troubleshooting

### Subscription Not Saved

**Problem:** Subscription created but not in database

**Solutions:**
- Check Function URL is correct
- Verify CORS is configured
- Check CloudWatch logs for errors
- Verify userId and companyId are provided

### Notifications Not Received

**Problem:** Notification sent but user doesn't receive it

**Solutions:**
- Check subscription is valid in database
- Verify VAPID keys are correct
- Check browser console for errors
- Verify service worker is active
- Check notification permission is granted

### Invalid VAPID Key Error

**Problem:** `Invalid VAPID key` error

**Solutions:**
- Verify VAPID keys match (public in frontend, private in backend)
- Check keys are not corrupted
- Regenerate keys if needed

### Function URL Not Working

**Problem:** 403 or CORS errors

**Solutions:**
- Check CORS configuration
- Verify allowed origins
- Check auth type (NONE vs AWS_IAM)
- Verify Function URL is correct

### GraphQL Errors

**Problem:** Database errors when subscribing

**Solutions:**
- Verify PushSubscription model is deployed
- Check IAM permissions for Lambda
- Verify GraphQL endpoint is correct
- Check CloudWatch logs for details

---

## Production Checklist

Before going to production:

- [ ] VAPID keys generated and configured
- [ ] Environment variables set in Amplify
- [ ] Function URL created
- [ ] CORS configured correctly
- [ ] Frontend API URL configured
- [ ] Test subscribe endpoint
- [ ] Test send endpoint
- [ ] Test unsubscribe endpoint
- [ ] Monitor CloudWatch logs
- [ ] Set up CloudWatch alarms (optional)
- [ ] Document Function URL for team
- [ ] Test on mobile devices
- [ ] Verify HTTPS is enabled

---

## Next Steps

1. **Integrate with Trip Assignment**
   - Send notification when trip is assigned
   - Update `ManagementDashboard.tsx` or create helper function

2. **Add Notification Preferences**
   - Allow users to choose notification types
   - Store preferences in database
   - Filter notifications by preference

3. **Add Notification History**
   - Store sent notifications in database
   - Show notification history in UI
   - Allow users to mark as read

4. **Add Notification Templates**
   - Create reusable notification templates
   - Support variables (trip number, driver name, etc.)
   - Localization support

---

## Support

For issues:
1. Check CloudWatch logs
2. Review this documentation
3. Test endpoints with curl
4. Verify environment variables
5. Check browser console for frontend errors

---

*Last Updated: January 27, 2026*
