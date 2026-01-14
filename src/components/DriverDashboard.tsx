import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import './DriverDashboard.css';

const client = generateClient<Schema>();

function DriverDashboard() {
  const { companyId } = useCompany();
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [currentDriver, setCurrentDriver] = useState<Schema['Driver']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, { status: string; loading: boolean }>>({});

  useEffect(() => {
    loadDriverAndTrips();
  }, []);


  const loadDriverAndTrips = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();
      const email = user.signInDetails?.loginId;

      // Find driver by email and company
      const { data: drivers } = await client.models.Driver.list({
        filter: { 
          companyId: { eq: companyId },
          email: { eq: email }
        }
      });
      const driver = drivers?.find((d: Schema['Driver']['type']) => d.email === email);

      if (driver) {
        setCurrentDriver(driver);
        // Load trips assigned to this driver
        const { data: tripsData } = await client.models.Trip.list({
          filter: { 
            companyId: { eq: companyId },
            driverId: { eq: driver.id } 
          },
        });
        
        // Filter to only show trips scheduled for the next 2 days
        const now = new Date();
        const twoDaysFromNow = addDays(now, 2);
        
        const filteredTrips = (tripsData || []).filter((trip: Schema['Trip']['type']) => {
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

  const handleCheckFlightStatus = async (trip: Schema['Trip']['type']) => {
    // Show cost warning
    const warningMessage = 
      '⚠️ COST WARNING ⚠️\n\n' +
      'Checking flight status uses external API services that may incur costs.\n\n' +
      'Excessive use of this feature will lead to increased costs for API services.\n\n' +
      'Each check counts toward your API quota/limit.\n\n' +
      'Do you want to proceed with checking flight status?';
    
    if (!confirm(warningMessage)) {
      return; // User cancelled
    }

    // Only check for current day trips
    if (!trip.pickupDate) {
      alert('Cannot check flight status: Trip has no pickup date.');
      return;
    }

    const tripDate = new Date(trip.pickupDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    if (tripDate < todayStart || tripDate > todayEnd) {
      alert('Flight status can only be checked for trips scheduled today.');
      return;
    }

    if (!trip.flightNumber) {
      alert('Cannot check flight status: Trip has no flight number.');
      return;
    }

    // Set loading state
    setFlightStatuses(prev => ({
      ...prev,
      [trip.id]: { status: 'Checking...', loading: true }
    }));

    try {
      const flightStatus = await fetchFlightStatus(
        trip.flightNumber,
        trip.pickupDate ? new Date(trip.pickupDate) : undefined
      );
      
      setFlightStatuses(prev => ({
        ...prev,
        [trip.id]: { status: flightStatus.status, loading: false }
      }));
    } catch (error) {
      console.error('Error fetching flight status:', error);
      setFlightStatuses(prev => ({
        ...prev,
        [trip.id]: { status: 'Error', loading: false }
      }));
      alert('Failed to fetch flight status. Please try again later.');
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
            {(trip.primaryLocationCategory || trip.airport) && (
              <div className="trip-category" style={{ 
                marginBottom: '0.75rem', 
                padding: '0.5rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '0.375rem',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}>
                Category: {trip.primaryLocationCategory || trip.airport}
              </div>
            )}
            <div className="trip-header">
              <h3>Flight {trip.flightNumber}</h3>
              {flightStatuses[trip.id] ? (
                <span
                  className={`flight-status-badge ${getFlightStatusBadgeClass(
                    flightStatuses[trip.id].status
                  )}`}
                >
                  {flightStatuses[trip.id].loading ? 'Checking...' : flightStatuses[trip.id].status}
                </span>
              ) : (
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleCheckFlightStatus(trip)}
                  title="Check flight status (may incur API costs)"
                >
                  Check Status
                </button>
              )}
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
