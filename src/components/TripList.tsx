import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import TripFilters from './TripFilters';
import './TripList.css';

interface TripListProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  onEdit: (trip: Schema['Trip']['type']) => void;
  onDelete: (tripId: string) => void;
  onDeleteMultiple?: (tripIds: string[]) => void;
  onUpdate: () => void;
}

function TripList({ trips, drivers, onEdit, onDelete, onDeleteMultiple, onUpdate }: TripListProps) {
  const [displayedTrips, setDisplayedTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [flightStatuses, setFlightStatuses] = useState<Record<string, { status: string; loading: boolean }>>({});

  // Log when trips prop changes (TripFilters will handle sorting via handleFilterChange)
  useEffect(() => {
    console.log('TripList: Received trips:', trips.length);
    console.log('TripList: Trip dates (unsorted):', trips.map(t => ({
      id: t.id,
      date: t.pickupDate,
      dateParsed: t.pickupDate ? new Date(t.pickupDate).toISOString() : 'N/A',
      flight: t.flightNumber,
      isRecurring: t.isRecurring,
      parentId: t.parentTripId,
      status: t.status
    })));
    // Don't set displayedTrips directly - TripFilters will call handleFilterChange with sorted trips
    // This ensures sorting is always applied
  }, [trips]);


  const getDriverName = (driverId: string | null | undefined) => {
    if (!driverId) return 'Unassigned';
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || 'Unknown';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'Assigned':
        return 'status-assigned';
      case 'InProgress':
        return 'status-in-progress';
      default:
        return 'status-unassigned';
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

  const handleFilterChange = (filteredTrips: Array<Schema['Trip']['type']>) => {
    setDisplayedTrips(filteredTrips);
    // Clear selections when filter changes
    setSelectedTrips(new Set());
  };

  const handleSelectTrip = (tripId: string) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTrips(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTrips.size === displayedTrips.length) {
      setSelectedTrips(new Set());
    } else {
      setSelectedTrips(new Set(displayedTrips.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTrips.size === 0) return;
    
    const count = selectedTrips.size;
    if (!confirm(`Are you sure you want to delete ${count} trip${count > 1 ? 's' : ''}?`)) return;
    
    if (onDeleteMultiple) {
      onDeleteMultiple(Array.from(selectedTrips));
      setSelectedTrips(new Set());
    } else {
      // Fallback to individual deletes
      selectedTrips.forEach(tripId => onDelete(tripId));
      setSelectedTrips(new Set());
    }
  };

  if (trips.length === 0) {
    return (
      <div className="empty-state">
        <p>No trips scheduled. Create a new trip to get started.</p>
      </div>
    );
  }

  return (
    <div className="trip-list">
      <TripFilters
        trips={trips}
        drivers={drivers}
        onFilterChange={handleFilterChange}
        onRefresh={onUpdate}
      />
      <div className="trip-list-header">
        <p className="trip-count">
          Showing {displayedTrips.length} of {trips.length} trips
        </p>
        {onDeleteMultiple && (
          <div className="bulk-actions">
            {selectedTrips.size > 0 && (
              <button
                className="btn btn-danger"
                onClick={handleDeleteSelected}
                title={`Delete ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''}`}
              >
                Delete Selected ({selectedTrips.size})
              </button>
            )}
          </div>
        )}
      </div>
      <div className="trips-table-wrapper">
        <table className="trips-table">
        <thead>
          <tr>
            {onDeleteMultiple && (
              <th>
                <input
                  type="checkbox"
                  checked={selectedTrips.size === displayedTrips.length && displayedTrips.length > 0}
                  onChange={handleSelectAll}
                  title="Select all"
                />
              </th>
            )}
            <th>Airport</th>
            <th>Pickup Date</th>
            <th>Pickup Time</th>
            <th>Flight Number</th>
            <th>Flight Status</th>
            <th>Pickup Location</th>
            <th>Dropoff Location</th>
            <th>Passengers</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Actual Pickup</th>
            <th>Actual Dropoff</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedTrips.length === 0 ? (
            <tr>
              <td colSpan={onDeleteMultiple ? 14 : 13} className="no-results">
                No trips match the current filters. Try adjusting your search criteria.
              </td>
            </tr>
          ) : (
            displayedTrips.map((trip) => (
            <tr key={trip.id} className={selectedTrips.has(trip.id) ? 'selected' : ''}>
              {onDeleteMultiple && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTrips.has(trip.id)}
                    onChange={() => handleSelectTrip(trip.id)}
                  />
                </td>
              )}
              <td>
                {trip.airport ? (
                  trip.airport === 'BUF' ? 'BUF' :
                  trip.airport === 'ROC' ? 'ROC' :
                  trip.airport === 'SYR' ? 'SYR' :
                  trip.airport === 'ALB' ? 'ALB' :
                  trip.airport
                ) : 'N/A'}
              </td>
              <td>
                {trip.pickupDate
                  ? format(new Date(trip.pickupDate), 'MMM dd, yyyy')
                  : 'N/A'}
              </td>
              <td>
                {trip.pickupDate
                  ? format(new Date(trip.pickupDate), 'HH:mm')
                  : 'N/A'}
              </td>
              <td>
                {trip.flightNumber}
                {(trip.isRecurring || trip.parentTripId) && (
                  <span className="recurring-badge" title={trip.isRecurring ? "Recurring Job (Parent)" : "Recurring Job (Child)"}>
                    {trip.isRecurring ? ' 🔄' : ' ↪️'}
                  </span>
                )}
              </td>
              <td>
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
              </td>
              <td>{trip.pickupLocation}</td>
              <td>{trip.dropoffLocation}</td>
              <td>{trip.numberOfPassengers}</td>
              <td>{getDriverName(trip.driverId)}</td>
              <td>
                <span className={`status-badge ${getStatusBadgeClass(trip.status || 'Unassigned')}`}>
                  {trip.status || 'Unassigned'}
                </span>
              </td>
              <td>
                {trip.actualPickupTime
                  ? format(new Date(trip.actualPickupTime), 'MMM dd, yyyy HH:mm')
                  : '-'}
              </td>
              <td>
                {trip.actualDropoffTime
                  ? format(new Date(trip.actualDropoffTime), 'MMM dd, yyyy HH:mm')
                  : '-'}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(trip)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(trip.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="trips-table-mobile">
        {displayedTrips.length === 0 ? (
          <div className="no-results">
            No trips match the current filters. Try adjusting your search criteria.
          </div>
        ) : (
          displayedTrips.map((trip) => (
            <div
              key={trip.id}
              className={`trip-card-mobile ${selectedTrips.has(trip.id) ? 'selected' : ''}`}
            >
              <div className="trip-card-header">
                <div className="trip-card-title">
                  {onDeleteMultiple && (
                    <input
                      type="checkbox"
                      className="trip-card-checkbox"
                      checked={selectedTrips.has(trip.id)}
                      onChange={() => handleSelectTrip(trip.id)}
                    />
                  )}
                  <span>
                    {trip.flightNumber}
                    {(trip.isRecurring || trip.parentTripId) && (
                      <span className="recurring-badge" title={trip.isRecurring ? "Recurring Job (Parent)" : "Recurring Job (Child)"}>
                        {trip.isRecurring ? ' 🔄' : ' ↪️'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(trip)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(trip.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {trip.airport && (
                <div className="trip-card-field">
                  <span className="trip-card-label">Airport</span>
                  <span className="trip-card-value">
                    {trip.airport === 'BUF' ? 'Buffalo Niagara International Airport (BUF)' :
                     trip.airport === 'ROC' ? 'Frederick Douglass Greater Rochester International Airport (ROC)' :
                     trip.airport === 'SYR' ? 'Syracuse Hancock International Airport (SYR)' :
                     trip.airport === 'ALB' ? 'Albany International Airport (ALB)' :
                     trip.airport}
                  </span>
                </div>
              )}
              
              <div className="trip-card-field">
                <span className="trip-card-label">Pickup Date & Time</span>
                <span className="trip-card-value">
                  {trip.pickupDate
                    ? `${format(new Date(trip.pickupDate), 'MMM dd, yyyy')} at ${format(new Date(trip.pickupDate), 'HH:mm')}`
                    : 'N/A'}
                </span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Flight Status</span>
                <span className="trip-card-value">
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
                </span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Pickup Location</span>
                <span className="trip-card-value">{trip.pickupLocation}</span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Dropoff Location</span>
                <span className="trip-card-value">{trip.dropoffLocation}</span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Passengers</span>
                <span className="trip-card-value">{trip.numberOfPassengers}</span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Driver</span>
                <span className="trip-card-value">{getDriverName(trip.driverId)}</span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Status</span>
                <span className="trip-card-value">
                  <span className={`status-badge ${getStatusBadgeClass(trip.status || 'Unassigned')}`}>
                    {trip.status || 'Unassigned'}
                  </span>
                </span>
              </div>
              
              {trip.actualPickupTime && (
                <div className="trip-card-field">
                  <span className="trip-card-label">Actual Pickup</span>
                  <span className="trip-card-value">
                    {format(new Date(trip.actualPickupTime), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
              
              {trip.actualDropoffTime && (
                <div className="trip-card-field">
                  <span className="trip-card-label">Actual Dropoff</span>
                  <span className="trip-card-value">
                    {format(new Date(trip.actualDropoffTime), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TripList;
