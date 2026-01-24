import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { getActiveVehicleLocations } from '../utils/gpsTracking';
import { logger } from '../utils/logger';
import 'leaflet/dist/leaflet.css';
import './VehicleTrackingMap.css';

const client = generateClient<Schema>();

// Fix for default marker icons in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface VehicleLocationWithTrip {
  id: string;
  companyId: string;
  tripId: string;
  driverId: string;
  vehicleId?: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string | null;
  trip?: Schema['Trip']['type'];
  driver?: Schema['Driver']['type'];
  vehicle?: Schema['Vehicle']['type'];
}

interface VehicleTrackingMapProps {
  activeTripIds?: string[];
  onTripSelect?: (tripId: string) => void;
  height?: string;
}

// Component to auto-fit map bounds to show all markers
function MapBounds({ locations }: { locations: VehicleLocationWithTrip[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const bounds = locations
      .filter((loc) => loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined)
      .map((loc) => [loc.latitude as number, loc.longitude as number] as LatLngTuple);

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

export default function VehicleTrackingMap({ activeTripIds, onTripSelect, height = '600px' }: VehicleTrackingMapProps) {
  const { companyId } = useCompany();
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocationWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<Record<string, Schema['Trip']['type']>>({});
  const [drivers, setDrivers] = useState<Record<string, Schema['Driver']['type']>>({});
  const [vehicles, setVehicles] = useState<Record<string, Schema['Vehicle']['type']>>({});
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load trips, drivers, and vehicles data
  useEffect(() => {
    if (!companyId) return;

    const loadData = async () => {
      try {
        // Load trips
        const { data: tripsData } = await client.models.Trip.list({
          filter: {
            companyId: { eq: companyId },
            status: { eq: 'InProgress' },
          },
        });

        if (tripsData) {
          const tripsMap: Record<string, Schema['Trip']['type']> = {};
          tripsData.forEach((trip) => {
            tripsMap[trip.id] = trip;
          });
          setTrips(tripsMap);
        }

        // Load drivers
        const { data: driversData } = await client.models.Driver.list({
          filter: {
            companyId: { eq: companyId },
            isActive: { eq: true },
          },
        });

        if (driversData) {
          const driversMap: Record<string, Schema['Driver']['type']> = {};
          driversData.forEach((driver) => {
            driversMap[driver.id] = driver;
          });
          setDrivers(driversMap);
        }

        // Load vehicles
        const { data: vehiclesData } = await client.models.Vehicle.list({
          filter: {
            companyId: { eq: companyId },
            isActive: { eq: true },
          },
        });

        if (vehiclesData) {
          const vehiclesMap: Record<string, Schema['Vehicle']['type']> = {};
          vehiclesData.forEach((vehicle) => {
            vehiclesMap[vehicle.id] = vehicle;
          });
          setVehicles(vehiclesMap);
        }
      } catch (err) {
        logger.error('Error loading map data:', err);
      }
    };

    loadData();
  }, [companyId]);

  // Load and refresh vehicle locations
  const loadVehicleLocations = async () => {
    if (!companyId) return;

    try {
      setError(null);
      const locations = await getActiveVehicleLocations(companyId, activeTripIds);

      // Enrich locations with trip, driver, and vehicle data
      const enrichedLocations: VehicleLocationWithTrip[] = locations.map((loc) => ({
        ...loc,
        trip: trips[loc.tripId],
        driver: drivers[loc.driverId],
        vehicle: loc.vehicleId ? vehicles[loc.vehicleId] : undefined,
      }));

      setVehicleLocations(enrichedLocations);
      setLoading(false);
    } catch (err) {
      logger.error('Error loading vehicle locations:', err);
      setError('Failed to load vehicle locations');
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (companyId) {
      loadVehicleLocations();
    }
  }, [companyId, activeTripIds, trips, drivers, vehicles]);

  // Set up auto-refresh every 10 seconds
  useEffect(() => {
    if (!companyId) return;

    refreshIntervalRef.current = setInterval(() => {
      loadVehicleLocations();
    }, 10000); // Refresh every 10 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [companyId, activeTripIds, trips, drivers, vehicles]);

  const handleMarkerClick = (tripId: string) => {
    setSelectedTripId(tripId);
    if (onTripSelect) {
      onTripSelect(tripId);
    }
  };

  // Default center (can be customized based on company location)
  const defaultCenter: LatLngTuple = [39.8283, -98.5795]; // Center of USA

  // Calculate center from locations if available
  let mapCenter = defaultCenter;
  if (vehicleLocations.length > 0) {
    const validLocations = vehicleLocations.filter((loc) => loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined);
    if (validLocations.length > 0) {
      const avgLat = validLocations.reduce((sum, loc) => sum + (loc.latitude as number), 0) / validLocations.length;
      const avgLng = validLocations.reduce((sum, loc) => sum + (loc.longitude as number), 0) / validLocations.length;
      mapCenter = [avgLat, avgLng];
    }
  }

  if (loading && vehicleLocations.length === 0) {
    return (
      <div className="vehicle-tracking-map-container" style={{ height }}>
        <div className="map-loading">Loading vehicle locations...</div>
      </div>
    );
  }

  if (error && vehicleLocations.length === 0) {
    return (
      <div className="vehicle-tracking-map-container" style={{ height }}>
        <div className="map-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="vehicle-tracking-map-container" style={{ height }}>
      <div className="map-header">
        <h3>Real-Time Vehicle Tracking</h3>
        <div className="map-stats">
          {vehicleLocations.length} active vehicle{vehicleLocations.length !== 1 ? 's' : ''}
        </div>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={vehicleLocations.length > 0 ? 10 : 4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds locations={vehicleLocations} />
        {vehicleLocations
          .filter((loc) => loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined)
          .map((loc) => {
            const trip = loc.trip;
            const driver = loc.driver;
            const vehicle = loc.vehicle;

            return (
              <Marker
                key={loc.id}
                position={[loc.latitude as number, loc.longitude as number]}
                eventHandlers={{
                  click: () => handleMarkerClick(loc.tripId),
                }}
              >
                <Popup>
                  <div className="vehicle-popup">
                    {trip && (
                      <>
                        <h4>Trip Details</h4>
                        <p>
                          <strong>Pickup:</strong> {trip.pickupLocation}
                        </p>
                        <p>
                          <strong>Dropoff:</strong> {trip.dropoffLocation}
                        </p>
                        {trip.pickupDate && (
                          <p>
                            <strong>Scheduled:</strong>{' '}
                            {new Date(trip.pickupDate).toLocaleString()}
                          </p>
                        )}
                        {trip.flightNumber && (
                          <p>
                            <strong>Flight:</strong> {trip.flightNumber}
                          </p>
                        )}
                      </>
                    )}
                    {driver && (
                      <p>
                        <strong>Driver:</strong> {driver.name}
                      </p>
                    )}
                    {vehicle && (
                      <p>
                        <strong>Vehicle:</strong> {vehicle.name}
                      </p>
                    )}
                    {loc.timestamp && (
                      <p className="location-timestamp">
                        <strong>Last Update:</strong>{' '}
                        {new Date(loc.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                    {loc.speed !== null && loc.speed !== undefined && (
                      <p>
                        <strong>Speed:</strong> {Math.round(loc.speed * 2.237)} mph
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
      {vehicleLocations.length === 0 && (
        <div className="map-empty-state">
          <p>No active vehicles to track</p>
          <p className="map-empty-hint">Vehicles will appear here when drivers start trips</p>
        </div>
      )}
    </div>
  );
}
