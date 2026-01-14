# Admin Access Security Debugging Guide

## Issue: Unauthorized User Can Access Admin Dashboard

If an unauthorized user can access the admin dashboard, follow these steps to debug and fix:

## Step 1: Verify Current User Email

Run this in the browser console (while logged in as the unauthorized user):

```javascript
// Get current user info
import('@aws-amplify/ui-react').then(async (auth) => {
  const { useAuthenticator } = auth;
  // This will show in console what email is being checked
  console.log('Current user:', window.location);
});
```

Or check the navigation bar - it shows the user's email/username.

## Step 2: Check Authorized Emails

Verify the authorized emails in `src/utils/adminAccess.ts`:

```typescript
const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'electronictaz@gmail.com',  // Should only be your email
];
```

**Important**: Make sure:
- Email is exactly as it appears when logged in
- No extra spaces or characters
- Case doesn't matter (handled automatically)

## Step 3: Check Browser Console Logs

When accessing `/admin`, check the browser console for:

```
[AdminAccess] Checking access for: { email: '...', userId: '...', ... }
[AdminAccess] Email match found - granting access
```

OR

```
[AdminAccess] Access denied - no match found
```

## Step 4: Common Issues

### Issue: Email Mismatch

**Problem**: The email in the system doesn't match the authorized email.

**Solution**: 
1. Check what email the user is logged in with (see navigation bar)
2. Update `AUTHORIZED_ADMIN_EMAILS` to match exactly
3. Or add the user's email if they should have access

### Issue: Email in Different Field

**Problem**: The email might be stored in a different field.

**Solution**: The code now checks multiple fields:
- `user.signInDetails?.loginId`
- `user.username`
- `user.attributes?.email`
- `user.email`

### Issue: Cached Access

**Problem**: Browser might have cached the access check.

**Solution**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Sign out and sign back in

## Step 5: Immediate Fix

To immediately block unauthorized access:

1. **Remove all emails except yours** from `AUTHORIZED_ADMIN_EMAILS`
2. **Add your Cognito User ID** to `AUTHORIZED_ADMIN_USER_IDS` (more secure)

To find your User ID, run in console:

```javascript
import('aws-amplify/auth').then(async (auth) => {
  const session = await auth.fetchAuthSession();
  console.log('Your User ID:', session.userSub);
});
```

Then add it to:

```typescript
const AUTHORIZED_ADMIN_USER_IDS: string[] = [
  'your-user-id-here',  // More secure than email
];
```

## Step 6: Verify Fix

1. Log in with unauthorized user
2. Try to access `/admin` directly
3. Should see "Access Denied" message
4. Check console for `[AdminAccess] Access denied` log

## Security Layers

The system now has **three layers of protection**:

1. **Route Protection** (`ProtectedAdminRoute`): Blocks at route level
2. **Component Protection** (`AdminDashboard`): Double-checks before rendering
3. **Data Protection**: Prevents loading data if access denied

## Emergency: Block All Access

If you need to immediately block ALL access:

```typescript
const AUTHORIZED_ADMIN_EMAILS: string[] = [];  // Empty array
const AUTHORIZED_ADMIN_USER_IDS: string[] = [];  // Empty array
```

Then only add your email/ID back.

## Reporting Security Issues

If unauthorized access persists:

1. Check browser console logs
2. Note the email/user ID of unauthorized user
3. Verify authorized list is correct
4. Check for any code changes that might bypass security
5. Contact support with details
