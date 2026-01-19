# Stripe Checkout 500 Error Troubleshooting

## Overview

If you're seeing a 500 Internal Server Error when trying to create a Stripe checkout session, follow these steps to diagnose and fix the issue.

## Step 1: Check CloudWatch Logs

The Lambda function logs detailed error information to CloudWatch. This is the **most important** step for diagnosing the issue.

### How to Access CloudWatch Logs

1. **Go to AWS Console** → **CloudWatch** → **Log groups**
2. **Find the log group** for your Lambda function:
   - Look for: `/aws/lambda/amplify-d1wxo3x0z5r1oq-main-branch-*-stripeCheckout-lambda`
   - Or search for: `stripeCheckout`
3. **Click on the most recent log stream**
4. **Look for error messages** - they will show:
   - The exact error message
   - Stack traces
   - Request details

### What to Look For

Common error messages you might see:

#### 1. "STRIPE_SECRET_KEY not configured"
**Solution:** Set `STRIPE_SECRET_KEY` in AWS Amplify Console environment variables (not `.env.local`)

#### 2. "Company not found: [companyId]"
**Solution:** 
- Verify the `companyId` being sent is correct
- Check that the company exists in the database
- Ensure the user is associated with a company

#### 3. "Failed to fetch company: [error]"
**Solution:**
- Check IAM permissions for the Lambda function
- Verify Amplify data client is properly configured
- Check if the company ID format is correct

#### 4. Stripe API Errors
**Solution:**
- Verify `STRIPE_SECRET_KEY` is correct (starts with `sk_`)
- Check Stripe dashboard for API errors
- Verify the price ID exists in Stripe

## Step 2: Verify Environment Variables

The Lambda function requires these environment variables:

### Required Variables (Set in AWS Amplify Console)

1. **STRIPE_SECRET_KEY**
   - Your Stripe secret key (starts with `sk_`)
   - Get from: Stripe Dashboard → Developers → API keys
   - **Important:** Use the **secret key**, not the publishable key

2. **STRIPE_PRICE_ID_BASIC** (optional but recommended)
   - Stripe Price ID for Basic plan
   - Get from: Stripe Dashboard → Products → [Your Basic Product] → Pricing

3. **STRIPE_PRICE_ID_PREMIUM** (optional but recommended)
   - Stripe Price ID for Premium plan
   - Get from: Stripe Dashboard → Products → [Your Premium Product] → Pricing

### How to Set Environment Variables in Amplify

1. Go to **AWS Amplify Console** → Your App → **Environment variables**
2. Click **Manage variables**
3. Add each variable:
   - **Key:** `STRIPE_SECRET_KEY`
   - **Value:** Your Stripe secret key (e.g., `sk_live_...` or `sk_test_...`)
4. Click **Save**
5. **Redeploy** your app for changes to take effect

## Step 3: Verify Function URL Configuration

1. **Go to AWS Lambda Console**
2. **Find your function:** `amplify-d1wxo3x0z5r1oq-main-branch-*-stripeCheckout-lambda`
3. **Check Function URL:**
   - Go to **Configuration** → **Function URL**
   - Verify it's enabled
   - Copy the URL
4. **Verify CORS settings:**
   - **Allow origins:** Your app domain (e.g., `https://main.d1wxo3x0z5r1oq.amplifyapp.com`)
   - **Allow methods:** `POST`
   - **Allow headers:** `Content-Type`
   - **Max age:** `86400`

## Step 4: Test the Lambda Function Directly

You can test the Lambda function directly from the AWS Console:

1. **Go to Lambda Console** → Your function → **Test**
2. **Create a test event:**
   ```json
   {
     "body": "{\"companyId\":\"YOUR_COMPANY_ID\",\"priceId\":\"YOUR_PRICE_ID\"}"
   }
   ```
3. **Run the test** and check the response

## Step 5: Common Issues and Solutions

### Issue: "Company not found"

**Possible causes:**
- Company ID is incorrect
- Company doesn't exist in database
- User is not associated with a company

**Solution:**
- Check the `companyId` being sent from the frontend
- Verify the company exists in your database
- Ensure the user has a company assigned

### Issue: "STRIPE_SECRET_KEY not configured"

**Solution:**
1. Go to AWS Amplify Console → Environment variables
2. Add `STRIPE_SECRET_KEY` with your Stripe secret key
3. Redeploy the app

### Issue: "Failed to create checkout session URL"

**Possible causes:**
- Invalid Stripe price ID
- Stripe API error
- Network issue

**Solution:**
- Verify the price ID exists in Stripe Dashboard
- Check Stripe API status
- Review CloudWatch logs for detailed Stripe error

### Issue: Amplify Data Client Errors

**Possible causes:**
- IAM permissions issue
- Schema mismatch
- Network connectivity

**Solution:**
- Check IAM role permissions for the Lambda function
- Verify the Amplify schema is deployed
- Check CloudWatch logs for specific error messages

## Step 6: Enable Detailed Logging

The Lambda function already includes detailed logging. To see more:

1. **Check CloudWatch Logs** (as described in Step 1)
2. **Look for these log entries:**
   - `Stripe Checkout event:` - Shows the incoming request
   - `Parsed request:` - Shows the parsed request data
   - `Stripe secret key configured:` - Shows if the key is set
   - `Error creating checkout session:` - Shows the error details

## Step 7: Verify Frontend Configuration

Make sure your frontend is sending the correct data:

1. **Check browser console** for the request being sent
2. **Verify `VITE_STRIPE_CHECKOUT_URL`** is set in `.env.local`
3. **Check the request payload:**
   ```javascript
   {
     companyId: "your-company-id",
     priceId: "price_xxxxx",
     successUrl: "https://your-app.com/management?checkout=success",
     cancelUrl: "https://your-app.com/management?checkout=canceled"
   }
   ```

## Getting Help

If you've checked all the above and still have issues:

1. **Check CloudWatch Logs** - This is the most important step
2. **Copy the error message** from CloudWatch
3. **Verify environment variables** are set correctly
4. **Test the Lambda function** directly in AWS Console
5. **Check Stripe Dashboard** for any API errors

## Quick Checklist

- [ ] CloudWatch logs checked for specific error
- [ ] `STRIPE_SECRET_KEY` set in Amplify Console (not `.env.local`)
- [ ] Function URL is enabled and accessible
- [ ] CORS is configured correctly
- [ ] Company ID is correct and company exists
- [ ] Price ID exists in Stripe Dashboard
- [ ] Frontend `VITE_STRIPE_CHECKOUT_URL` is set correctly
- [ ] App has been redeployed after environment variable changes
