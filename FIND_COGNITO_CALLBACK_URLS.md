# How to Find Cognito Callback URLs

## Problem

You're looking at the App Client page but don't see options for callback URLs or sign-out URLs.

## Solution: Look for OAuth 2.0 / Hosted UI Settings

Callback URLs are configured in the **OAuth 2.0** or **Hosted UI** settings, not in the basic App Client information.

## Step-by-Step Instructions

### Option 1: Via App Integration Tab (Recommended)

1. **Go back to the User Pool main page:**
   - In the left sidebar, click on **"App integration"** (or go back to the User Pool overview)
   - You should see a list of App clients

2. **Find your App Client:**
   - Look for App client ID: `14jfd7uoubk1ipsooe1349c5lk`
   - Or App client name: `amplifyAuthUserPoolAppClient...`

3. **Click on the App Client name** (not the edit button)

4. **Look for "Hosted UI" section:**
   - Scroll down past the App client information
   - You should see a section called **"Hosted UI"** or **"OAuth 2.0"**

5. **In the Hosted UI section, you'll find:**
   - **Allowed callback URLs**
   - **Allowed sign-out URLs**

### Option 2: Via User Pool App Integration Tab

1. **Go to User Pool Overview:**
   - Click on the User Pool name in the breadcrumb or left sidebar
   - Or click "View all" next to the current user pool dropdown

2. **Click on "App integration" tab** (at the top of the page)

3. **Find your App Client** in the list

4. **Click "Edit"** next to the App Client

5. **Scroll down to find:**
   - **"Hosted UI"** section
   - Or **"OAuth 2.0 grant types"** section

6. **Enable Hosted UI** (if not already enabled):
   - Check the box for **"Enable Hosted UI"**
   - This will reveal the callback URL fields

### Option 3: If Hosted UI is Not Enabled

If you don't see Hosted UI options, you may need to enable it:

1. **In the App Client edit page:**
   - Look for **"Hosted UI"** checkbox
   - Check it to enable
   - This will show callback URL fields

2. **Configure OAuth 2.0:**
   - **Allowed OAuth flows:** 
     - ✅ Authorization code grant
     - ✅ Implicit grant
   - **Allowed OAuth scopes:**
     - ✅ openid
     - ✅ email
     - ✅ profile

3. **Then you'll see:**
   - **Allowed callback URLs**
   - **Allowed sign-out URLs**

## What to Add

Once you find the callback URL fields, add:

**Allowed callback URLs:**
```
https://onyxdispatch.us
https://onyxdispatch.us/
https://onyxdispatch.us/*
https://main.d1wxo3x0z5r1oq.amplifyapp.com
https://main.d1wxo3x0z5r1oq.amplifyapp.com/
```

**Allowed sign-out URLs:**
```
https://onyxdispatch.us
https://onyxdispatch.us/
https://main.d1wxo3x0z5r1oq.amplifyapp.com
https://main.d1wxo3x0z5r1oq.amplifyapp.com/
```

## Alternative: Check if Using Amplify Hosted UI

If you're using Amplify's built-in authentication (not Cognito Hosted UI), the callback URLs might be managed differently:

1. **Check Amplify Console:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Your app → **App settings** → **Authentication**
   - Look for callback URL configuration there

2. **Check if using Amplify UI Authenticator:**
   - If you're using `@aws-amplify/ui-react` Authenticator component
   - The callback URLs might be auto-configured
   - But you still need to add the custom domain

## If You Still Can't Find It

1. **Try the AWS CLI:**
   ```bash
   aws cognito-idp describe-user-pool-client \
     --user-pool-id us-east-1_9qfKiQtHV \
     --client-id 14jfd7uoubk1ipsooe1349c5lk \
     --region us-east-1
   ```
   
   Look for `CallbackURLs` and `LogoutURLs` in the output.

2. **Check the App Integration tab directly:**
   - Go to User Pool → **App integration** tab
   - Look for **"Domain"** section
   - Look for **"App client settings"** section
   - The callback URLs should be in the App client settings

## Visual Guide

The callback URLs are typically found:
- **NOT** in the "Quick setup guide" tab (where you are now)
- **NOT** in the basic "App client information" section
- **YES** in the "Hosted UI" or "OAuth 2.0" section
- **YES** when you click "Edit" on the App client from the App integration page

## Quick Navigation

From where you are now:
1. Click on the User Pool name in the breadcrumb (top left)
2. Click **"App integration"** tab
3. Find your App Client → Click **"Edit"**
4. Scroll down to **"Hosted UI"** section
5. Enable Hosted UI if needed
6. Add callback URLs
