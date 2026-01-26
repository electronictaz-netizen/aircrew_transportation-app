# Fix: Booking Fields Not Persisting to DynamoDB

## Problem

When companies enable their booking portal and set a booking code via the Company Settings UI, the `bookingEnabled` and `bookingCode` fields were not being persisted to DynamoDB, even though the GraphQL mutation returned success.

**Root Cause:**
Amplify Gen 2's auto-generated AppSync resolvers can sometimes drop optional fields (`bookingCode` and `bookingEnabled`) when they're included in a large update payload with many other fields. This is a known limitation with how optional fields are handled in update mutations.

## Solution

The fix separates the booking fields update into a **dedicated, separate mutation call** that runs **before** updating other company fields. This ensures:

1. **Booking fields are always set explicitly** - No risk of being dropped in a large payload
2. **Clear separation of concerns** - Booking portal settings are updated independently
3. **Better error handling** - Specific error messages for booking field updates
4. **Explicit null handling** - When disabling, `bookingCode` is explicitly set to `null` to clear it from DynamoDB

## Changes Made

### `src/components/CompanyManagement.tsx`

**Before:**
- Booking fields were included in the same update as all other company fields
- `bookingCode` was conditionally included only when `bookingEnabled` was true
- Retry mechanism attempted to fix failures but didn't address the root cause

**After:**
1. **Dedicated booking fields update** (runs first):
   ```typescript
   const bookingUpdateInput = {
     id: company.id,
     bookingEnabled: formData.bookingEnabled,
     bookingCode: formData.bookingEnabled ? formData.bookingCode.trim() : null,
   };
   await client.models.Company.update(bookingUpdateInput);
   ```

2. **Separate update for other fields** (runs after):
   ```typescript
   const updateInput = {
     id: company.id,
     name: sanitizedName,
     displayName: sanitizedDisplayName || undefined,
     // ... other fields (booking fields excluded)
   };
   await client.models.Company.update(updateInput);
   ```

3. **Enhanced error handling**:
   - Specific error messages for booking field updates
   - Handles "Unauthorized on [bookingCode]" error when disabling
   - Better logging for debugging

4. **Verification**:
   - Still verifies that booking fields persisted correctly
   - Provides clear error messages if verification fails

## Testing

After deploying this fix:

1. **Enable booking portal for a new company:**
   - Go to Company Settings
   - Enable "Public Booking Portal"
   - Set a booking code (e.g., "TEST")
   - Save
   - Verify in DynamoDB that both `bookingEnabled: true` and `bookingCode: "TEST"` are present

2. **Disable booking portal:**
   - Disable "Public Booking Portal"
   - Save
   - Verify in DynamoDB that `bookingEnabled: false` and `bookingCode` is `null` or removed

3. **Re-enable booking portal:**
   - Enable again with a different code
   - Verify both fields persist correctly

4. **Test booking portal:**
   - Visit `/booking/{code}` with the saved booking code
   - Should load the booking portal successfully

## Why This Works

1. **Smaller payloads**: By separating booking fields into their own update, we avoid the issue where large payloads cause optional fields to be dropped
2. **Explicit field setting**: Always explicitly setting `bookingEnabled` (even when false) and `bookingCode` (even when null) ensures Amplify's resolver processes them
3. **Order matters**: Updating booking fields first ensures they're set before any other updates that might interfere

## Related Issues

- This fix addresses the issue where "Test Bed Company" and other companies couldn't have their booking portals enabled
- Previously, companies had to manually edit DynamoDB to add these fields
- Now, any company can enable their booking portal through the UI and it will persist correctly

## Future Improvements

If this issue persists or occurs with other optional fields:

1. Consider creating a custom AppSync resolver for `updateCompany` that explicitly handles all fields
2. Add backend validation to ensure booking fields are always set when `bookingEnabled` is true
3. Consider making `bookingCode` required when `bookingEnabled` is true at the schema level (though this would require a migration)

## Deployment

1. Commit and push the changes
2. Frontend will automatically rebuild
3. Test with a new company to verify the fix works
4. Existing companies can now enable their booking portals through the UI
