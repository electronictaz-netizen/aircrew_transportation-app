# Real-Time GPS Tracking Feature

## Overview

Real-time GPS tracking has been implemented to provide continuous location updates for vehicles during active trips. This feature allows dispatchers to monitor vehicle locations in real-time on an interactive map.

## Features Implemented

### 1. **VehicleLocation Data Model**
- New `VehicleLocation` model in Amplify schema
- Stores GPS coordinates (latitude, longitude)
- Tracks trip, driver, and vehicle associations
- Includes optional fields: accuracy, speed, heading, timestamp
- Relationships to Company, Trip, Driver, and Vehicle models

### 2. **GPS Tracking Service** (`src/utils/gpsTracking.ts`)
- `startGPSTracking()` - Starts continuous GPS tracking for an active trip
- `stopGPSTracking()` - Stops GPS tracking
- `getLatestTripLocation()` - Gets the most recent location for a trip
- `getTripLocationHistory()` - Gets all location points for route playback
- `getActiveVehicleLocations()` - Gets all active vehicle locations for dispatcher map
- Automatic location updates every 30 seconds (configurable)

### 3. **Driver Dashboard Integration**
- Automatically starts GPS tracking when a trip status changes to "InProgress"
- Automatically stops GPS tracking when trip is completed
- Continuous location updates sent to database during active trips
- Handles cleanup on component unmount or trip status changes

### 4. **Real-Time Map Component** (`src/components/VehicleTrackingMap.tsx`)
- Interactive map using Leaflet/OpenStreetMap
- Displays markers for all active vehicles
- Auto-refreshes every 10 seconds to show latest locations
- Shows trip details, driver name, vehicle info, and last update time in popups
- Auto-fits map bounds to show all active vehicles
- Click on markers to view trip details

### 5. **Management Dashboard Integration**
- New "Map" view option in view toggle (alongside List and Calendar)
- Displays real-time vehicle locations for all active trips
- Integrated with existing trip management workflow
- Click on map markers to edit trip details

## How It Works

### For Drivers:
1. Driver starts a trip by clicking "Record Pickup"
2. GPS tracking automatically begins
3. Location updates are sent every 30 seconds
4. Tracking continues until trip is completed
5. When driver clicks "Record Dropoff", tracking stops

### For Dispatchers:
1. Navigate to Management Dashboard
2. Click "🗺️ Map" in the view toggle
3. View all active vehicles on the map in real-time
4. Map auto-refreshes every 10 seconds
5. Click on vehicle markers to see trip details
6. Click trip details to edit the trip

## Technical Details

### Data Model
```typescript
VehicleLocation {
  companyId: string (required)
  tripId: string (required)
  driverId: string (required)
  vehicleId: string (optional)
  latitude: float (required)
  longitude: float (required)
  accuracy: float (optional)
  speed: float (optional) // meters per second
  heading: float (optional) // degrees (0-360)
  timestamp: datetime (required)
}
```

### Update Frequency
- **Driver updates**: Every 30 seconds during active trips
- **Map refresh**: Every 10 seconds for dispatcher view
- **Location accuracy**: Uses high-accuracy GPS when available

### Browser Requirements
- Requires browser geolocation API
- Works best on mobile devices with GPS
- Falls back gracefully if GPS unavailable
- Shows warning messages if location permission denied

## Future Enhancements

1. **Route Playback**: View historical route for completed trips
2. **Geofencing Alerts**: Notify when driver arrives at pickup/dropoff locations
3. **ETA Calculations**: Real-time estimated arrival times based on current location
4. **WebSocket Updates**: Replace polling with WebSocket for instant updates
5. **Background Tracking**: Native mobile app support for background GPS tracking
6. **Speed Alerts**: Notify dispatchers of speeding violations
7. **Route Optimization**: Suggest optimal routes based on traffic

## Dependencies Added

- `leaflet@^1.9.4` - Mapping library
- `react-leaflet@^4.2.1` - React bindings for Leaflet
- `@types/leaflet@^1.9.8` - TypeScript types

## Usage Example

```typescript
// Start tracking
import { startGPSTracking } from '../utils/gpsTracking';

startGPSTracking({
  tripId: 'trip-123',
  driverId: 'driver-456',
  vehicleId: 'vehicle-789',
  companyId: 'company-001',
  updateInterval: 30000, // 30 seconds
  onError: (error) => console.error('GPS error:', error),
  onSuccess: () => console.log('Location updated'),
});

// Stop tracking
import { stopGPSTracking } from '../utils/gpsTracking';
stopGPSTracking();
```

## Notes

- GPS tracking only occurs during active trips (status: "InProgress")
- Location updates are stored in the database for historical tracking
- Map uses OpenStreetMap tiles (free, no API key required)
- Battery usage may be higher on mobile devices during active tracking
- Location accuracy depends on device GPS capabilities
