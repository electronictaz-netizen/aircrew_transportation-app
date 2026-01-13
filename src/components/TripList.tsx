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
  onUpdate: () => void;
}

function TripList({ trips, drivers, onEdit, onDelete }: TripListProps) {
  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});
  const [displayedTrips, setDisplayedTrips] = useState<Array<Schema['Trip']['type']>>(trips);

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
    // Fetch flight statuses for displayed trips
    const loadFlightStatuses = async () => {
      const statuses: Record<string, string> = {};
      for (const trip of displayedTrips) {
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

    if (displayedTrips.length > 0) {
      loadFlightStatuses();
    }
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
      />
      <div className="trip-list-header">
        <p className="trip-count">
          Showing {displayedTrips.length} of {trips.length} trips
        </p>
      </div>
      <table className="trips-table">
        <thead>
          <tr>
            <th>Pickup Date/Time</th>
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
              <td colSpan={11} className="no-results">
                No trips match the current filters. Try adjusting your search criteria.
              </td>
            </tr>
          ) : (
            displayedTrips.map((trip) => (
            <tr key={trip.id}>
              <td>
                {trip.pickupDate
                  ? format(new Date(trip.pickupDate), 'MMM dd, yyyy HH:mm')
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
