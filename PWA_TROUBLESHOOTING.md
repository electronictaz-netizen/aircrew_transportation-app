# PWA Installation Troubleshooting Guide

If you don't see the install prompt, follow these steps:

## Prerequisites for PWA Installation

1. **HTTPS Required** (or localhost)
   - PWAs require HTTPS in production
   - localhost works for development
   - If testing on a network, use HTTPS

2. **Service Worker Must Be Registered**
   - The service worker is automatically registered by vite-plugin-pwa
   - Check browser console for service worker registration
   - Open DevTools → Application → Service Workers

3. **Valid Manifest**
   - Manifest.json must be valid
   - Icons must exist (or use placeholders)
   - Check DevTools → Application → Manifest

4. **Browser Support**
   - Chrome/Edge: Full support
   - Safari (iOS): Manual "Add to Home Screen" only
   - Firefox: Limited support

## Quick Fixes

### 1. Build and Serve the App

The install prompt typically only works in production builds:

```bash
npm run build
npm run preview
```

Then open `http://localhost:4173` (or the port shown)

### 2. Check Browser Console

Open browser DevTools (F12) and check:
- Any errors in Console tab
- Service Worker status in Application tab
- Manifest validation in Application tab

### 3. Create Placeholder Icons

The PWA requires icons. Create simple placeholder icons:

**Option A: Use Online Tool**
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload any square image
3. Download generated icons
4. Place in `public/` folder:
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `apple-touch-icon.png` (180x180)

**Option B: Create Simple Placeholders**
Create colored square PNG files with these sizes:
- 192x192 pixels → `public/icon-192x192.png`
- 512x512 pixels → `public/icon-512x512.png`
- 180x180 pixels → `public/apple-touch-icon.png`

### 4. Clear Browser Cache

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check "Service Workers" and "Cache storage"
5. Click "Clear site data"
6. Reload the page

### 5. Check Install Criteria

The browser checks these criteria before showing install prompt:
- ✅ HTTPS (or localhost)
- ✅ Valid manifest.json
- ✅ Service worker registered
- ✅ Icons present
- ✅ User has interacted with site
- ✅ Site meets engagement heuristics

## Testing Steps

### Step 1: Build the App
```bash
npm run build
```

### Step 2: Preview the Build
```bash
npm run preview
```

### Step 3: Open in Browser
- Open Chrome or Edge
- Go to the preview URL (usually http://localhost:4173)
- Open DevTools (F12)

### Step 4: Check Service Worker
1. Go to Application tab
2. Click "Service Workers" in left sidebar
3. Should see a service worker registered
4. Status should be "activated and is running"

### Step 5: Check Manifest
1. Still in Application tab
2. Click "Manifest" in left sidebar
3. Should see manifest details
4. Check for any errors (red text)

### Step 6: Trigger Install Prompt
1. Wait a few seconds after page load
2. Look for install banner at bottom of page
3. Or check address bar for install icon (desktop)
4. Or check browser menu for "Install" option

## Mobile Testing

### Android/Chrome
1. Deploy app to HTTPS server
2. Open on Android device in Chrome
3. Should see install banner
4. Or go to Chrome menu → "Install app"

### iOS/Safari
1. Open in Safari (not Chrome)
2. Tap share button (⎋)
3. Scroll down to "Add to Home Screen"
4. Tap to install

## Debugging

### Check Console Logs
The InstallPrompt component logs to console:
- `[PWA] Install prompt component initialized`
- `[PWA] beforeinstallprompt event fired`
- `[PWA] Service Worker is supported`

### Manual Install Test
In Chrome DevTools Console, run:
```javascript
// Check if installable
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
});

// Check manifest
fetch('/manifest.json').then(r => r.json()).then(console.log);
```

### Force Install Prompt (Development)
In Chrome, you can manually trigger install:
1. Open DevTools
2. Go to Application tab
3. Click "Manifest"
4. Look for "Add to homescreen" button (if available)

## Common Issues

### Issue: "No install prompt appears"
**Solutions:**
- Build the app (not just dev mode)
- Ensure HTTPS or localhost
- Check service worker is registered
- Verify icons exist
- Clear browser cache
- Wait a few seconds (prompt may be delayed)

### Issue: "Service worker not registering"
**Solutions:**
- Check for console errors
- Ensure vite-plugin-pwa is installed
- Rebuild the app
- Check vite.config.ts PWA configuration

### Issue: "Icons not found"
**Solutions:**
- Create placeholder icons
- Verify icon files are in `public/` folder
- Check icon paths in manifest.json
- Rebuild after adding icons

### Issue: "Works on desktop but not mobile"
**Solutions:**
- Ensure HTTPS (not HTTP)
- Test on actual device (not just emulator)
- Check mobile browser supports PWA
- Clear mobile browser cache

## Still Not Working?

1. **Check Browser Compatibility**
   - Chrome/Edge: Full support
   - Safari: iOS only, manual install
   - Firefox: Limited support

2. **Verify Configuration**
   - Check `vite.config.ts` has VitePWA plugin
   - Verify `manifest.json` exists in `public/`
   - Ensure icons are in `public/` folder

3. **Test in Different Environment**
   - Try localhost
   - Try HTTPS server
   - Try different browser
   - Try different device

4. **Check Network Tab**
   - Verify manifest.json loads (200 status)
   - Verify service worker loads
   - Check for 404 errors on icons

## Need Help?

Check the browser console for specific error messages. Common errors:
- "Failed to register service worker" → Check service worker file
- "Manifest not found" → Check manifest.json path
- "Icon not found" → Add icon files
- "HTTPS required" → Use HTTPS or localhost
