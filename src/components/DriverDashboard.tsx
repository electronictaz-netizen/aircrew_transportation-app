import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import './DriverDashboard.css';

const client = generateClient<Schema>();

function DriverDashboard() {
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [currentDriver, setCurrentDriver] = useState<Schema['Driver']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDriverAndTrips();
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      loadFlightStatuses();
    }
  }, [trips]);

  const loadDriverAndTrips = async () => {
    try {
      const user = await getCurrentUser();
      const email = user.signInDetails?.loginId;

      // Find driver by email
      const { data: drivers } = await client.models.Driver.list();
      const driver = drivers.find((d) => d.email === email);

      if (driver) {
        setCurrentDriver(driver);
        // Load trips assigned to this driver
        const { data: tripsData } = await client.models.Trip.list({
          filter: { driverId: { eq: driver.id } },
        });
        
        // Filter to only show trips scheduled for the next 2 days
        const now = new Date();
        const twoDaysFromNow = addDays(now, 2);
        
        const filteredTrips = (tripsData || []).filter((trip) => {
          if (!trip.pickupDate) return false;
          const pickupDate = parseISO(trip.pickupDate);
          // Only show trips that are scheduled (not completed) and within the next 2 days
          return (
            trip.status !== 'Completed' &&
            (isAfter(pickupDate, now) || pickupDate.getTime() === now.getTime()) &&
            (isBefore(pickupDate, twoDaysFromNow) || pickupDate.getTime() === twoDaysFromNow.getTime())
          );
        });
        
        setTrips(filteredTrips as Array<Schema['Trip']['type']>);
      } else {
        // If no driver found, show empty state
        setTrips([]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlightStatuses = async () => {
    const statuses: Record<string, string> = {};
    for (const trip of trips) {
      if (trip.flightNumber) {
        try {
          const flightStatus = await fetchFlightStatus(trip.flightNumber);
          statuses[trip.id] = flightStatus.status;
        } catch (error) {
          console.error(`Error fetching status for ${trip.flightNumber}:`, error);
          statuses[trip.id] = 'Unknown';
        }
      }
    }
    setFlightStatuses(statuses);
  };

  const handlePickup = async (tripId: string) => {
    try {
      const now = new Date().toISOString();
      await client.models.Trip.update({
        id: tripId,
        actualPickupTime: now,
        status: 'InProgress',
      });
      await loadDriverAndTrips();
    } catch (error) {
      console.error('Error recording pickup:', error);
      alert('Failed to record pickup time. Please try again.');
    }
  };

  const handleDropoff = async (tripId: string) => {
    try {
      const now = new Date().toISOString();
      await client.models.Trip.update({
        id: tripId,
        actualDropoffTime: now,
        status: 'Completed',
      });
      await loadDriverAndTrips();
    } catch (error) {
      console.error('Error recording dropoff:', error);
      alert('Failed to record dropoff time. Please try again.');
    }
  };

  const getFlightStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on time':
      case 'landed':
        return 'flight-status-ontime';
      case 'delayed':
        return 'flight-status-delayed';
      case 'cancelled':
        return 'flight-status-cancelled';
      default:
        return 'flight-status-unknown';
    }
  };

  if (loading) {
    return <div className="loading">Loading your assignments...</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="driver-dashboard">
        <h2>Driver Dashboard</h2>
        {currentDriver && (
          <div className="driver-info">
            <p>
              <strong>Driver:</strong> {currentDriver.name}
            </p>
          </div>
        )}
        <div className="empty-state">
          <p>No trips assigned to you for the next 2 days.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Only scheduled and assigned jobs for the next 2 days are shown here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <h2>My Assigned Jobs</h2>
      {currentDriver && (
        <div className="driver-info">
          <p>
            <strong>Driver:</strong> {currentDriver.name}
          </p>
        </div>
      )}

      <div className="trips-grid">
        {trips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div className="trip-header">
              <h3>Flight {trip.flightNumber}</h3>
              <span
                className={`flight-status-badge ${getFlightStatusBadgeClass(
                  flightStatuses[trip.id] || 'Unknown'
                )}`}
              >
                {flightStatuses[trip.id] || 'Checking...'}
              </span>
            </div>

            <div className="trip-details">
              <div className="detail-row">
                <span className="label">Pickup Date/Time:</span>
                <span className="value">
                  {trip.pickupDate
                    ? format(new Date(trip.pickupDate), 'MMM dd, yyyy HH:mm')
                    : 'N/A'}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Pickup Location:</span>
                <span className="value">{trip.pickupLocation}</span>
              </div>

              <div className="detail-row">
                <span className="label">Dropoff Location:</span>
                <span className="value">{trip.dropoffLocation}</span>
              </div>

              <div className="detail-row">
                <span className="label">Number of Passengers:</span>
                <span className="value">{trip.numberOfPassengers}</span>
              </div>

              {trip.actualPickupTime && (
                <div className="detail-row">
                  <span className="label">Actual Pickup:</span>
                  <span className="value">
                    {format(new Date(trip.actualPickupTime), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}

              {trip.actualDropoffTime && (
                <div className="detail-row">
                  <span className="label">Actual Dropoff:</span>
                  <span className="value">
                    {format(new Date(trip.actualDropoffTime), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>

            <div className="trip-actions">
              {!trip.actualPickupTime && (
                <button
                  className="btn btn-pickup"
                  onClick={() => handlePickup(trip.id)}
                >
                  Record Pickup
                </button>
              )}
              {trip.actualPickupTime && !trip.actualDropoffTime && (
                <button
                  className="btn btn-dropoff"
                  onClick={() => handleDropoff(trip.id)}
                >
                  Record Dropoff
                </button>
              )}
              {trip.actualDropoffTime && (
                <div className="completed-badge">Completed</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DriverDashboard;
