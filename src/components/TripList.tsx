import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import './TripList.css';

const client = generateClient<Schema>();

interface TripListProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  onEdit: (trip: Schema['Trip']['type']) => void;
  onDelete: (tripId: string) => void;
  onUpdate: () => void;
}

function TripList({ trips, drivers, onEdit, onDelete, onUpdate }: TripListProps) {
  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch flight statuses for all trips
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

    if (trips.length > 0) {
      loadFlightStatuses();
    }
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

  if (trips.length === 0) {
    return (
      <div className="empty-state">
        <p>No trips scheduled. Create a new trip to get started.</p>
      </div>
    );
  }

  return (
    <div className="trip-list">
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
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>
                {trip.pickupDate
                  ? format(new Date(trip.pickupDate), 'MMM dd, yyyy HH:mm')
                  : 'N/A'}
              </td>
              <td>{trip.flightNumber}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TripList;
