# SMS Integration Setup Guide

This guide explains how to set up SMS integration for driver notifications and daily assignments using AWS SNS (Simple Notification Service).

## Overview

The SMS integration uses:
- **AWS SNS** for sending SMS messages
- **AWS Lambda** function (via Amplify) to handle SMS sending
- **Frontend utilities** to call the SMS service

## Prerequisites

1. **AWS Account** with access to SNS
2. **AWS SNS SMS Configuration**:
   - SMS spending limit configured (to prevent unexpected charges)
   - Phone number validation (if required by your region)
   - Sender ID configured (optional, for branded SMS)

## Setup Steps

### 1. Configure AWS SNS SMS Settings

1. **Go to AWS SNS Console**:
   - Navigate to [AWS SNS Console](https://console.aws.amazon.com/sns/)
   - Select your region

2. **Set SMS Spending Limit** (Important!):
   - Go to "Text messaging (SMS)" → "Preferences"
   - Set a monthly spending limit to prevent unexpected charges
   - Recommended: Start with $50-100/month and adjust based on usage

3. **Configure Sender ID** (Optional):
   - Go to "Text messaging (SMS)" → "Preferences"
   - Set a default sender ID (e.g., your company name)
   - Note: Sender ID is not supported in all regions (US/Canada don't support it)

4. **Request Production Access** (if needed):
   - By default, AWS SNS SMS is in "Sandbox" mode
   - Sandbox mode only allows sending to verified phone numbers
   - For production, request production access:
     - Go to "Text messaging (SMS)" → "Account preferences"
     - Click "Request production access"
     - Fill out the form and submit

### 2. Verify Phone Numbers (Sandbox Mode Only)

If you're in sandbox mode, you need to verify phone numbers:

1. Go to "Text messaging (SMS)" → "Phone numbers"
2. Click "Create phone number"
3. Enter the phone number to verify
4. Enter the verification code sent to that number

**Note**: In production mode, you can send to any phone number without verification.

### 3. Deploy the Amplify Function

The SMS function is already configured in the codebase. Deploy it:

```bash
# Deploy the backend (including the SMS function)
npx ampx sandbox --once

# Or deploy via Amplify Console
# The function will be deployed automatically when you push to your repository
```

### 4. Verify IAM Permissions

The function needs permission to publish SMS via SNS. This is configured in `amplify/backend.ts`:

```typescript
backend.sendSMS.resources.lambda.addToRolePolicy({
  effect: 'Allow',
  actions: ['sns:Publish'],
  resources: ['*'],
});
```

Verify this is working by checking the Lambda function's execution role in AWS Console.

### 5. Test SMS Sending

1. **Test via Console**:
   - Open the app
   - Go to Management Dashboard
   - Try sending a daily assignment email with SMS enabled
   - Check the browser console for errors

2. **Test via AWS Console**:
   - Go to Lambda Console
   - Find the `sendSMS` function
   - Create a test event:
     ```json
     {
       "phoneNumber": "+1234567890",
       "message": "Test SMS message"
     }
     ```
   - Run the test and check the result

## Phone Number Format

Phone numbers must be in **E.164 format**:
- Starts with `+`
- Country code (e.g., `1` for US/Canada)
- Phone number (10 digits for US/Canada)

Examples:
- US: `+12345678901`
- Canada: `+14161234567`
- UK: `+447911123456`

The SMS service automatically formats phone numbers, but ensure drivers' phone numbers in the database are in a valid format.

## Cost Considerations

### AWS SNS SMS Pricing

- **US/Canada**: ~$0.00645 per SMS
- **Other countries**: Varies by country (check AWS pricing page)
- **Free tier**: Not available for SMS

### Cost Estimation

For 100 drivers receiving daily assignments:
- 100 SMS/day × 30 days = 3,000 SMS/month
- 3,000 × $0.00645 = **~$19.35/month**

**Recommendations**:
1. Set a spending limit in SNS
2. Monitor usage via CloudWatch
3. Consider sending SMS only for urgent notifications
4. Use email for daily summaries (free)

## Troubleshooting

### SMS Not Sending

1. **Check Lambda Function Logs**:
   - Go to CloudWatch → Log groups
   - Find `/aws/lambda/sendSMS`
   - Check for errors

2. **Check SNS Permissions**:
   - Verify Lambda execution role has `sns:Publish` permission
   - Check if SNS is in sandbox mode (requires verified numbers)

3. **Check Phone Number Format**:
   - Ensure phone numbers are in E.164 format
   - Verify phone numbers are valid

4. **Check Spending Limits**:
   - Verify SMS spending limit hasn't been reached
   - Check account status in SNS console

### Common Errors

**"Invalid phone number format"**:
- Phone number must be in E.164 format
- Check driver's phone number in database

**"SMS sending rate limit exceeded"**:
- AWS has rate limits for SMS
- Implement retry logic with exponential backoff

**"Sandbox mode: phone number not verified"**:
- Request production access in SNS
- Or verify the phone number in SNS console

**"Function not found"**:
- Function may not be deployed
- Check Amplify deployment status
- Verify function name matches in code

## Security Best Practices

1. **Never expose AWS credentials** in frontend code
2. **Use IAM roles** for Lambda function permissions
3. **Set spending limits** to prevent abuse
4. **Monitor usage** via CloudWatch
5. **Validate phone numbers** before sending
6. **Rate limit** SMS sending to prevent spam

## Monitoring

### CloudWatch Metrics

Monitor SMS usage:
- `NumberOfMessagesSent` - Total SMS sent
- `NumberOfMessagesFailed` - Failed SMS
- `SMSMonthToDateSpentUSD` - Current month spending

### Set Up Alarms

1. Go to CloudWatch → Alarms
2. Create alarm for `SMSMonthToDateSpentUSD`
3. Set threshold (e.g., 80% of spending limit)
4. Configure SNS topic for notifications

## Alternative: Using Twilio

If you prefer Twilio over AWS SNS:

1. Create a Twilio account
2. Get API credentials
3. Update `amplify/functions/sendSMS/handler.ts` to use Twilio SDK
4. Store credentials in AWS Secrets Manager
5. Update IAM permissions accordingly

## Support

For issues:
1. Check CloudWatch logs
2. Verify SNS configuration
3. Test with a single phone number first
4. Contact AWS support if needed

---

**Last Updated**: January 2025
