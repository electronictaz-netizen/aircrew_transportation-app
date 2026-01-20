# Autocomplete Setup Guide

The application now includes autocomplete functionality for addresses and airports.

## Address Autocomplete

Address autocomplete works automatically with two options:

### Option 1: Google Places API (Recommended - Better UX)

For the best autocomplete experience, you can configure Google Places API:

1. **Get a Google Places API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API" and "Maps JavaScript API"
   - Create an API key
   - Restrict the API key to your domain for security

2. **Configure the API Key:**
   
   **Option A: Environment Variable (Recommended for production)**
   - Add to your `.env` file:
     ```
     VITE_GOOGLE_PLACES_API_KEY=your_api_key_here
     ```
   
   **Option B: Runtime Configuration**
   - Add to your `index.html` or main app file:
     ```javascript
     window.GOOGLE_PLACES_API_KEY = 'your_api_key_here';
     ```

### Option 2: OpenStreetMap Nominatim (Default - Free, No Setup)

If no Google Places API key is configured, the app automatically falls back to OpenStreetMap Nominatim. This is free and requires no setup, but provides a simpler autocomplete experience.

**Note:** Nominatim has rate limiting (1 request per second) and may be slower than Google Places.

## Airport Autocomplete

Airport autocomplete is built-in and requires no configuration. It includes:
- Major US airports (JFK, LAX, ORD, etc.)
- Regional airports (BUF, ROC, SYR, ALB, etc.)
- Major international airports (LHR, CDG, FRA, etc.)

The autocomplete searches by:
- Airport code (e.g., "JFK")
- Airport name (e.g., "Kennedy")
- City name (e.g., "New York")

## Usage

### In Trip Forms

When creating or editing trips:
- **Pickup Location** and **Dropoff Location** fields now have autocomplete when in "Enter Text" mode
- Start typing an address and suggestions will appear
- Use arrow keys to navigate, Enter to select, or click to select

### In Location Management

When adding or editing locations:
- The **Address** field has autocomplete
- Start typing an address and suggestions will appear
- Select a suggestion to auto-fill the address

## Features

- **Keyboard Navigation:** Use arrow keys to navigate suggestions, Enter to select, Escape to close
- **Debounced Search:** Address searches are debounced (300ms) to reduce API calls
- **Caching:** Suggestions are cached for 5 minutes to improve performance
- **Accessibility:** Full keyboard and screen reader support

## Troubleshooting

### Autocomplete not working?

1. **Check browser console** for any errors
2. **Verify API key** (if using Google Places):
   - Make sure the API key is correctly set
   - Ensure "Places API" is enabled in Google Cloud Console
   - Check API key restrictions match your domain

3. **Check network requests:**
   - Open browser DevTools → Network tab
   - Look for requests to `maps.googleapis.com` (Google Places) or `nominatim.openstreetmap.org` (fallback)

### Rate limiting issues?

If using OpenStreetMap Nominatim and experiencing rate limits:
- The app automatically handles rate limiting (1 request per second)
- Consider setting up Google Places API for better performance

## Cost Considerations

- **Google Places API:** 
  - First $200/month free (covers ~40,000 requests)
  - Then $0.017 per request
  - See [Google Places API Pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)

- **OpenStreetMap Nominatim:** 
  - Free, but has usage policies
  - Rate limited to 1 request per second
  - See [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
