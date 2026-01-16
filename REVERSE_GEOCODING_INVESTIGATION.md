# Reverse Geocoding Investigation

## Current State

GPS coordinates are currently displayed in two places:
1. **Driver Dashboard** (`DriverDashboard.tsx`): Shows pickup and dropoff GPS coordinates as formatted lat/lng (e.g., "42.940000, -78.730000")
2. **Trip List** (`TripList.tsx`): Shows GPS coordinates in the management dashboard table

Coordinates are displayed as: `📍 42.940000, -78.730000` with a link to Google Maps.

## Reverse Geocoding Options

### Option 1: OpenStreetMap Nominatim (FREE, No API Key Required) ⭐ Recommended for Free Option

**Pros:**
- Completely free
- No API key required
- Good coverage worldwide
- Open source

**Cons:**
- Rate limit: 1 request per second (can be increased with proper attribution)
- Requires proper user agent identification
- May be slower than paid services
- Usage policy requires attribution

**Implementation:**
```typescript
// Example API call
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
  {
    headers: {
      'User-Agent': 'YourAppName/1.0' // Required by Nominatim
    }
  }
);
const data = await response.json();
const address = data.display_name; // e.g., "123 Main St, Buffalo, NY 14201, USA"
```

**Rate Limits:**
- 1 request per second (default)
- Can request higher limits with proper attribution
- Must include User-Agent header

### Option 2: Google Maps Geocoding API (PAID, Requires API Key)

**Pros:**
- Very accurate
- Fast response times
- Excellent coverage
- Well-documented

**Cons:**
- Requires API key
- Costs money ($5 per 1,000 requests after free tier)
- Free tier: $200 credit/month (roughly 40,000 requests)

**Implementation:**
```typescript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
);
const data = await response.json();
const address = data.results[0].formatted_address;
```

### Option 3: Mapbox Geocoding API (PAID, Requires API Key)

**Pros:**
- Good accuracy
- Fast
- Good documentation

**Cons:**
- Requires API key
- Costs money ($0.75 per 1,000 requests after free tier)
- Free tier: 100,000 requests/month

### Option 4: Browser-Based (Limited Support)

**Note:** Browsers don't have built-in reverse geocoding APIs. You must use external services.

## Recommended Implementation Strategy

### Phase 1: Free Option (OpenStreetMap Nominatim)
- Implement with OpenStreetMap Nominatim
- Add proper attribution
- Cache results to reduce API calls
- Handle rate limiting gracefully

### Phase 2: Optional Upgrade (If Needed)
- Add support for Google Maps or Mapbox
- Allow configuration via environment variables
- Fallback to OpenStreetMap if API key not provided

## Implementation Considerations

1. **Caching**: Cache reverse geocoded addresses to avoid repeated API calls for the same coordinates
2. **Error Handling**: Handle API failures gracefully (show coordinates if address lookup fails)
3. **Loading States**: Show loading indicator while fetching address
4. **Rate Limiting**: Implement proper rate limiting for free services
5. **User Experience**: Show coordinates immediately, then update with address when available

## Example User Experience

**Before:**
```
📍 Pickup GPS: 42.940000, -78.730000 [View on Map ↗]
```

**After:**
```
📍 Pickup GPS: 42.940000, -78.730000
   Address: 123 Main Street, Buffalo, NY 14201, USA [View on Map ↗]
```

Or with loading:
```
📍 Pickup GPS: 42.940000, -78.730000
   Address: Loading address... [View on Map ↗]
```

## Code Structure

Create a new utility file: `src/utils/reverseGeocoding.ts`

Functions needed:
- `reverseGeocode(lat, lng)` - Main function to get address from coordinates
- `getAddressFromCoordinates(lat, lng)` - Wrapper with caching
- `formatAddress(addressData)` - Format address for display

## Next Steps

1. ✅ Investigate options (this document)
2. ⏳ Implement reverse geocoding utility
3. ⏳ Add caching mechanism
4. ⏳ Update DriverDashboard to show addresses
5. ⏳ Update TripList to show addresses
6. ⏳ Add loading states
7. ⏳ Test with real GPS coordinates
