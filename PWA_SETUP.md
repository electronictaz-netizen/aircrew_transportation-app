# Progressive Web App (PWA) Setup Guide

This application is now configured as a Progressive Web App (PWA), allowing users to install it on their mobile devices and desktop browsers.

## Features

✅ **Installable on Mobile Devices**
- Android: Users will see an install prompt
- iOS: Users can add to home screen via Safari share menu
- Desktop: Installable in Chrome, Edge, and other Chromium-based browsers

✅ **Offline Support**
- Service worker caches app resources
- Basic offline functionality

✅ **App-like Experience**
- Standalone display mode (no browser UI)
- Custom theme colors
- App icons and shortcuts

## How It Works

### For Users

**Android/Chrome:**
1. Visit the website on your mobile device
2. A banner will appear at the bottom prompting to install
3. Tap "Install" to add to home screen
4. The app will open in standalone mode

**iOS/Safari:**
1. Visit the website in Safari
2. Tap the share button (⎋)
3. Select "Add to Home Screen"
4. The app will appear on your home screen

**Desktop:**
1. Visit the website in Chrome/Edge
2. Look for the install icon in the address bar
3. Click to install as an app

### For Developers

**Configuration Files:**
- `vite.config.ts` - PWA plugin configuration
- `public/manifest.json` - App manifest
- `src/components/InstallPrompt.tsx` - Install prompt component

**Icons Required:**
You need to create and add these icon files to the `public` folder:
- `icon-192x192.png` - 192x192 pixel icon
- `icon-512x512.png` - 512x512 pixel icon
- `apple-touch-icon.png` - 180x180 pixel icon for iOS

## Creating Icons

### Option 1: Use an Icon Generator
1. Create a 512x512 pixel logo/icon
2. Use an online PWA icon generator:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
3. Download generated icons
4. Place them in the `public` folder

### Option 2: Create Manually
1. Create a square logo (at least 512x512 pixels)
2. Export as PNG:
   - `icon-192x192.png` (192x192)
   - `icon-512x512.png` (512x512)
   - `apple-touch-icon.png` (180x180)
3. Place all files in the `public` folder

### Quick Placeholder Icons
If you need placeholder icons for testing, you can create simple colored squares or use a logo generator.

## Testing PWA Installation

### Local Development
1. Run `npm run build`
2. Run `npm run preview`
3. Open in Chrome/Edge
4. Check for install prompt

### Mobile Testing
1. Build the app: `npm run build`
2. Deploy to a server (or use ngrok for local testing)
3. Visit on mobile device
4. Test install functionality

### Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Use "Lighthouse" to audit PWA features

## Customization

### Update App Name
Edit `vite.config.ts`:
```typescript
manifest: {
  name: 'Your App Name',
  short_name: 'Short Name',
  // ...
}
```

### Update Theme Color
Edit `vite.config.ts`:
```typescript
manifest: {
  theme_color: '#your-color',
  background_color: '#your-background-color',
  // ...
}
```

### Update Icons
1. Replace icon files in `public` folder
2. Ensure filenames match those in `vite.config.ts`

### Customize Install Prompt
Edit `src/components/InstallPrompt.tsx` to customize the install prompt message and styling.

## Service Worker

The PWA plugin automatically generates a service worker that:
- Caches app resources (JS, CSS, HTML)
- Caches API responses (with configurable strategies)
- Provides offline functionality

**Cache Strategy:**
- Static assets: Cache first
- API calls: Network first (configurable in `vite.config.ts`)

## Troubleshooting

### Install Prompt Not Showing
1. **Check HTTPS**: PWA requires HTTPS (or localhost)
2. **Check Manifest**: Verify manifest.json is valid
3. **Check Service Worker**: Ensure service worker is registered
4. **Clear Cache**: Clear browser cache and reload
5. **Check Browser Support**: Not all browsers support PWA install

### Icons Not Showing
1. Verify icon files exist in `public` folder
2. Check file paths in `manifest.json`
3. Clear browser cache
4. Rebuild the app

### Service Worker Not Working
1. Check browser console for errors
2. Verify service worker is registered (Application tab in DevTools)
3. Check network tab for service worker requests
4. Try unregistering and re-registering service worker

### iOS Not Showing Install Option
- iOS requires manual "Add to Home Screen" via Safari
- The install prompt component shows instructions for iOS users
- Make sure you're using Safari (not Chrome on iOS)

## Production Deployment

1. **Build the app**: `npm run build`
2. **Verify build output**: Check `dist` folder contains:
   - `manifest.json`
   - Service worker files
   - Icon files
3. **Deploy to HTTPS server**: PWA requires HTTPS
4. **Test installation**: Verify install works on mobile devices

## Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://web.dev/add-manifest/)
- [Service Workers](https://web.dev/service-workers-cache-storage/)

## Notes

- The install prompt will automatically show on supported browsers
- Users can dismiss the prompt (won't show again for 7 days)
- Once installed, the prompt won't show again
- The app works offline with cached resources
- API calls will fail offline unless cached
