# Fix API Mismatch - Booking Requests in Wrong API

## Current Situation

✅ **Booking requests exist in:** `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE` (4 items, all with correct `companyId`)

❌ **amplify_outputs.json shows:** API `qft7xoddfrfp7gslj5t5alhjaa` (different API)

❌ **Frontend is calling:** API `ucwy5mmmyrh2rjz6hhkolzwnke` (yet another different API)

## The Problem

The backend is deploying to a **new API** (`qft7xoddfrfp7gslj5t5alhjaa`), but the booking requests were created in an **old API** (`ukoh7tgmwjbjdhnuirxugqx4ci`). This happens when:

1. The backend was redeployed and Amplify created a new AppSync API
2. The old API still exists with the data, but the new backend doesn't use it
3. The frontend is using yet another cached API configuration

## Solution Options

### Option 1: Use the Existing API (Where Data Is) - RECOMMENDED

**If you want to keep the existing booking requests:**

1. **Check which CloudFormation stack created API `ukoh7tgmwjbjdhnuirxugqx4ci`:**
   - Go to **AWS CloudFormation** → **Stacks**
   - Search for stacks containing `ukoh7tgmwjbjdhnuirxugqx4ci`
   - This is likely an older backend deployment

2. **Verify the backend is deploying to the correct app/branch:**
   - Check Amplify Hosting → Your app → **Backend environments**
   - Make sure you're deploying to the same app/branch that created API `ukoh7tgmwjbjdhnuirxugqx4ci`

3. **If the backend is deploying to a different app/branch:**
   - Either switch to the correct app/branch
   - OR migrate the data from the old API to the new one

### Option 2: Migrate Data to New API

**If you want to use the new API (`qft7xoddfrfp7gslj5t5alhjaa`):**

1. **Export data from old table:**
   - Go to DynamoDB → `BookingRequest-ukoh7tgmwjbjdhnuirxugqx4ci-NONE`
   - Export the 4 booking requests

2. **Import to new table:**
   - Go to DynamoDB → `BookingRequest-qft7xoddfrfp7gslj5t5alhjaa-NONE` (if it exists)
   - Import the booking requests

3. **Update frontend to use new API:**
   - The frontend should automatically use the new API after rebuild (if `amplify_outputs.json` is correct)

### Option 3: Check for Multiple Backend Deployments

**You might have multiple backend deployments:**

1. **Check Amplify Console:**
   - Go to **AWS Amplify** → Your app
   - Check **Backend environments** tab
   - See if there are multiple backend environments

2. **Check CloudFormation:**
   - Look for stacks with pattern: `amplify-{app-id}-{branch}-*`
   - Each stack represents a backend deployment

3. **Identify the active backend:**
   - The active backend should match where you want the data to be

## Quick Fix: Verify Current Backend Deployment

1. **Check the most recent backend build:**
   - Go to Amplify Console → Your app → **Build history**
   - Check the most recent successful backend build
   - Look at the build logs for the AppSync API ID it created

2. **Compare with where data exists:**
   - If the build created API `ukoh7tgmwjbjdhnuirxugqx4ci` → ✅ **Correct!** Just need to rebuild frontend
   - If the build created API `qft7xoddfrfp7gslj5t5alhjaa` → ❌ **Wrong!** Backend is deploying to a different API

## Most Likely Solution

Since the booking requests are in `ukoh7tgmwjbjdhnuirxugqx4ci`, and that's where they should be:

1. **Verify the backend is deploying to API `ukoh7tgmwjbjdhnuirxugqx4ci`:**
   - Check CloudFormation stacks
   - Check AppSync APIs - which one has `listBookingRequestsForCompany` query?

2. **If backend is deploying to a different API:**
   - Check if you're deploying to the wrong app/branch
   - OR if there was a backend redeployment that created a new API

3. **Update amplify_outputs.json:**
   - The `amplify_outputs.json` should point to `ukoh7tgmwjbjdhnuirxugqx4ci`
   - If it doesn't, the backend build needs to be fixed

## Next Steps

1. **Check AppSync Console:**
   - Go to **AWS AppSync** → **APIs**
   - Find API `ukoh7tgmwjbjdhnuirxugqx4ci`
   - Check if it has the `listBookingRequestsForCompany` query
   - If YES → ✅ Backend is correct, just rebuild frontend
   - If NO → ❌ Backend needs to deploy to this API

2. **Check the other API:**
   - Find API `qft7xoddfrfp7gslj5t5alhjaa` (from amplify_outputs.json)
   - Does it have `listBookingRequestsForCompany`?
   - This might be the "new" backend deployment

3. **Decide which API to use:**
   - Use `ukoh7tgmwjbjdhnuirxugqx4ci` (where data exists) - RECOMMENDED
   - OR migrate data to `qft7xoddfrfp7gslj5t5alhjaa` (new backend)
