import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import './BookingRequestsList.css';

type BookingRequest = Schema['BookingRequest']['type'];

interface BookingRequestsListProps {
  requests: BookingRequest[];
  onAccept: (r: BookingRequest) => Promise<void>;
  onReject: (r: BookingRequest) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
  canManage?: boolean;
  error?: string | null;
}

export default function BookingRequestsList({
  requests,
  onAccept,
  onReject,
  onRefresh,
  loading = false,
  canManage = true,
  error = null,
}: BookingRequestsListProps) {
  const pending = requests.filter((r) => r.status === 'Pending');
  const accepted = requests.filter((r) => r.status === 'Accepted');
  const rejected = requests.filter((r) => r.status === 'Rejected');

  const renderRow = (r: BookingRequest) => {
    const flightOrJob =
      r.tripType === 'Airport Trip' ? (r.flightNumber || '—') : (r.jobNumber || '—');
    return (
      <tr key={r.id}>
        <td>{r.customerName}</td>
        <td>{r.customerEmail}</td>
        <td>{r.customerPhone}</td>
        <td>{r.pickupDate ? format(new Date(r.pickupDate), 'MMM d, yyyy h:mm a') : '—'}</td>
        <td>{r.pickupLocation}</td>
        <td>{r.dropoffLocation}</td>
        <td>{r.tripType || '—'}</td>
        <td>{flightOrJob}</td>
        <td>{r.numberOfPassengers ?? 1}</td>
        <td>
          <span className={`request-status request-status-${(r.status || 'Pending').toLowerCase()}`}>
            {r.status || 'Pending'}
          </span>
        </td>
        {canManage && (
          <td>
            {r.status === 'Pending' && (
              <div className="request-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onAccept(r)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onReject(r)}
                >
                  Reject
                </button>
              </div>
            )}
            {r.status === 'Accepted' && r.tripId && (
              <span className="request-linked">→ Trip</span>
            )}
          </td>
        )}
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="booking-requests-list">
        <p className="booking-requests-loading">Loading booking requests…</p>
      </div>
    );
  }

  return (
    <div className="booking-requests-list">
      {error && (
        <div className="booking-requests-error">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      )}
      <div className="booking-requests-header">
        <h3>Booking Requests</h3>
        <p className="booking-requests-desc">
          Requests from the public booking portal. Accept to create a trip in the trip list.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="booking-requests-empty">
          <p>No booking requests.</p>
        </div>
      ) : (
        <div className="booking-requests-table-wrap">
          <table className="booking-requests-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Pickup date</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Type</th>
                <th>Flight / Job</th>
                <th>Pax</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pending.length > 0 && (
                <>
                  {pending.map(renderRow)}
                </>
              )}
              {accepted.map(renderRow)}
              {rejected.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
