# Booking Email Notifications Setup

## Overview

The booking portal now sends automatic email notifications when customers submit booking requests:

1. **Customer Confirmation Email**: Sent to the customer confirming their booking request was received
2. **Manager Notification Email**: (Future enhancement) Will notify company managers of new booking requests

## Prerequisites

1. **Email Service Configured**: You need either SendGrid or Postmark API keys configured (same as invitation emails)
   - See `SENDGRID_SETUP.md` or `POSTMARK_SETUP.md` for setup instructions
   - The same API keys used for `sendInvitationEmail` will work for booking emails

2. **Lambda Function URL**: After deployment, you'll need to create a Function URL for `sendBookingEmail`

## Setup Steps

### Step 1: Deploy the Backend

The `sendBookingEmail` Lambda function is already included in the backend. After deployment:

1. Go to AWS Lambda Console
2. Find your function: Look for `sendBookingEmail` (it will have a name like `[app-id]-[branch]-sendBookingEmail-[hash]`)
3. Go to **Configuration** → **Function URL**
4. Click **Create function URL**
5. Configure:
   - **Auth type**: `NONE` (or `AWS_IAM` if you prefer)
   - **CORS**: Enable CORS if needed
6. Copy the Function URL

### Step 2: Configure Environment Variables

#### For the `sendBookingEmail` Lambda:

1. Go to Lambda Console → `sendBookingEmail` function
2. Go to **Configuration** → **Environment variables**
3. Add/verify these variables:
   - `SENDGRID_API_KEY` (preferred) OR `POSTMARK_API_KEY` (fallback)
   - `EMAIL_FROM` (optional, defaults to `noreply@onyxdispatch.us`)

#### For the `publicBooking` Lambda:

1. Go to Lambda Console → `publicBooking` function
2. Go to **Configuration** → **Environment variables**
3. Add:
   - **Key**: `BOOKING_EMAIL_FUNCTION_URL`
   - **Value**: The Function URL you copied from Step 1

### Step 3: Test

1. Submit a booking request through the booking portal
2. Check the customer's email for the confirmation email
3. Check CloudWatch logs for `publicBooking` and `sendBookingEmail` functions to verify emails are being sent

## Email Templates

### Customer Confirmation Email

Includes:
- Booking request ID
- Trip details (pickup date/time, locations, passengers, etc.)
- Next steps information
- Company contact information

### Manager Notification Email (Future)

Will include:
- Customer contact information
- Complete trip details
- Link to review/accept booking in Management Dashboard

## Troubleshooting

### Emails Not Sending

1. **Check Function URL**: Verify `BOOKING_EMAIL_FUNCTION_URL` is set correctly in `publicBooking` Lambda
2. **Check API Keys**: Verify `SENDGRID_API_KEY` or `POSTMARK_API_KEY` is set in `sendBookingEmail` Lambda
3. **Check CloudWatch Logs**: 
   - Look for errors in `publicBooking` function logs
   - Look for errors in `sendBookingEmail` function logs
4. **Verify Email Service**: Test that your SendGrid/Postmark account is working by sending a test invitation email

### Email Failures Don't Break Booking Creation

The email sending is **non-blocking**. If emails fail to send:
- The booking request will still be created successfully
- Errors will be logged in CloudWatch
- Customers will still see the success message in the booking portal

### Function URL Not Found

If you see "BOOKING_EMAIL_FUNCTION_URL not configured" in logs:
- The booking will still be created
- Emails just won't be sent
- Set the environment variable and redeploy to enable emails

## Current Status

✅ **Implemented:**
- Customer confirmation emails
- Email templates (HTML and plain text)
- Error handling (non-blocking)
- Integration with existing email service (SendGrid/Postmark)

⏳ **Future Enhancements:**
- Manager notification emails (requires fetching manager emails from CompanyUser records)
- Email notifications when booking status changes (accepted/rejected)
- SMS notifications option
- Customizable email templates per company

## Notes

- The same email service (SendGrid/Postmark) used for invitation emails is used for booking emails
- No additional API keys or services are required
- Email sending failures are logged but don't prevent booking creation
- The Function URL must be created manually in AWS Lambda Console (similar to `sendInvitationEmail`)
