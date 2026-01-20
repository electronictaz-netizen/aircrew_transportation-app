# AWS SES Setup Guide for Invitation Emails

This guide explains how to set up AWS Simple Email Service (SES) to enable automated invitation email sending.

## Overview

The invitation email functionality uses AWS SES to send emails automatically when you invite users to join a company. This requires:

1. **AWS SES Configuration** - Verify your email domain or email address
2. **Lambda Function URL** - Get the Function URL after deployment
3. **Environment Variable** - Configure the Function URL in your app

## Step 1: Set Up AWS SES

### Option A: Verify Your Email Address (Easiest for Testing)

1. **Go to AWS SES Console:**
   - Navigate to: https://console.aws.amazon.com/ses/
   - Make sure you're in the correct AWS region (e.g., `us-east-1`)

2. **Verify Email Address:**
   - Click "Verified identities" in the left sidebar
   - Click "Create identity"
   - Select "Email address"
   - Enter your email (e.g., `support@tazsoftware.biz`)
   - Click "Create identity"

3. **Check Your Email:**
   - AWS will send a verification email
   - Click the verification link in the email
   - Your email is now verified

4. **Request Production Access (if needed):**
   - By default, SES is in "Sandbox" mode
   - Sandbox allows sending to verified emails only
   - To send to any email address, request production access:
     - Go to "Account dashboard"
     - Click "Request production access"
     - Fill out the form (explain your use case)
     - Wait for approval (usually 24-48 hours)

### Option B: Verify Your Domain (Recommended for Production)

1. **Go to AWS SES Console:**
   - Navigate to: https://console.aws.amazon.com/ses/
   - Click "Verified identities" → "Create identity"

2. **Select Domain:**
   - Choose "Domain"
   - Enter your domain (e.g., `tazsoftware.biz`)
   - Check "Use a default DKIM signing key" (recommended)
   - Click "Create identity"

3. **Add DNS Records:**
   - AWS will provide DNS records to add
   - Add these records to your domain's DNS (via GoDaddy, Route 53, etc.)
   - Wait for verification (can take up to 72 hours, usually faster)

4. **Benefits of Domain Verification:**
   - Can send from any email address on that domain
   - Better deliverability
   - No need to verify individual email addresses

## Step 2: Deploy the Lambda Function

1. **Deploy the app:**
   ```bash
   npx ampx sandbox
   # or
   npx ampx pipeline-deploy --branch main
   ```

2. **Wait for deployment to complete**

3. **Get the Function URL:**
   - Go to AWS Lambda Console: https://console.aws.amazon.com/lambda/
   - Find the function named `sendInvitationEmail-*`
   - Click on it
   - Go to "Configuration" → "Function URL"
   - Copy the Function URL (e.g., `https://abc123.lambda-url.us-east-1.on.aws/`)

## Step 3: Configure the Function URL

### For Local Development

1. **Create or edit `.env.local` file:**
   ```bash
   VITE_SEND_INVITATION_EMAIL_URL=https://your-function-url.lambda-url.us-east-1.on.aws
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### For Production (Amplify Hosting)

1. **Go to AWS Amplify Console:**
   - Navigate to your app
   - Go to "Environment variables"

2. **Add Environment Variable:**
   - Key: `VITE_SEND_INVITATION_EMAIL_URL`
   - Value: Your Lambda Function URL (from Step 2)
   - Click "Save"

3. **Redeploy:**
   - The app will automatically redeploy with the new environment variable

## Step 4: Configure Sender Email (Optional)

By default, the Lambda function uses `support@tazsoftware.biz` as the sender email.

To change this:

1. **Set Environment Variable in Lambda:**
   - Go to AWS Lambda Console
   - Find `sendInvitationEmail-*` function
   - Go to "Configuration" → "Environment variables"
   - Add: `SES_SENDER_EMAIL` = `your-email@yourdomain.com`
   - **Important:** The sender email must be verified in SES

2. **Or Update in Code:**
   - Edit `amplify/functions/sendInvitationEmail/resource.ts`
   - Change the default in the `environment` section
   - Redeploy

## Step 5: Test the Invitation

1. **Log into the Admin Dashboard**
2. **Select a company**
3. **Click "+ Invite User"**
4. **Enter an email address** (must be verified if in Sandbox mode)
5. **Click "Send Invitation"**
6. **Check the recipient's email** - they should receive an invitation email

## Troubleshooting

### Error: "Email was rejected"

**Cause:** Email address not verified in SES (Sandbox mode) or domain not verified.

**Solution:**
- Verify the recipient email in SES (if in Sandbox mode)
- Or request production access to send to any email
- Or verify your domain to send from any address on that domain

### Error: "Sender email domain not verified"

**Cause:** The sender email domain is not verified in SES.

**Solution:**
- Verify the sender email address in SES
- Or verify the entire domain in SES
- Make sure the sender email matches a verified identity

### Error: "Unable to connect to email service"

**Cause:** Function URL not configured or incorrect.

**Solution:**
- Check that `VITE_SEND_INVITATION_EMAIL_URL` is set correctly
- Verify the Function URL is active in Lambda Console
- Make sure the Function URL doesn't have authentication enabled (should be public)

### Error: "Function URL not configured"

**Cause:** Environment variable not set.

**Solution:**
- Add `VITE_SEND_INVITATION_EMAIL_URL` to your `.env.local` (dev) or Amplify environment variables (production)
- Restart dev server or redeploy

### Emails going to spam

**Causes and Solutions:**
- **SPF/DKIM not configured:** Verify your domain in SES (Option B above) to automatically set these up
- **Low sender reputation:** Start with verified emails, gradually expand
- **Email content:** The template includes proper formatting, but you can customize it in `handler.ts`

## Cost Considerations

**AWS SES Pricing:**
- **Free Tier:** 62,000 emails/month (if sending from EC2)
- **Standard Pricing:** $0.10 per 1,000 emails
- **Very affordable** for most use cases

**Example:**
- 100 invitations/month = $0.01/month
- 1,000 invitations/month = $0.10/month
- 10,000 invitations/month = $1.00/month

## Security Best Practices

1. **Function URL Security:**
   - The Function URL is public but validates input
   - Consider adding API key authentication if needed (future enhancement)

2. **Email Validation:**
   - The function validates email format
   - Consider rate limiting to prevent abuse

3. **SES Configuration:**
   - Use domain verification for production
   - Set up bounce/complaint handling (SES can send to SNS)

## Next Steps

Once set up, invitation emails will be sent automatically when you invite users through the Admin Dashboard. The emails include:

- Company name
- User role
- Signup link with email pre-filled
- Professional HTML formatting

Users can click the link to sign up and will automatically be linked to the company!
