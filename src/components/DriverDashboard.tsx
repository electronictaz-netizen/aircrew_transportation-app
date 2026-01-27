import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import { getCurrentLocation, getLocationErrorMessage, formatCoordinates, isGeolocationAvailable } from '../utils/gpsLocation';
import { startGPSTracking, stopGPSTracking, isTrackingActive, getCurrentTrackingConfig } from '../utils/gpsTracking';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { logger } from '../utils/logger';
import CameraCapture from './CameraCapture';
import './DriverDashboard.css';

const client = generateClient<Schema>();

function DriverDashboard() {
  const { companyId, company } = useCompany();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [currentDriver, setCurrentDriver] = useState<Schema['Driver']['type'] | null>(null);
  const [vehicles, setVehicles] = useState<Array<Schema['Vehicle']['type']>>([]);
  const [tripVehicles, setTripVehicles] = useState<Record<string, Array<Schema['TripVehicle']['type']>>>({});
  const [loading, setLoading] = useState(true);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, { status: string; loading: boolean }>>({});
  const [gpsLoading, setGpsLoading] = useState<Record<string, boolean>>({});
  const [changingVehicle, setChangingVehicle] = useState<Record<string, boolean>>({});
  const [showProofOfDeliveryCamera, setShowProofOfDeliveryCamera] = useState(false);
  const [tripForProofOfDelivery, setTripForProofOfDelivery] = useState<string | null>(null);
  const [showProofOfDeliveryCamera, setShowProofOfDeliveryCamera] = useState(false);
  const [tripForProofOfDelivery, setTripForProofOfDelivery] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      loadDriverAndTrips();
      loadVehicles();
    }
  }, [companyId]);

  // Auto-refresh trips every 30 seconds to catch new assignments
  useEffect(() => {
    if (!companyId) return;
    
    const interval = setInterval(() => {
      loadDriverAndTrips();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [companyId]);

  // Cleanup GPS tracking on unmount
  useEffect(() => {
    return () => {
      stopGPSTracking();
    };
  }, []);

  // Check if we need to start/stop tracking when trips change
  useEffect(() => {
    if (!currentDriver || !companyId) return;

    // Find active trip (InProgress status)
    const activeTrip = trips.find(t => t.status === 'InProgress');
    
    if (activeTrip) {
      // Check if we're already tracking this trip
      const currentConfig = getCurrentTrackingConfig();
      if (!currentConfig || currentConfig.tripId !== activeTrip.id) {
        // Start tracking the active trip
        const tripVehiclesForTrip = tripVehicles[activeTrip.id] || [];
        const primaryVehicleId = tripVehiclesForTrip.length > 0 ? tripVehiclesForTrip[0].vehicleId : undefined;
        
        startGPSTracking({
          tripId: activeTrip.id,
          driverId: currentDriver.id,
          vehicleId: primaryVehicleId,
          companyId: companyId,
          updateInterval: 30000, // 30 seconds
          onError: (error) => {
            logger.warn('GPS tracking error:', error);
            // Don't show error to user for every failed update, just log it
          },
        });
      }
    } else {
      // No active trip, stop tracking if active
      if (isTrackingActive()) {
        stopGPSTracking();
      }
    }
  }, [trips, currentDriver, companyId, tripVehicles]);

  const loadVehicles = async () => {
    if (!companyId) return;
    
    try {
      const { data: vehiclesData } = await client.models.Vehicle.list({
        filter: { 
          companyId: { eq: companyId },
          isActive: { eq: true }
        }
      });
      setVehicles(vehiclesData as Array<Schema['Vehicle']['type']>);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };


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
        
        // Load trip vehicles for all trips
        if (filteredTrips.length > 0) {
          const tripIds = filteredTrips.map(t => t.id);
          // Load all trip vehicles for the company and filter client-side
          const { data: tripVehiclesData } = await client.models.TripVehicle.list({
            filter: {
              companyId: { eq: companyId },
            },
          });
          
          // Group trip vehicles by tripId, filtering to only include our trips
          const vehiclesByTrip: Record<string, Array<Schema['TripVehicle']['type']>> = {};
          (tripVehiclesData || []).forEach((tv) => {
            if (tv.tripId && tripIds.includes(tv.tripId)) {
              if (!vehiclesByTrip[tv.tripId]) {
                vehiclesByTrip[tv.tripId] = [];
              }
              vehiclesByTrip[tv.tripId].push(tv);
            }
          });
          setTripVehicles(vehiclesByTrip);
        }
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
    setGpsLoading(prev => ({ ...prev, [tripId]: true }));
    
    try {
      const now = new Date().toISOString();
      let gpsData: { startLocationLat?: number; startLocationLng?: number } = {};

      // Try to get GPS location
      if (isGeolocationAvailable()) {
        try {
          const location = await getCurrentLocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Always get fresh location
          });
          
          gpsData = {
            startLocationLat: location.latitude,
            startLocationLng: location.longitude,
          };
          
          logger.debug('GPS location captured for pickup:', {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          });
        } catch (gpsError: any) {
          // GPS failed, but continue with pickup recording
          logger.warn('Failed to get GPS location for pickup:', gpsError);
          const errorMessage = getLocationErrorMessage(gpsError);
          
          // Show warning but allow pickup to proceed
          showWarning(`Pickup recorded, but GPS location unavailable: ${errorMessage}`);
        }
      } else {
        logger.warn('Geolocation not available in this browser');
        showWarning('GPS location not available in this browser. Pickup recorded without location.');
      }

      // Update trip with pickup time and GPS (if available)
      await client.models.Trip.update({
        id: tripId,
        actualPickupTime: now,
        status: 'InProgress',
        ...gpsData,
      });
      
      // Start real-time GPS tracking for this trip
      if (currentDriver && companyId) {
        const tripVehiclesForTrip = tripVehicles[tripId] || [];
        const primaryVehicleId = tripVehiclesForTrip.length > 0 ? tripVehiclesForTrip[0].vehicleId : undefined;
        
        startGPSTracking({
          tripId: tripId,
          driverId: currentDriver.id,
          vehicleId: primaryVehicleId,
          companyId: companyId,
          updateInterval: 30000, // 30 seconds
          onError: (error) => {
            logger.warn('GPS tracking error:', error);
            // Don't show error to user for every failed update
          },
        });
      }
      
      await loadDriverAndTrips();
      
      if (gpsData.startLocationLat && gpsData.startLocationLng) {
        showSuccess(`Pickup recorded with GPS location: ${formatCoordinates(gpsData.startLocationLat, gpsData.startLocationLng)}. Real-time tracking started.`);
      } else {
        showSuccess('Pickup recorded successfully. Real-time tracking started.');
      }
    } catch (error) {
      logger.error('Error recording pickup:', error);
      showError('Failed to record pickup time. Please try again.');
    } finally {
      setGpsLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const handleDropoff = async (tripId: string, skipPhoto: boolean = false) => {
    // If not skipping photo, show camera first
    if (!skipPhoto) {
      setTripForProofOfDelivery(tripId);
      setShowProofOfDeliveryCamera(true);
      return;
    }

    // Proceed with dropoff (called after photo is captured or skipped)
    await completeDropoff(tripId, null);
  };

  const completeDropoff = async (tripId: string, proofOfDeliveryPhoto: string | null) => {
    setGpsLoading(prev => ({ ...prev, [tripId]: true }));
    
    try {
      const now = new Date().toISOString();
      let gpsData: { completeLocationLat?: number; completeLocationLng?: number } = {};

      // Try to get GPS location
      if (isGeolocationAvailable()) {
        try {
          const location = await getCurrentLocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Always get fresh location
          });
          
          gpsData = {
            completeLocationLat: location.latitude,
            completeLocationLng: location.longitude,
          };
          
          logger.debug('GPS location captured for dropoff:', {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          });
        } catch (gpsError: any) {
          // GPS failed, but continue with dropoff recording
          logger.warn('Failed to get GPS location for dropoff:', gpsError);
          const errorMessage = getLocationErrorMessage(gpsError);
          
          // Show warning but allow dropoff to proceed
          showWarning(`Dropoff recorded, but GPS location unavailable: ${errorMessage}`);
        }
      } else {
        logger.warn('Geolocation not available in this browser');
        showWarning('GPS location not available in this browser. Dropoff recorded without location.');
      }

      // Stop GPS tracking for this trip
      const currentConfig = getCurrentTrackingConfig();
      if (currentConfig && currentConfig.tripId === tripId) {
        stopGPSTracking();
      }

      // Update trip with dropoff time, GPS, and proof of delivery photo (if available)
      const updateData: any = {
        id: tripId,
        actualDropoffTime: now,
        status: 'Completed',
        ...gpsData,
      };

      if (proofOfDeliveryPhoto) {
        updateData.proofOfDeliveryPhoto = proofOfDeliveryPhoto;
        updateData.proofOfDeliveryPhotoTimestamp = now;
      }

      await client.models.Trip.update(updateData);
      
      await loadDriverAndTrips();
      
      let successMessage = 'Dropoff recorded successfully. Tracking stopped.';
      if (gpsData.completeLocationLat && gpsData.completeLocationLng) {
        successMessage = `Dropoff recorded with GPS location: ${formatCoordinates(gpsData.completeLocationLat, gpsData.completeLocationLng)}. Tracking stopped.`;
      }
      if (proofOfDeliveryPhoto) {
        successMessage += ' Proof of delivery photo attached.';
      }
      showSuccess(successMessage);
    } catch (error) {
      logger.error('Error recording dropoff:', error);
      showError('Failed to record dropoff time. Please try again.');
    } finally {
      setGpsLoading(prev => ({ ...prev, [tripId]: false }));
      setShowProofOfDeliveryCamera(false);
      setTripForProofOfDelivery(null);
    }
  };

  const handleProofOfDeliveryCapture = async (file: File, dataUrl: string) => {
    if (tripForProofOfDelivery) {
      // Store photo as data URL (in production, upload to S3 and store URL)
      await completeDropoff(tripForProofOfDelivery, dataUrl);
    }
  };

  const handleSkipProofOfDelivery = () => {
    if (tripForProofOfDelivery) {
      completeDropoff(tripForProofOfDelivery, null);
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

  const handleVehicleToggle = async (tripId: string, vehicleId: string, isAdding: boolean) => {
    setChangingVehicle(prev => ({ ...prev, [tripId]: true }));
    
    try {
      if (isAdding) {
        // Add vehicle to trip
        await client.models.TripVehicle.create({
          companyId: companyId!,
          tripId: tripId,
          vehicleId: vehicleId,
        });
        const vehicle = vehicles.find(v => v.id === vehicleId);
        showSuccess(`Added ${vehicle?.name || 'vehicle'} to trip`);
      } else {
        // Remove vehicle from trip
        const tripVehicle = tripVehicles[tripId]?.find(tv => tv.vehicleId === vehicleId);
        if (tripVehicle) {
          await client.models.TripVehicle.delete({ id: tripVehicle.id });
          const vehicle = vehicles.find(v => v.id === vehicleId);
          showSuccess(`Removed ${vehicle?.name || 'vehicle'} from trip`);
        }
      }
      
      await loadDriverAndTrips();
    } catch (error) {
      logger.error('Error updating vehicle:', error);
      showError('Failed to update vehicle. Please try again.');
    } finally {
      setChangingVehicle(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const handleCheckFlightStatus = async (trip: Schema['Trip']['type']) => {
    if (!trip.flightNumber) {
      alert('Cannot check flight status: Trip has no flight number.');
      return;
    }

    // Check if company is premium tier
    const isPremium = company?.subscriptionTier === 'premium';

    if (isPremium) {
      // Premium tier: Use API with cost warning
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
    } else {
      // Non-premium tier: Open FlightRadar24 in new tab
      const flightNumber = trip.flightNumber.trim().toUpperCase();
      const flightradar24Url = `https://www.flightradar24.com/data/flights/${encodeURIComponent(flightNumber)}`;
      window.open(flightradar24Url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return <div className="loading">Loading your assignments...</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="driver-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Driver Dashboard</h2>
          <button
            onClick={() => loadDriverAndTrips()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            aria-label="Refresh trips"
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>My Assigned Jobs</h2>
        <button
          onClick={() => loadDriverAndTrips()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          aria-label="Refresh trips"
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>
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
                  title={company?.subscriptionTier === 'premium' 
                    ? "Check flight status (may incur API costs)" 
                    : "Open FlightRadar24 to check flight status"}
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

              <div className="detail-row">
                <span className="label">Vehicles:</span>
                <span className="value" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(() => {
                    const assignedVehicles = tripVehicles[trip.id] || [];
                    if (assignedVehicles.length === 0) {
                      return (
                        <>
                          <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No vehicles assigned</span>
                          {!trip.actualPickupTime && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                              {vehicles.map((vehicle) => (
                                <button
                                  key={vehicle.id}
                                  onClick={() => handleVehicleToggle(trip.id, vehicle.id, true)}
                                  disabled={changingVehicle[trip.id]}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    borderRadius: '4px',
                                    border: '1px solid #3b82f6',
                                    backgroundColor: '#eff6ff',
                                    color: '#1e40af',
                                    cursor: changingVehicle[trip.id] ? 'not-allowed' : 'pointer',
                                  }}
                                  title={`Add ${vehicle.name}`}
                                >
                                  + {vehicle.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {assignedVehicles.map((tv) => {
                          const vehicle = vehicles.find(v => v.id === tv.vehicleId);
                          if (!vehicle) return null;
                          return (
                            <div key={tv.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>
                                {vehicle.name}
                                {vehicle.make || vehicle.model 
                                  ? ` (${[vehicle.make, vehicle.model].filter(Boolean).join(' ')})` 
                                  : ''}
                              </span>
                              {!trip.actualPickupTime && (
                                <button
                                  onClick={() => handleVehicleToggle(trip.id, vehicle.id, false)}
                                  disabled={changingVehicle[trip.id]}
                                  style={{
                                    padding: '0.125rem 0.375rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ef4444',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    cursor: changingVehicle[trip.id] ? 'not-allowed' : 'pointer',
                                  }}
                                  title={`Remove ${vehicle.name}`}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {!trip.actualPickupTime && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                            {vehicles
                              .filter(v => !assignedVehicles.some(tv => tv.vehicleId === v.id))
                              .map((vehicle) => (
                                <button
                                  key={vehicle.id}
                                  onClick={() => handleVehicleToggle(trip.id, vehicle.id, true)}
                                  disabled={changingVehicle[trip.id]}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    borderRadius: '4px',
                                    border: '1px solid #3b82f6',
                                    backgroundColor: '#eff6ff',
                                    color: '#1e40af',
                                    cursor: changingVehicle[trip.id] ? 'not-allowed' : 'pointer',
                                  }}
                                  title={`Add ${vehicle.name}`}
                                >
                                  + {vehicle.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </span>
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
                  disabled={gpsLoading[trip.id]}
                  aria-busy={gpsLoading[trip.id]}
                  title="Record pickup time and GPS location"
                >
                  {gpsLoading[trip.id] ? 'Getting Location...' : '📍 Record Pickup'}
                </button>
              )}
              {trip.actualPickupTime && !trip.actualDropoffTime && (
                <button
                  className="btn btn-dropoff"
                  onClick={() => handleDropoff(trip.id)}
                  disabled={gpsLoading[trip.id]}
                  aria-busy={gpsLoading[trip.id]}
                  title="Record dropoff time and GPS location"
                >
                  {gpsLoading[trip.id] ? 'Getting Location...' : '📍 Record Dropoff'}
                </button>
              )}
              {trip.actualDropoffTime && (
                <div className="completed-badge">Completed</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}

      {/* Proof of Delivery Camera */}
      <CameraCapture
        open={showProofOfDeliveryCamera}
        onOpenChange={(open) => {
          setShowProofOfDeliveryCamera(open);
          if (!open && tripForProofOfDelivery) {
            // If cancelled, complete dropoff without photo
            handleSkipProofOfDelivery();
          }
        }}
        onCapture={handleProofOfDeliveryCapture}
        onCancel={handleSkipProofOfDelivery}
        title="Proof of Delivery Photo"
        description="Take a photo as proof of delivery"
        facingMode="environment"
      />
    </div>
  );
}

export default DriverDashboard;
