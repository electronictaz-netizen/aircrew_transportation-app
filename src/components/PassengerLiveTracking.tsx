import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { getTripLocation } from '../utils/customerPortalApi';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const POLL_INTERVAL_MS = 12000;

interface PassengerLiveTrackingProps {
  companyId: string;
  customerId: string;
  tripId: string;
}

function CenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function PassengerLiveTracking({ companyId, customerId, tripId }: PassengerLiveTrackingProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLocation = useCallback(async () => {
    const result = await getTripLocation(companyId, customerId, tripId);
    if (result.success && result.location) {
      setLocation(result.location);
      setError(null);
    } else if (!result.success && result.error) {
      setError(result.error);
    } else {
      setLocation(null);
    }
    setLoading(false);
  }, [companyId, customerId, tripId]);

  useEffect(() => {
    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLocation]);

  if (loading && !location) {
    return (
      <div className="passenger-live-tracking">
        <div className="passenger-live-tracking-header">Live driver location</div>
        <div className="passenger-live-tracking-placeholder">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="passenger-live-tracking">
        <div className="passenger-live-tracking-header">Live driver location</div>
        <div className="passenger-live-tracking-placeholder">{error}</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="passenger-live-tracking">
        <div className="passenger-live-tracking-header">Live driver location</div>
        <div className="passenger-live-tracking-placeholder">
          Driver is on the way. Location will appear when the driver starts tracking.
        </div>
      </div>
    );
  }

  const { latitude, longitude, timestamp } = location;

  return (
    <div className="passenger-live-tracking">
      <div className="passenger-live-tracking-header">
        Live driver location
        {timestamp && (
          <span className="passenger-live-tracking-updated">
            Updated {format(new Date(timestamp), 'h:mm a')}
          </span>
        )}
      </div>
      <div className="passenger-live-tracking-map-wrap">
        <MapContainer
          center={[latitude, longitude]}
          zoom={14}
          className="passenger-live-tracking-map"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CenterMap lat={latitude} lng={longitude} />
          <Marker position={[latitude, longitude]} />
        </MapContainer>
      </div>
    </div>
  );
}
