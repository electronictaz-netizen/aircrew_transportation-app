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
  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});
  const [displayedTrips, setDisplayedTrips] = useState<Array<Schema['Trip']['type']>>(trips);
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());

  // Update displayed trips when trips prop changes
  useEffect(() => {
    console.log('TripList: Received trips:', trips.length);
    console.log('TripList: Trip dates:', trips.map(t => ({
      id: t.id,
      date: t.pickupDate,
      flight: t.flightNumber,
      isRecurring: t.isRecurring,
      parentId: t.parentTripId,
      status: t.status
    })));
    setDisplayedTrips(trips);
  }, [trips]);

  useEffect(() => {
    // Fetch flight statuses only for current day trips
    const loadFlightStatuses = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      // Filter to only current day trips
      const todayTrips = displayedTrips.filter(trip => {
        if (!trip.pickupDate) return false;
        const tripDate = new Date(trip.pickupDate);
        return tripDate >= todayStart && tripDate <= todayEnd;
      });
      
      console.log(`Fetching flight status for ${todayTrips.length} of ${displayedTrips.length} trips (current day only)`);
      
      const statuses: Record<string, string> = {};
      for (const trip of todayTrips) {
        if (trip.flightNumber) {
          try {
            // Pass the pickup date to get the correct flight for that day
            const flightStatus = await fetchFlightStatus(
              trip.flightNumber,
              trip.pickupDate ? new Date(trip.pickupDate) : undefined
            );
            statuses[trip.id] = flightStatus.status;
          } catch (error) {
            console.error(`Error fetching status for ${trip.flightNumber}:`, error);
            statuses[trip.id] = 'Unknown';
          }
        }
      }
      setFlightStatuses(statuses);
    };

    // Load flight statuses immediately
    if (displayedTrips.length > 0) {
      loadFlightStatuses();
    }
    
    // Set up interval to refresh flight statuses every 60 minutes
    const intervalId = setInterval(() => {
      console.log('Refreshing flight statuses (60-minute interval)...');
      if (displayedTrips.length > 0) {
        loadFlightStatuses();
      }
    }, 60 * 60 * 1000); // 60 minutes in milliseconds
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [displayedTrips]);

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
              <td colSpan={onDeleteMultiple ? 13 : 12} className="no-results">
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
                <span
                  className={`flight-status-badge ${getFlightStatusBadgeClass(
                    flightStatuses[trip.id] || 'Unknown'
                  )}`}
                >
                  {flightStatuses[trip.id] || 'Checking...'}
                </span>
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
  );
}

export default TripList;
