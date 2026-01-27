# PWA Mobile Enhancements - Detailed Setup Instructions

This document provides step-by-step setup instructions for all PWA mobile enhancements implemented in the Onyx Transportation App.

## Table of Contents

1. [Overview](#overview)
2. [Offline Storage Setup](#offline-storage-setup)
3. [Push Notifications Setup](#push-notifications-setup)
4. [Camera Integration Setup](#camera-integration-setup)
5. [Voice Notes Setup](#voice-notes-setup)
6. [Service Worker Configuration](#service-worker-configuration)
7. [Testing Instructions](#testing-instructions)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The PWA enhancements include:
- ✅ **Offline Storage** - Automatic, no setup required
- ⚙️ **Push Notifications** - Requires VAPID key configuration
- ✅ **Camera Integration** - Automatic, requires user permission
- ✅ **Voice Notes** - Automatic, requires user permission
- ✅ **Enhanced Service Worker** - Already configured

---

## Offline Storage Setup

### Status: ✅ Automatic - No Setup Required

Offline storage is automatically initialized when the app loads. No configuration is needed.

### How It Works

1. **Automatic Initialization**
   - IndexedDB is created automatically on first app load
   - Database name: `onyx-transportation-db`
   - Version: 1

2. **Automatic Caching**
   - Trips are cached when loaded online
   - Drivers, vehicles, and customers are cached automatically
   - Data persists across browser sessions

3. **Offline Queue**
   - Actions performed offline are queued
   - Automatically synced when connection is restored

### Verification

To verify offline storage is working:

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Check **IndexedDB** section
4. You should see `onyx-transportation-db` database
5. Check object stores: `trips`, `drivers`, `vehicles`, `customers`, `offlineQueue`

### Manual Testing

1. Load the app and navigate to Management Dashboard
2. Open DevTools → Network tab
3. Set network to "Offline"
4. Refresh the page
5. Trips should still load from cache
6. Set network back to "Online"
7. Changes should sync automatically

---

## Push Notifications Setup

### Status: ⚙️ Requires Configuration

Push notifications require VAPID (Voluntary Application Server Identification) keys for secure subscription management.

### Step 1: Generate VAPID Keys

#### Option A: Using web-push (Recommended)

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

**Output Example:**
```
Public Key:
BK8x...your-public-key-here

Private Key:
xYz...your-private-key-here
```

#### Option B: Using Online Tool

1. Visit: https://web-push-codelab.glitch.me/
2. Click "Generate VAPID Keys"
3. Copy the public and private keys

### Step 2: Configure Environment Variables

#### For Local Development

Create or update `.env` file in project root:

```env
VITE_VAPID_PUBLIC_KEY=BK8x...your-public-key-here
```

**Important:** Only the **public key** is needed in the frontend. The private key should be kept secret and used only on your backend server.

#### For Production (AWS Amplify)

1. Go to AWS Amplify Console
2. Navigate to your app
3. Go to **Environment variables**
4. Click **Manage variables**
5. Add new variable:
   - **Key:** `VITE_VAPID_PUBLIC_KEY`
   - **Value:** Your VAPID public key (from Step 1)
6. Save and redeploy

### Step 3: Backend Push Notification Service

You'll need a backend service to send push notifications. Options:

#### Option A: AWS SNS (Simple Notification Service)

1. **Create SNS Topic**
   ```bash
   aws sns create-topic --name onyx-push-notifications
   ```

2. **Create Lambda Function** (if not already exists)
   - Function to send push notifications via SNS
   - Use VAPID private key for signing

3. **Example Lambda Code:**
   ```javascript
   const webpush = require('web-push');
   
   webpush.setVapidDetails(
     'mailto:your-email@example.com',
     process.env.VAPID_PUBLIC_KEY,
     process.env.VAPID_PRIVATE_KEY
   );
   
   exports.handler = async (event) => {
     const { subscription, payload } = JSON.parse(event.body);
     
     try {
       await webpush.sendNotification(subscription, JSON.stringify(payload));
       return { statusCode: 200, body: 'Notification sent' };
     } catch (error) {
       return { statusCode: 500, body: error.message };
     }
   };
   ```

#### Option B: Firebase Cloud Messaging (FCM)

1. Create Firebase project
2. Enable Cloud Messaging
3. Get server key
4. Configure backend to use FCM

#### Option C: Custom Backend Service

Create your own backend endpoint that:
- Accepts push subscription objects
- Stores subscriptions in database
- Sends notifications using VAPID private key

### Step 4: Store User Subscriptions

When a user subscribes to push notifications, you need to store their subscription on your backend:

1. **Frontend sends subscription to backend:**
   ```typescript
   const subscription = await subscribeToPushNotifications(registration);
   
   // Send to your backend
   await fetch('/api/push/subscribe', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: currentUser.id,
       subscription: subscription.toJSON()
     })
   });
   ```

2. **Backend stores subscription:**
   - Store in database (DynamoDB, PostgreSQL, etc.)
   - Associate with user ID
   - Use for sending notifications later

### Step 5: Send Push Notifications

When you want to send a notification (e.g., new trip assignment):

```typescript
// Backend code example
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:support@onyxdispatch.us',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get user's subscription from database
const subscription = await getUserSubscription(userId);

// Send notification
await webpush.sendNotification(subscription, JSON.stringify({
  title: 'New Trip Assignment',
  body: 'You have been assigned to a new trip',
  icon: '/icon-192x192.png',
  data: {
    url: '/driver',
    tripId: 'trip-123'
  }
}));
```

### Step 6: User Setup (In App)

1. User clicks "Notifications" button in navigation
2. Browser prompts for notification permission
3. User grants permission
4. App subscribes to push notifications
5. Subscription is sent to backend (implement Step 4)

### Verification

1. Open app in browser
2. Click "Notifications" in navigation
3. Grant permission
4. Check browser DevTools → Application → Service Workers
5. Verify service worker is registered
6. Check DevTools → Application → Storage → IndexedDB
7. Look for push subscription data

### Testing Push Notifications

1. **Test Local Notification:**
   ```javascript
   // In browser console
   new Notification('Test Notification', {
     body: 'This is a test',
     icon: '/icon-192x192.png'
   });
   ```

2. **Test Push Notification:**
   - Use a tool like https://web-push-codelab.glitch.me/
   - Enter your VAPID keys
   - Enter subscription JSON
   - Send test notification

---

## Camera Integration Setup

### Status: ✅ Automatic - Requires User Permission

Camera integration works automatically but requires user permission on first use.

### How It Works

1. **Automatic Detection**
   - App checks if camera is available
   - Uses browser MediaDevices API
   - Works on mobile and desktop

2. **Permission Request**
   - Browser prompts user on first camera use
   - Permission is remembered for the site
   - Can be revoked in browser settings

### Setup Steps

#### Step 1: Verify HTTPS

Camera API requires HTTPS (or localhost for development).

- ✅ Production: Ensure site uses HTTPS
- ✅ Development: localhost works automatically

#### Step 2: Test Camera Access

1. Navigate to a trip in Management Dashboard
2. Click "Trip Notes"
3. Click "📷 Add Photo" button
4. Browser will prompt for camera permission
5. Grant permission
6. Camera should open

### Browser Permissions

#### Chrome/Edge
1. Click lock icon in address bar
2. Go to Site settings
3. Camera: Allow

#### Firefox
1. Click lock icon in address bar
2. Permissions → Camera: Allow

#### Safari
1. Safari → Settings → Websites → Camera
2. Find your site
3. Set to "Allow"

### Mobile Permissions

#### Android (Chrome)
1. Settings → Apps → [Your App]
2. Permissions → Camera → Allow

#### iOS (Safari)
1. Settings → Safari → Camera
2. Allow access

### Verification

1. Open trip notes
2. Click "Add Photo"
3. Camera should open
4. Capture photo
5. Photo should appear in note preview
6. Save note
7. Photo should be attached

### Troubleshooting

**Camera not opening:**
- Check browser permissions
- Verify HTTPS (required)
- Check if camera is in use by another app
- Try different browser

**Permission denied:**
- Clear site data
- Re-request permission
- Check browser settings

---

## Voice Notes Setup

### Status: ✅ Automatic - Requires User Permission

Voice notes work automatically but require microphone permission on first use.

### How It Works

1. **Automatic Detection**
   - App checks if microphone is available
   - Uses browser MediaRecorder API
   - Supports WebM and MP4 formats

2. **Permission Request**
   - Browser prompts user on first recording
   - Permission is remembered for the site
   - Can be revoked in browser settings

### Setup Steps

#### Step 1: Verify HTTPS

Microphone API requires HTTPS (or localhost for development).

- ✅ Production: Ensure site uses HTTPS
- ✅ Development: localhost works automatically

#### Step 2: Test Voice Recording

1. Navigate to a trip in Management Dashboard
2. Click "Trip Notes"
3. Click "🎤 Add Voice Note" button
4. Browser will prompt for microphone permission
5. Grant permission
6. Click "Start Recording"
7. Speak your note
8. Click "Stop Recording"
9. Voice note should appear in note preview

### Browser Permissions

#### Chrome/Edge
1. Click lock icon in address bar
2. Go to Site settings
3. Microphone: Allow

#### Firefox
1. Click lock icon in address bar
2. Permissions → Microphone: Allow

#### Safari
1. Safari → Settings → Websites → Microphone
2. Find your site
3. Set to "Allow"

### Mobile Permissions

#### Android (Chrome)
1. Settings → Apps → [Your App]
2. Permissions → Microphone → Allow

#### iOS (Safari)
1. Settings → Safari → Microphone
2. Allow access

### Audio Format Support

- **Chrome/Edge:** WebM (default)
- **Firefox:** WebM (default)
- **Safari:** MP4/M4A (default)
- **Mobile:** Varies by browser

The app automatically detects and uses the best format for each browser.

### Verification

1. Open trip notes
2. Click "Add Voice Note"
3. Grant microphone permission
4. Record a voice note
5. Verify duration is displayed
6. Save note
7. Voice note should be attached
8. Playback should work

### Troubleshooting

**Microphone not working:**
- Check browser permissions
- Verify HTTPS (required)
- Check if microphone is in use by another app
- Try different browser
- Check system microphone settings

**No audio playback:**
- Check browser audio format support
- Verify audio file was created
- Check browser console for errors

---

## Service Worker Configuration

### Status: ✅ Already Configured

Service worker is automatically configured in `vite.config.ts`. No additional setup is required.

### Current Configuration

- **Strategy:** GenerateSW (automatic service worker generation)
- **Caching:** Runtime caching for API calls and static assets
- **Offline Support:** Automatic fallback to cache

### Cache Strategies

1. **Static Assets (CacheFirst)**
   - AWS S3 assets (JS, CSS, fonts, images)
   - Cache for 30 days
   - Fast loading

2. **AviationStack API (NetworkFirst)**
   - Flight status API calls
   - Cache for 1 hour
   - Network timeout: 10 seconds

3. **GraphQL API (NetworkFirst)**
   - Amplify GraphQL endpoints
   - Cache for 24 hours
   - Network timeout: 10 seconds
   - Falls back to cache when offline

4. **AWS Assets (StaleWhileRevalidate)**
   - Other AWS resources
   - Cache for 24 hours
   - Updates in background

### Verification

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Check **Service Workers** section
4. Verify service worker is registered and active
5. Check **Cache Storage** section
6. Verify caches are created:
   - `static-assets-cache`
   - `aviationstack-api-cache`
   - `amplify-graphql-cache`
   - `aws-amplify-cache`

### Customization

To modify caching behavior, edit `vite.config.ts`:

```typescript
workbox: {
  runtimeCaching: [
    // Add or modify cache strategies here
  ]
}
```

---

## Testing Instructions

### Complete Test Checklist

#### 1. Offline Storage Test
- [ ] Load app online
- [ ] Navigate to Management Dashboard
- [ ] Set network to offline
- [ ] Verify trips still load
- [ ] Create a trip (should queue)
- [ ] Set network to online
- [ ] Verify trip syncs

#### 2. Push Notifications Test
- [ ] Click "Notifications" in navigation
- [ ] Grant permission
- [ ] Verify subscription success
- [ ] Send test notification from backend
- [ ] Verify notification appears
- [ ] Click notification
- [ ] Verify app opens

#### 3. Camera Test
- [ ] Open trip notes
- [ ] Click "Add Photo"
- [ ] Grant camera permission
- [ ] Capture photo
- [ ] Verify preview
- [ ] Save note
- [ ] Verify photo in note

#### 4. Voice Notes Test
- [ ] Open trip notes
- [ ] Click "Add Voice Note"
- [ ] Grant microphone permission
- [ ] Record voice note
- [ ] Verify duration
- [ ] Save note
- [ ] Verify playback works

#### 5. Service Worker Test
- [ ] Open DevTools → Application
- [ ] Verify service worker registered
- [ ] Check cache storage
- [ ] Verify caches created
- [ ] Test offline functionality

### Mobile Testing

#### Android (Chrome)
1. Build app: `npm run build`
2. Deploy to server
3. Open on Android device
4. Test all features
5. Check permissions in Settings

#### iOS (Safari)
1. Build app: `npm run build`
2. Deploy to server
3. Open in Safari on iOS
4. Test all features
5. Note: Push notifications have limited support

---

## Troubleshooting

### Offline Storage Issues

**Problem:** Data not caching
- **Solution:** Check IndexedDB in DevTools
- **Solution:** Verify service worker is active
- **Solution:** Clear browser cache and retry

**Problem:** Offline queue not syncing
- **Solution:** Check network connection
- **Solution:** Verify service worker is active
- **Solution:** Check browser console for errors

### Push Notification Issues

**Problem:** Permission prompt not showing
- **Solution:** Check if already granted/denied
- **Solution:** Clear site data and retry
- **Solution:** Verify HTTPS is enabled

**Problem:** Notifications not received
- **Solution:** Verify VAPID keys are set
- **Solution:** Check subscription is stored on backend
- **Solution:** Verify backend is sending notifications
- **Solution:** Check browser console for errors

**Problem:** "Notifications not supported"
- **Solution:** Verify HTTPS (required)
- **Solution:** Check browser support (Chrome/Edge/Firefox)
- **Solution:** Verify service worker is registered

### Camera Issues

**Problem:** Camera not opening
- **Solution:** Check browser permissions
- **Solution:** Verify HTTPS (required)
- **Solution:** Check if camera is in use
- **Solution:** Try different browser

**Problem:** Permission denied
- **Solution:** Clear site data
- **Solution:** Re-request permission
- **Solution:** Check browser settings

**Problem:** Photo not saving
- **Solution:** Check browser console for errors
- **Solution:** Verify trip note is saved
- **Solution:** Check network connection

### Voice Notes Issues

**Problem:** Microphone not working
- **Solution:** Check browser permissions
- **Solution:** Verify HTTPS (required)
- **Solution:** Check if microphone is in use
- **Solution:** Try different browser

**Problem:** No audio playback
- **Solution:** Check browser audio format support
- **Solution:** Verify audio file was created
- **Solution:** Check browser console for errors

**Problem:** Recording stops early
- **Solution:** Check max duration setting (default: 60 seconds)
- **Solution:** Verify microphone permission
- **Solution:** Check browser console for errors

### Service Worker Issues

**Problem:** Service worker not registering
- **Solution:** Check browser console for errors
- **Solution:** Verify HTTPS (required)
- **Solution:** Clear old service workers
- **Solution:** Hard refresh (Ctrl+Shift+R)

**Problem:** Cache not working
- **Solution:** Check cache storage in DevTools
- **Solution:** Verify service worker is active
- **Solution:** Check network tab for cache hits

**Problem:** Build fails with workbox error
- **Solution:** Verify `vite.config.ts` syntax
- **Solution:** Check workbox version compatibility
- **Solution:** Review runtime caching configuration

---

## Production Deployment Checklist

Before deploying to production:

- [ ] VAPID keys generated and configured
- [ ] Environment variables set in Amplify
- [ ] HTTPS enabled (required for all features)
- [ ] Service worker tested
- [ ] Offline functionality tested
- [ ] Push notifications tested (if enabled)
- [ ] Camera permissions tested
- [ ] Voice notes tested
- [ ] Mobile devices tested
- [ ] Browser compatibility verified

---

## Support

For issues or questions:

1. Check browser console for errors
2. Review this documentation
3. Check DevTools → Application tab
4. Verify all permissions are granted
5. Test in different browsers
6. Contact support if needed

---

## Additional Resources

- [PWA Mobile Enhancements Documentation](./PWA_MOBILE_ENHANCEMENTS.md)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

*Last Updated: January 27, 2026*
