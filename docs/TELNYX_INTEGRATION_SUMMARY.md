# Telnyx SMS Integration - Implementation Summary

## Files Created

### Documentation
- ✅ `docs/TELNYX_SMS_SETUP.md` - Complete setup guide with step-by-step instructions

### Backend Lambda Functions
- ✅ `amplify/functions/sendTelnyxSms/handler.ts` - Lambda function for sending SMS via Telnyx
- ✅ `amplify/functions/sendTelnyxSms/resource.ts` - Function resource definition
- ✅ `amplify/functions/sendTelnyxSms/package.json` - Package configuration
- ✅ `amplify/functions/telnyxWebhook/handler.ts` - Lambda function for handling inbound SMS and webhooks
- ✅ `amplify/functions/telnyxWebhook/resource.ts` - Function resource definition
- ✅ `amplify/functions/telnyxWebhook/package.json` - Package configuration

### Frontend Utilities
- ✅ `src/utils/telnyxSms.ts` - Frontend utility for calling the SMS API

### Backend Configuration
- ✅ Updated `amplify/backend.ts` to include Telnyx functions and environment variables

## What's Implemented

### ✅ Outbound SMS
- Send SMS messages via Telnyx API
- Phone number normalization (E.164 format)
- Error handling and logging
- Support for both direct Lambda invocation and HTTP Function URL

### ✅ Inbound SMS Webhook
- Receive inbound SMS messages
- Handle delivery status updates
- Basic opt-in/opt-out keyword detection (STOP, START, etc.)
- Webhook signature verification (optional)

### ✅ Frontend Integration
- Utility function for sending SMS from frontend
- Phone number formatting and validation
- Error handling

## Next Steps to Complete Integration

### 1. Set Up Telnyx Account (Follow `docs/TELNYX_SMS_SETUP.md`)
- [ ] Create Telnyx account
- [ ] Get API key and messaging profile ID
- [ ] Purchase phone number
- [ ] Configure 10DLC (US only)

### 2. Configure Environment Variables
In AWS Amplify Console → App Settings → Environment Variables:
- [ ] `TELNYX_API_KEY` - Your Telnyx API key
- [ ] `TELNYX_MESSAGING_PROFILE_ID` - Your messaging profile ID
- [ ] `TELNYX_PHONE_NUMBER` - Your Telnyx phone number (E.164 format)
- [ ] `TELNYX_WEBHOOK_SECRET` (optional) - Webhook secret for signature verification

### 3. Create Function URLs
After deployment, create Function URLs for:
- [ ] `sendTelnyxSms` - For sending SMS from frontend
- [ ] `telnyxWebhook` - For receiving Telnyx webhooks

Set `VITE_TELNYX_SMS_FUNCTION_URL` in Amplify environment variables with the Function URL.

### 4. Configure Telnyx Webhook
- [ ] In Telnyx Portal → Messaging → Event Webhooks
- [ ] Add webhook with your `telnyxWebhook` Function URL
- [ ] Subscribe to `message.received` and `message.finalized` events

### 5. Integrate into Application

#### Driver Notifications
Update `src/utils/driverNotifications.ts` to use Telnyx:
```typescript
import { sendTelnyxSms } from './telnyxSms';

// In notifyDriver function, add SMS support
if (driver.phone && (preference === 'sms' || preference === 'both')) {
  await sendTelnyxSms({
    phone: driver.phone,
    message: `New trip assignment: ${trip.flightNumber} on ${trip.pickupDate}`
  });
}
```

#### Booking Confirmations
Update `amplify/functions/publicBooking/handler.ts` to send SMS confirmations:
```typescript
// After creating booking request
if (bookingRequest.customerPhone) {
  await sendTelnyxSms({
    phone: bookingRequest.customerPhone,
    message: `Your booking request has been received. We'll confirm shortly.`
  });
}
```

#### Trip Reminders
Create a scheduled Lambda (EventBridge) to send reminders:
- 24 hours before trip
- 1 hour before trip

### 6. Add SMS Preferences to Customer Model
If not already present, add to `amplify/data/resource.ts`:
```typescript
Customer: a.model({
  // ... existing fields
  phoneNumber: a.string(),
  smsOptIn: a.boolean(),
  smsOptOutAt: a.datetime(),
})
```

### 7. Implement Opt-In/Opt-Out Handling
Complete the TODO items in `amplify/functions/telnyxWebhook/handler.ts`:
- [ ] Update customer records when STOP/START keywords are received
- [ ] Send confirmation messages for opt-in/opt-out
- [ ] Respect opt-out status before sending SMS

### 8. Add SMS Settings to Company Management
Add SMS configuration UI in `src/components/CompanyManagement.tsx`:
- [ ] Enable/disable SMS notifications
- [ ] Configure SMS templates
- [ ] Set default opt-in message

## Testing Checklist

- [ ] Test outbound SMS via Function URL
- [ ] Test outbound SMS via frontend utility
- [ ] Test inbound SMS webhook
- [ ] Test opt-out keyword (STOP)
- [ ] Test opt-in keyword (START)
- [ ] Verify delivery status webhooks
- [ ] Test error handling (invalid phone, API errors)

## Cost Estimation

For 1,000 messages/month:
- Outbound SMS: ~$4.00
- Inbound SMS: ~$4.00
- Phone number: ~$2.00/month
- **Total: ~$10/month**

## Security Notes

- ✅ API keys stored in environment variables (never in code)
- ✅ Webhook signature verification supported (optional)
- ✅ All SMS sending goes through backend (no API keys in frontend)
- ⚠️ Remember to rotate API keys regularly
- ⚠️ Set up CloudWatch alarms for high usage

## Documentation

- Full setup guide: `docs/TELNYX_SMS_SETUP.md`
- Telnyx API docs: https://developers.telnyx.com/docs/api/v2/messaging
- Webhook docs: https://developers.telnyx.com/docs/api/v2/webhooks
