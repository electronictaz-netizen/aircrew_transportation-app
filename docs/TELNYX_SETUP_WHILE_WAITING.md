# Telnyx Setup Tasks While Waiting for Brand Verification

While waiting for Telnyx brand verification (10DLC registration), you can complete most of the integration setup. Here's what you can do now:

## ✅ Tasks You Can Complete Now

### 1. Set Up Environment Variables in AWS Amplify

Even though you can't send to US numbers yet, you can configure the environment variables:

1. **Go to AWS Amplify Console**
   - Navigate to your app
   - Go to **App Settings** → **Environment Variables**

2. **Add the following variables:**
   ```
   TELNYX_API_KEY=KEY_xxxxxxxxxxxxxxxxxxxxx
   TELNYX_MESSAGING_PROFILE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   TELNYX_PHONE_NUMBER=+15551234567  (if you have a number, otherwise leave empty for now)
   ```

   ⚠️ **Note**: If you don't have a phone number yet, you can leave `TELNYX_PHONE_NUMBER` empty or use a placeholder. You'll update it once you purchase a number.

### 2. Deploy the Integration Code

Deploy the Telnyx integration code to your Amplify app:

```bash
git add .
git commit -m "Add Telnyx SMS integration"
git push
```

This will deploy the Lambda functions even though they won't be fully functional until brand verification is complete.

### 3. Create Function URLs

After deployment, create Function URLs for the Lambda functions:

#### For `sendTelnyxSms`:
1. Go to **AWS Lambda Console**
2. Find the `sendTelnyxSms-*` function
3. Go to **Configuration** → **Function URL**
4. Click **Create function URL**
5. Set:
   - **Auth type**: `AWS_IAM` or `NONE` (if you want public access)
   - **CORS**: Enable if calling from frontend
6. Copy the Function URL
7. Add to Amplify environment variables:
   ```
   VITE_TELNYX_SMS_FUNCTION_URL=https://xxxxxxxxxxxx.lambda-url.us-east-1.on.aws/
   ```

#### For `telnyxWebhook`:
1. Find the `telnyxWebhook-*` function
2. Create Function URL (same steps as above)
3. Copy the URL - you'll use this in Telnyx webhook configuration

### 4. Test the Integration (Limited)

#### Test with Non-US Numbers (If Available)
If you have access to non-US phone numbers, you can test the integration:
- Some countries don't require 10DLC registration
- Test the Lambda function directly via Function URL
- Verify the API connection works

#### Test API Connection
You can test that your API key works by making a test request (even if it fails due to 10DLC):

```bash
curl -X POST https://<your-function-url> \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "message": "Test message"
  }'
```

You'll likely get an error about 10DLC, but this confirms:
- ✅ API key is valid
- ✅ Lambda function is working
- ✅ Connection to Telnyx API is established

### 5. Prepare Application Integration

While waiting, you can prepare the code integration:

#### Update Driver Notifications
Edit `src/utils/driverNotifications.ts` to add SMS support:

```typescript
import { sendTelnyxSms } from './telnyxSms';

// In the notifyDriver function, add:
if (driver.phone && (preference === 'sms' || preference === 'both')) {
  try {
    await sendTelnyxSms({
      phone: driver.phone,
      message: `New trip assignment: ${trip.flightNumber} on ${formatDate(trip.pickupDate)}`
    });
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
    // Fall back to email if SMS fails
  }
}
```

#### Update Booking Confirmations
Edit `amplify/functions/publicBooking/handler.ts` to add SMS confirmations:

```typescript
// After creating booking request, add:
if (bookingRequest.customerPhone) {
  // Check if customer has opted in to SMS (when you implement opt-in)
  try {
    await sendTelnyxSms({
      phone: bookingRequest.customerPhone,
      message: `Your booking request has been received. We'll confirm your trip shortly.`
    });
  } catch (error) {
    console.error('Failed to send booking SMS:', error);
    // Non-critical - booking still succeeds
  }
}
```

### 6. Set Up Monitoring and Logging

#### CloudWatch Alarms
Set up alarms for:
- Failed SMS sends
- High error rates
- Unusual usage patterns

#### Logging
The Lambda functions already include comprehensive logging. Check CloudWatch Logs to monitor:
- API connection status
- Error messages
- Delivery status

### 7. Configure Webhook (Optional)

Even though you can't receive messages yet, you can set up the webhook:

1. **In Telnyx Portal:**
   - Go to **Messaging** → **Event Webhooks**
   - Click **Add Webhook**
   - **Webhook URL**: Your `telnyxWebhook` Function URL
   - **Events**: Select `message.received` and `message.finalized`
   - **Save**

2. **Test Webhook:**
   - Telnyx will send a test webhook
   - Check CloudWatch logs to verify receipt

### 8. Prepare SMS Templates

Create message templates for different use cases:

```typescript
// src/utils/smsTemplates.ts
export const SMS_TEMPLATES = {
  DRIVER_ASSIGNMENT: (trip: Trip) => 
    `New trip: ${trip.flightNumber} on ${formatDate(trip.pickupDate)}. Pickup: ${trip.pickupLocation}`,
  
  BOOKING_CONFIRMATION: (booking: Booking) =>
    `Booking confirmed! Trip on ${formatDate(booking.pickupDate)}. We'll send updates via SMS.`,
  
  TRIP_REMINDER_24H: (trip: Trip) =>
    `Reminder: Your trip ${trip.flightNumber} is tomorrow at ${formatTime(trip.pickupDate)}`,
  
  TRIP_REMINDER_1H: (trip: Trip) =>
    `Your trip ${trip.flightNumber} is in 1 hour. Driver will arrive at ${trip.pickupLocation}`,
};
```

### 9. Add SMS Preferences to Data Model

If not already present, add SMS fields to your Customer model:

```typescript
// amplify/data/resource.ts
Customer: a.model({
  // ... existing fields
  phoneNumber: a.string(),
  smsOptIn: a.boolean(),
  smsOptOutAt: a.datetime(),
  smsOptInAt: a.datetime(),
})
```

Then run:
```bash
npx ampx sandbox
# or deploy to update schema
```

### 10. Implement Opt-In/Opt-Out Logic

Complete the TODO items in `amplify/functions/telnyxWebhook/handler.ts`:

```typescript
// In handleInboundMessage function:
if (optOutKeywords.some(keyword => upperText.includes(keyword))) {
  // Update customer record
  await client.models.Customer.update({
    id: customerId,
    smsOptOutAt: new Date().toISOString(),
  });
  
  // Send confirmation
  await sendTelnyxSms({
    phone: from,
    message: 'You have been unsubscribed from SMS notifications. Reply START to resubscribe.'
  });
}
```

### 11. Add SMS Settings UI

Add SMS configuration to Company Management:

```typescript
// src/components/CompanyManagement.tsx
// Add SMS settings section:
<div>
  <h4>SMS Notifications</h4>
  <label>
    <input 
      type="checkbox" 
      checked={smsEnabled}
      onChange={(e) => setSmsEnabled(e.target.checked)}
    />
    Enable SMS notifications
  </label>
  {/* Add more SMS settings */}
</div>
```

### 12. Test Error Handling

Test that your application handles SMS failures gracefully:

- Invalid phone numbers
- API errors
- Network timeouts
- Rate limiting

Ensure the app continues to work even if SMS fails.

## ⏳ What to Wait For

### Brand Verification Completion
Once Telnyx approves your brand registration:
1. ✅ You'll receive an email notification
2. ✅ Your messaging profile will be activated
3. ✅ You can start sending to US numbers

### After Brand Verification

1. **Purchase Phone Number** (if not already done)
   - Go to Telnyx → Numbers → Buy Numbers
   - Purchase a toll-free or long code number
   - Assign to your messaging profile

2. **Create 10DLC Campaign**
   - Go to Messaging → 10DLC Campaigns
   - Create campaign with your use case
   - Wait for campaign approval (usually faster than brand)

3. **Test End-to-End**
   - Send test SMS to your own phone
   - Verify delivery
   - Test inbound SMS
   - Test opt-in/opt-out

## 📋 Pre-Launch Checklist

Before going live with SMS:

- [ ] Brand verification approved
- [ ] 10DLC campaign approved
- [ ] Phone number purchased and configured
- [ ] Environment variables set
- [ ] Function URLs created
- [ ] Webhook configured and tested
- [ ] SMS templates created
- [ ] Opt-in/opt-out logic implemented
- [ ] Error handling tested
- [ ] Monitoring/alarms configured
- [ ] TCPA compliance verified (opt-in required)

## 🚀 Quick Start After Approval

Once brand verification is complete:

1. **Update Environment Variables:**
   - Add/update `TELNYX_PHONE_NUMBER` if needed

2. **Test Send:**
   ```bash
   curl -X POST https://<function-url> \
     -H "Content-Type: application/json" \
     -d '{"phone": "+15551234567", "message": "Test from Onyx"}'
   ```

3. **Verify Delivery:**
   - Check Telnyx dashboard → Messaging → Outbound Messages
   - Verify message status

4. **Enable in Production:**
   - Turn on SMS notifications in your app
   - Monitor for first few days
   - Check CloudWatch logs for any issues

## 💡 Pro Tips

- **Use Test Mode**: Telnyx may have a test/sandbox mode you can use while waiting
- **Document Everything**: Keep notes on your setup for future reference
- **Prepare Templates**: Create all your SMS message templates now
- **Review TCPA Compliance**: Ensure you understand opt-in requirements
- **Set Budget Alerts**: Configure billing alerts in Telnyx dashboard

## 📞 Support

If you have questions while waiting:
- **Telnyx Support**: support@telnyx.com
- **Telnyx Docs**: https://developers.telnyx.com
- **Status Page**: https://status.telnyx.com

---

**Bottom Line**: You can complete about 90% of the integration while waiting for brand verification. Once approved, you'll just need to test and enable!
