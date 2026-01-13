# PWA Icons Required

This folder needs the following icon files for the PWA to work properly:

## Required Icons

1. **icon-192x192.png** - 192x192 pixels
   - Used for Android home screen and app shortcuts
   - Should be square with rounded corners (will be automatically masked)

2. **icon-512x512.png** - 512x512 pixels
   - Used for Android home screen and splash screens
   - Should be square with rounded corners (will be automatically masked)

3. **apple-touch-icon.png** - 180x180 pixels
   - Used for iOS home screen
   - Should be square (iOS will add rounded corners automatically)

## Creating Icons

### Quick Option: Use Online Generator
1. Create or find a 512x512 pixel logo/icon
2. Visit: https://www.pwabuilder.com/imageGenerator
3. Upload your icon
4. Download the generated icons
5. Place them in this `public` folder

### Manual Option
1. Create a square logo/icon (at least 512x512 pixels)
2. Export as PNG with these sizes:
   - 192x192 → `icon-192x192.png`
   - 512x512 → `icon-512x512.png`
   - 180x180 → `apple-touch-icon.png`
3. Place all files in this `public` folder

## Temporary Placeholder

If you need to test the PWA before creating proper icons, you can:
1. Create simple colored squares as placeholders
2. Or use any square image and resize it

The app will work without icons, but they won't display properly on home screens.

## Icon Design Tips

- Use a simple, recognizable design
- Ensure it looks good at small sizes (192x192)
- Use high contrast colors
- Avoid text (it won't be readable at small sizes)
- Consider your app's theme color (#3b82f6 - blue)
