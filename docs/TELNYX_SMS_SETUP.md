# Telnyx SMS Integration Setup Guide

This guide will help you set up Telnyx for SMS/text messaging in the Onyx Transportation App.

## Overview

Telnyx provides two-way SMS capabilities with competitive pricing (~$0.004 per message part + carrier fees). This integration enables:
- SMS booking confirmations
- SMS trip reminders (24 hours, 1 hour before)
- SMS driver assignment notifications
- SMS "Driver En Route" / "Driver Arrived" / completion notifications
- SMS payment receipts
- Two-way SMS for customer support
- SMS opt-in/opt-out (TCPA compliance)

## Prerequisites

1. Telnyx account (create one at https://telnyx.com)
2. AWS Amplify app deployed
3. Access to AWS Console and Amplify Console

---

## Step 1: Create Telnyx Account and Get API Credentials

1. **Sign up for Telnyx**
   - Go to https://telnyx.com
   - Create a free account
   - Complete account verification

2. **Get API Credentials**
   - Log in to Telnyx Portal
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Give it a name (e.g., "Onyx Transportation App")
   - Copy the **API Key** (starts with `KEY_...`)
   - ⚠️ **Keep this secret!** Never commit it to version control

3. **Get Messaging Profile ID**
   - Go to **Messaging** → **Messaging Profiles**
   - If you don't have one, click **Create Messaging Profile**
   - Name it (e.g., "Onyx SMS Profile")
   - Copy the **Profile ID** (UUID format)

---

## Step 2: Purchase and Configure Phone Number

1. **Purchase a Phone Number**
   - Go to **Numbers** → **Buy Numbers**
   - Select your country (US recommended for US operations)
   - Choose a number type:
     - **Toll-Free** (recommended for high volume, better deliverability)
     - **Long Code** (cheaper, good for low-medium volume)
   - Search and purchase a number
   - Copy the phone number (e.g., `+15551234567`)

2. **Assign Number to Messaging Profile**
   - Go to **Numbers** → **Your Numbers**
   - Click on your purchased number
   - Under **Messaging Profile**, select your messaging profile
   - Save changes

3. **Configure 10DLC (US Only - Required for A2P messaging)**
   - Go to **Messaging** → **10DLC Campaigns**
   - Register your brand (if not already done)
   - Create a campaign for your use case:
     - Campaign Use Case: "Mixed" or "Customer Care"
     - Sample Messages: Provide examples of your SMS messages
   - Wait for approval (can take 1-3 business days)
   - Once approved, assign to your messaging profile

---

## Step 3: Set Up Webhook for Inbound SMS (Two-Way Messaging)

1. **Create Webhook Endpoint**
   - In AWS Amplify Console, note your app's domain
   - You'll need to create a Lambda Function URL for webhook handling
   - The webhook URL will be: `https://<your-lambda-url>/telnyx-webhook`

2. **Configure Webhook in Telnyx**
   - Go to **Messaging** → **Event Webhooks**
   - Click **Add Webhook**
   - **Webhook URL**: Enter your Lambda Function URL
   - **Events to Subscribe**:
     - ✅ `message.received` (for inbound SMS)
     - ✅ `message.finalized` (for delivery status)
   - **HTTP Method**: POST
   - **Save** the webhook

3. **Verify Webhook (Optional but Recommended)**
   - Telnyx will send a test webhook
   - Check your Lambda logs to verify receipt

---

## Step 4: Set Environment Variables in AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to your app
   - Go to **App Settings** → **Environment Variables**

2. **Add the following variables:**

   ```
   TELNYX_API_KEY=KEY_xxxxxxxxxxxxxxxxxxxxx
   TELNYX_MESSAGING_PROFILE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   TELNYX_PHONE_NUMBER=+15551234567
   ```

   ⚠️ **Security Note**: These are sensitive credentials. They will be automatically passed to Lambda functions via environment variables.

3. **Optional Variables:**
   ```
   TELNYX_WEBHOOK_SECRET=your-webhook-secret (if you set one in Telnyx)
   ```

---

## Step 5: Deploy the Integration

1. **The code is already set up in:**
   - `amplify/functions/sendTelnyxSms/` - Lambda function for sending SMS
   - `amplify/functions/telnyxWebhook/` - Lambda function for receiving inbound SMS
   - `src/utils/telnyxSms.ts` - Frontend utility for calling the SMS API

2. **Deploy via Git:**
   ```bash
   git add .
   git commit -m "Add Telnyx SMS integration"
   git push
   ```

3. **Wait for Amplify to deploy** (check Amplify Console)

---

## Step 6: Test the Integration

### Test Outbound SMS

1. **Via Lambda Function URL (if configured):**
   ```bash
   curl -X POST https://<your-lambda-url>/send-telnyx-sms \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "+15551234567",
       "message": "Test message from Onyx Transportation"
     }'
   ```

2. **Via Frontend (after integration):**
   - Use the `sendTelnyxSms` utility function
   - Example: Send test SMS from Management Dashboard

### Test Inbound SMS

1. **Send a test SMS** to your Telnyx phone number
2. **Check Lambda logs** in CloudWatch to verify webhook received
3. **Verify** the message appears in your application (if you've implemented inbound handling)

---

## Step 7: Configure SMS Opt-In/Opt-Out (TCPA Compliance)

### Add Fields to Customer Model

The integration includes support for SMS opt-in/opt-out. You'll need to:

1. **Add fields to Customer schema** (if not already present):
   - `smsOptIn: Boolean` - Whether customer has opted in to SMS
   - `smsOptOutAt: DateTime` - When customer opted out (if applicable)
   - `phoneNumber: String` - Customer's phone number

2. **Handle Opt-Out Keywords:**
   - When customer texts **STOP**, **UNSUBSCRIBE**, or **QUIT**
   - Update `smsOptOutAt` in database
   - Send confirmation: "You have been unsubscribed from SMS notifications."

3. **Handle Opt-In Keywords:**
   - When customer texts **START**, **YES**, or **SUBSCRIBE`
   - Update `smsOptIn = true` and clear `smsOptOutAt`
   - Send confirmation: "You have been subscribed to SMS notifications."

---

## Pricing Information

- **Outbound SMS**: ~$0.004 per message part (160 characters = 1 part)
- **Inbound SMS**: ~$0.004 per message part
- **Phone Number**: ~$1-5/month (varies by type)
- **10DLC Registration**: Free (but required for US A2P messaging)

**Example Cost:**
- 1,000 outbound messages/month = ~$4.00
- 1,000 inbound messages/month = ~$4.00
- Phone number = ~$2.00/month
- **Total: ~$10/month for 1,000 messages**

---

## Troubleshooting

### SMS Not Sending

1. **Check Lambda Logs:**
   - Go to CloudWatch → Log Groups
   - Find `/aws/lambda/sendTelnyxSms-*`
   - Look for error messages

2. **Verify Environment Variables:**
   - Ensure `TELNYX_API_KEY` is set correctly
   - Ensure `TELNYX_MESSAGING_PROFILE_ID` is set correctly
   - Ensure `TELNYX_PHONE_NUMBER` is in E.164 format (+1...)

3. **Check Telnyx Dashboard:**
   - Go to **Messaging** → **Outbound Messages**
   - Check for failed messages and error codes

### Webhook Not Receiving Messages

1. **Check Lambda Function URL:**
   - Ensure the URL is publicly accessible
   - Test with a simple HTTP request

2. **Check Telnyx Webhook Configuration:**
   - Verify webhook URL is correct
   - Check webhook status (should be "Active")

3. **Check Lambda Logs:**
   - Look for incoming webhook requests
   - Check for authentication errors (if using webhook secret)

### 10DLC Issues (US Only)

1. **Campaign Not Approved:**
   - Wait 1-3 business days for approval
   - Check campaign status in Telnyx dashboard
   - Ensure brand registration is complete

2. **Messages Blocked:**
   - Verify campaign is approved and active
   - Check message content against campaign use case
   - Ensure number is assigned to messaging profile

---

## Security Best Practices

1. **Never commit API keys to Git**
   - Use environment variables only
   - Add `.env` files to `.gitignore`

2. **Rotate API Keys Regularly**
   - Create new API keys every 90 days
   - Update environment variables
   - Delete old keys

3. **Use Webhook Secret (Optional but Recommended)**
   - Set a webhook secret in Telnyx
   - Verify webhook signature in Lambda handler
   - Prevents unauthorized webhook calls

4. **Rate Limiting**
   - Implement rate limiting in Lambda
   - Prevent abuse and control costs

---

## Next Steps

1. **Integrate SMS into Application:**
   - Update driver notification system to use Telnyx
   - Add SMS confirmation to booking portal
   - Implement trip reminder SMS

2. **Add SMS Preferences:**
   - Allow customers to opt-in/opt-out
   - Store preferences in database
   - Respect opt-out status before sending

3. **Monitor Usage:**
   - Set up CloudWatch alarms for high usage
   - Monitor costs in Telnyx dashboard
   - Track delivery rates

4. **Implement Two-Way Support:**
   - Handle inbound customer messages
   - Route to appropriate support channels
   - Auto-respond to common queries

---

## References

- [Telnyx API Documentation](https://developers.telnyx.com/docs/api/v2/messaging)
- [Telnyx SMS Best Practices](https://developers.telnyx.com/docs/api/v2/messaging)
- [10DLC Registration Guide](https://developers.telnyx.com/docs/api/v2/10dlc)
- [Webhook Security](https://developers.telnyx.com/docs/api/v2/webhooks)

---

## Support

- **Telnyx Support**: support@telnyx.com or https://support.telnyx.com
- **API Status**: https://status.telnyx.com
- **Documentation**: https://developers.telnyx.com
