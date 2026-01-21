# Postmark Email Setup Guide

## Overview

This guide explains how to set up Postmark (a transactional email service) to send invitation emails, trip assignments, and daily summaries from your app. Postmark provides reliable email delivery without the complexity of SMTP authentication.

## Why Postmark?

- ✅ **No SMTP/MFA hassles**: Uses simple API key authentication
- ✅ **Excellent deliverability**: Built for transactional emails
- ✅ **Free tier**: 100 emails/month free, then $15/month for 10,000 emails
- ✅ **Easy setup**: Just verify your domain and get an API key
- ✅ **Great developer experience**: Clean API, good documentation

## Setup Steps

### 1. Create Postmark Account

1. Go to [postmarkapp.com](https://postmarkapp.com)
2. Click **"Sign Up"** or **"Start Free Trial"**
3. Create your account (free tier includes 100 emails/month)

### 2. Create a Server

1. After signing in, you'll be prompted to create a **Server**
2. Give it a name (e.g., "Onyx Transportation App")
3. Choose **"Transactional"** as the server type
4. Click **"Create Server"**

### 3. Verify Your Sender Domain

You need to verify that you own `onyxdispatch.us` (or your sending domain):

1. In your Postmark server, go to **"Sending"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `onyxdispatch.us`
4. Postmark will provide DNS records to add:
   - **SPF record**: Authorizes Postmark to send on your behalf
   - **DKIM records**: Signs your emails for better deliverability
   - **Return-Path record**: Handles bounces

5. **Add DNS records to your domain**:
   - Log into your domain registrar (where you bought `onyxdispatch.us`)
   - Go to DNS management
   - Add the records Postmark provides (usually takes 5-30 minutes to propagate)

6. **Verify in Postmark**: Once DNS records are added, click **"Verify"** in Postmark

### 4. Get Your Server API Token

1. In your Postmark server, go to **"API Tokens"**
2. You'll see your **Server API Token** (starts with something like `abc123...`)
3. **Copy this token** - you'll need it for the Lambda function

### 5. Configure Lambda Function

Set the environment variable in Amplify:

#### Option A: Via Amplify Console (Recommended)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Go to **"Functions"** → **"sendInvitationEmail"**
4. Click **"Edit"** or **"Environment variables"**
5. Add:
   - **Key**: `POSTMARK_API_KEY`
   - **Value**: Your Server API Token from step 4
6. Optionally add:
   - **Key**: `POSTMARK_FROM_EMAIL`
   - **Value**: `noreply@onyxdispatch.us` (or your verified sender email)
7. **Save** and **redeploy** the function

#### Option B: Via Amplify CLI

```bash
amplify function update sendInvitationEmail
# Follow prompts to add environment variables
# Add POSTMARK_API_KEY with your token
# Add POSTMARK_FROM_EMAIL (optional, defaults to noreply@onyxdispatch.us)
amplify push
```

#### Option C: Via AWS Console (Direct Lambda)

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Find your `sendInvitationEmail` function
3. Go to **"Configuration"** → **"Environment variables"**
4. Click **"Edit"**
5. Add:
   - **POSTMARK_API_KEY**: Your Server API Token
   - **POSTMARK_FROM_EMAIL**: `noreply@onyxdispatch.us` (optional)
6. **Save**

### 6. Test the Setup

1. **Send a test invitation** from your app
2. Check the recipient's inbox (and spam folder)
3. Check Postmark dashboard → **"Activity"** to see delivery status

## Alternative Email Providers

If you prefer a different provider, here are alternatives:

### SendGrid
- **Free tier**: 100 emails/day forever
- **Setup**: Similar to Postmark (API key + domain verification)
- **SDK**: `@sendgrid/mail`
- **Website**: [sendgrid.com](https://sendgrid.com)

### Mailgun
- **Free tier**: 5,000 emails/month for 3 months, then 1,000/month
- **Setup**: API key + domain verification
- **SDK**: `mailgun.js`
- **Website**: [mailgun.com](https://mailgun.com)

### Brevo (formerly Sendinblue)
- **Free tier**: 300 emails/day
- **Setup**: API key + sender verification
- **SDK**: `@getbrevo/brevo`
- **Website**: [brevo.com](https://brevo.com)

### Resend
- **Free tier**: 3,000 emails/month
- **Setup**: API key + domain verification
- **SDK**: `resend`
- **Website**: [resend.com](https://resend.com)

**Note**: If you want to switch to a different provider, you'll need to:
1. Update the Lambda handler to use that provider's SDK
2. Update `package.json` with the new dependency
3. Update environment variables accordingly

## Troubleshooting

### "Invalid API key" Error

- **Check**: Ensure `POSTMARK_API_KEY` is set correctly in Lambda environment variables
- **Verify**: The API key matches your Server API Token from Postmark dashboard
- **Note**: Make sure you're using the **Server API Token**, not the Account API Token

### "Sender signature not verified" Error

- **Check**: Domain verification status in Postmark dashboard
- **Verify**: DNS records are correctly added and propagated (can take up to 48 hours)
- **Test**: Use Postmark's DNS checker tool

### "Email not received"

- **Check**: Postmark Activity dashboard for delivery status
- **Check spam folder**: Even with good deliverability, some emails may go to spam initially
- **Verify**: Recipient email address is correct
- **Check**: Postmark account hasn't hit rate limits or billing issues

### Lambda Function Errors

- **Check CloudWatch Logs**: Look for detailed error messages
- **Verify**: Environment variables are set correctly
- **Test**: Use Postmark's test email feature in their dashboard first

## Cost Considerations

### Postmark Pricing
- **Free**: 100 emails/month
- **Paid**: $15/month for 10,000 emails, then $1.25 per 1,000 additional emails

### Estimate Your Usage
- **Invitation emails**: ~1 per new user
- **Trip assignment emails**: ~1 per trip assignment
- **Daily summaries**: ~1 per active driver per day

**Example**: 50 drivers, 200 trips/month, 10 new users/month
- Daily summaries: 50 drivers × 30 days = 1,500 emails/month
- Trip assignments: 200 emails/month
- Invitations: 10 emails/month
- **Total**: ~1,710 emails/month = **$15/month** (within 10,000 limit)

## Security Best Practices

1. **Never commit API keys**: Always use environment variables
2. **Rotate keys periodically**: Change your API key every 6-12 months
3. **Use separate servers**: Create different Postmark servers for dev/staging/production
4. **Monitor activity**: Regularly check Postmark dashboard for unusual activity
5. **Set up alerts**: Configure Postmark to alert on bounces/complaints

## Next Steps

After setting up Postmark:

1. ✅ Verify domain in Postmark
2. ✅ Set `POSTMARK_API_KEY` in Lambda environment variables
3. ✅ Test sending an invitation email
4. ✅ Monitor Postmark dashboard for delivery status
5. ✅ Consider setting up bounce/complaint handling (Postmark webhooks)

## Support

- **Postmark Documentation**: [postmarkapp.com/developer](https://postmarkapp.com/developer)
- **Postmark Support**: [postmarkapp.com/support](https://postmarkapp.com/support)
- **Postmark Status**: [status.postmarkapp.com](https://status.postmarkapp.com)
