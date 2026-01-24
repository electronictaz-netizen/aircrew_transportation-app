# Admin Access Control Setup

## How to Restrict Admin Dashboard Access

The Admin Dashboard is now protected by an access control system. Only users you explicitly authorize can access it.

## Step 1: Find Your Email or User ID

### Option A: Check Your Email (Easiest)

1. Log into the app
2. Open browser console (F12)
3. Run this command:

```javascript
// Get your email
const user = await import('@aws-amplify/ui-react').then(m => {
  // This will show your email in the console
  console.log('Your email:', window.location);
});
```

Or simply look at the navigation bar - your email is displayed there.

### Option B: Get Your Cognito User ID

1. Log into the app
2. Open browser console (F12)
3. Run this command:

```javascript
// Get your user ID
import('aws-amplify/auth').then(async (auth) => {
  const session = await auth.fetchAuthSession();
  console.log('Your User ID:', session.userSub);
});
```

## Step 2: Configure Access

Open `src/utils/adminAccess.ts` and add your email or user ID:

### Using Email (Recommended)

```typescript
const AUTHORIZED_ADMIN_EMAILS = [
  'your-email@onyxdispatch.us',  // Add your email here
];
```

### Using User ID

```typescript
const AUTHORIZED_ADMIN_USER_IDS = [
  'us-east-1:12345678-1234-1234-1234-123456789012',  // Add your Cognito User ID here
];
```

## Step 3: Deploy

After adding your email/ID:

1. Save the file
2. Push to git
3. Deploy the app

## Multiple Admins

You can add multiple admins:

```typescript
const AUTHORIZED_ADMIN_EMAILS = [
  'admin1@onyxdispatch.us',
  'admin2@onyxdispatch.us',
  'admin3@onyxdispatch.us',
];
```

## Security Notes

- **Email-based access** is case-insensitive
- **User ID-based access** is more secure but harder to manage
- The access check happens on both the Navigation (to show/hide the link) and the AdminDashboard component (to block access)
- If someone tries to access `/admin` directly, they'll see an "Access Denied" message

## Testing

1. Log in with your authorized account - you should see the "Admin" link
2. Log in with a different account - the "Admin" link should not appear
3. Try accessing `/admin` directly with an unauthorized account - you should see "Access Denied"

## Troubleshooting

**I can't see the Admin link:**
- Check that your email/ID is in the `AUTHORIZED_ADMIN_EMAILS` or `AUTHORIZED_ADMIN_USER_IDS` array
- Make sure you've saved the file and deployed
- Check browser console for any errors

**I see "Access Denied":**
- Your email/ID might not match exactly (check for typos)
- Make sure you're using the correct email format (lowercase is handled automatically)
- Try using User ID instead of email if email doesn't work
