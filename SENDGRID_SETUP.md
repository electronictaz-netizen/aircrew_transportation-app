# SendGrid Email Setup Guide (Recommended)

## Why SendGrid?

- ✅ **Very Fast**: Typically delivers emails in 1-3 seconds
- ✅ **Free Tier**: 100 emails/day forever (perfect for getting started)
- ✅ **Reliable**: Excellent deliverability and uptime
- ✅ **Easy Setup**: Simple API, good documentation
- ✅ **No Bundling Issues**: Uses REST API (no SDK needed)

## Setup Steps

### 1. Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Click **"Start for Free"**
3. Sign up (free tier includes 100 emails/day forever)

### 2. Create API Key

1. After signing in, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Give it a name (e.g., "Lambda Email Sender")
4. Choose **"Full Access"** or **"Restricted Access"** with "Mail Send" permission
5. **Copy the API key** (you won't see it again!)

### 3. Verify Sender Identity

You need to verify `noreply@onyxdispatch.us` or your domain:

#### Option A: Single Sender Verification (Quickest)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **"Create a Sender"**
3. Fill in:
   - **From Email**: `noreply@onyxdispatch.us`
   - **From Name**: `Onyx Transportation`
   - **Reply To**: (same or different email)
   - **Company Address**: Your company address
4. Click **"Create"**
5. **Verify the email**: SendGrid will send a verification email
6. Click the link in the email to verify

#### Option B: Domain Authentication (Better for Production)

1. Go to **Settings** → **Sender Authentication** → **Domain Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain: `onyxdispatch.us`
4. Choose your DNS provider
5. Add the DNS records SendGrid provides (SPF, DKIM, etc.)
6. Wait for verification (usually 5-30 minutes)

### 4. Configure Lambda Function

Set the environment variable in AWS Lambda Console:

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Find your `sendInvitationEmail` function
3. Go to **Configuration** → **Environment variables**
4. Click **Edit**
5. Add:
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: Your SendGrid API key from step 2
6. Optionally add:
   - **Key**: `EMAIL_FROM`
   - **Value**: `noreply@onyxdispatch.us` (or your verified sender)
7. **Save**

### 5. Test

1. Send a test invitation from your app
2. Email should arrive within 1-3 seconds
3. Check SendGrid Dashboard → **Activity** to see delivery status

## Pricing

- **Free**: 100 emails/day forever
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

For your use case (invitations, trip assignments, daily summaries), the free tier should be sufficient initially.

## Migration from Postmark

If you're currently using Postmark:

1. **Set up SendGrid** (steps above)
2. **Add `SENDGRID_API_KEY`** to Lambda environment variables
3. **Keep `POSTMARK_API_KEY`** as fallback (code will use SendGrid if available)
4. **Test** - emails will now use SendGrid
5. **Remove `POSTMARK_API_KEY`** once you confirm SendGrid is working

The code automatically prefers SendGrid if `SENDGRID_API_KEY` is set, otherwise falls back to Postmark.

## Troubleshooting

### "Invalid API key"
- Check that `SENDGRID_API_KEY` is set correctly in Lambda
- Verify the API key has "Mail Send" permission

### "Sender not verified"
- Verify your sender email in SendGrid (Settings → Sender Authentication)
- Or verify your domain

### "Email not delivered"
- Check SendGrid Activity dashboard
- Verify sender is authenticated
- Check recipient email is valid

## Support

- **SendGrid Docs**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **SendGrid Support**: [support.sendgrid.com](https://support.sendgrid.com)
- **SendGrid Status**: [status.sendgrid.com](https://status.sendgrid.com)
