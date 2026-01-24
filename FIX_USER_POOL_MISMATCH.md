# Fix User Pool Mismatch - 401 Unauthorized

## Problem Identified

From the Network tab, I can see:
- ✅ Authorization header is present (token is being sent)
- ✅ Request is going to correct AppSync API
- ❌ **Token issuer**: `us-east-1_jIICT17l6`
- ❌ **AppSync expects**: `us-east-1_9qfKiQtHV`

**The token is from a different User Pool than what AppSync is configured for!**

## Root Cause

The user is authenticated with User Pool `us-east-1_jIICT17l6`, but AppSync API is configured to accept tokens from User Pool `us-east-1_9qfKiQtHV`.

## Solution Options

### Option 1: Update AppSync to Accept Both User Pools (If Both Are Valid)

If you have multiple User Pools and both should work:

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find API: `klp7rzjva5c2bef2zjaygpod44`
3. Go to **Settings** → **Authorization**
4. Add **additional authorization provider**:
   - Click **"Add authorization type"**
   - Select **"Amazon Cognito User Pool"**
   - Choose User Pool: `us-east-1_jIICT17l6`
   - Save

**Note:** You can only have ONE default authorization mode, but you can have multiple providers.

### Option 2: Update AppSync to Use the Correct User Pool (Recommended)

If `us-east-1_jIICT17l6` is the correct User Pool:

1. Go to [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find API: `klp7rzjva5c2bef2zjaygpod44`
3. Go to **Settings** → **Authorization**
4. **Edit** the Cognito User Pool configuration
5. Change User Pool ID from `us-east-1_9qfKiQtHV` to `us-east-1_jIICT17l6`
6. Set it as **Default authorization mode**
7. Save

### Option 3: Update amplify_outputs.json to Use Correct User Pool

If `us-east-1_jIICT17l6` is the correct User Pool, update the config:

1. Check which User Pool your user account is actually in
2. Update `amplify_outputs.json`:
   ```json
   {
     "auth": {
       "user_pool_id": "us-east-1_jIICT17l6",  // Update this
       "user_pool_client_id": "7vo2gldcppkq2b6j5jepdm7uan",  // Update this too
       ...
     }
   }
   ```

3. Redeploy the frontend

## How to Find the Correct User Pool

### Check Which User Pool Your User Is In

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Click **"User pools"**
3. Search for User Pool: `us-east-1_jIICT17l6`
4. Click on it
5. Go to **"Users"** tab
6. Search for `support@tazsoftware.biz`
7. If found → This is the correct User Pool

### Check amplify_outputs.json

The token shows:
- **User Pool**: `us-east-1_jIICT17l6`
- **Client ID**: `7vo2gldcppkq2b6j5jepdm7uan`

But `amplify_outputs.json` has:
- **User Pool**: `us-east-1_9qfKiQtHV`
- **Client ID**: `14jfd7uoubk1ipsooe1349c5lk`

These don't match!

## Quick Fix: Update AppSync Authorization

The fastest fix is to update AppSync to accept the User Pool that the token is from:

1. **Go to AppSync Console** → API `klp7rzjva5c2bef2zjaygpod44`
2. **Settings** → **Authorization**
3. **Edit** the Cognito User Pool
4. **Change User Pool ID** to: `us-east-1_jIICT17l6`
5. **Save**

## Verify After Fix

1. **Sign out** and **sign back in** on `onyxdispatch.us`
2. **Check Network tab** again
3. **Look for GraphQL request**
4. **Response should be 200** instead of 401

## Why This Happened

This mismatch can occur when:
1. Multiple User Pools exist in your AWS account
2. User signed in with a different User Pool than expected
3. AppSync was configured with one User Pool, but users are in another
4. `amplify_outputs.json` has outdated User Pool ID

## Next Steps

1. **Determine which User Pool is correct:**
   - Check where `support@tazsoftware.biz` actually exists
   - This is the User Pool that should be used

2. **Update AppSync** to use that User Pool

3. **Update amplify_outputs.json** to match (if needed)

4. **Test authentication** again

The token is valid and being sent correctly - AppSync just needs to be configured to accept tokens from the correct User Pool!
