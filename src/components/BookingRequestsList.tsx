import { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Accepted' | 'Rejected'>('all');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by date range
    if (dateFilterStart) {
      const startDate = new Date(dateFilterStart);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((r) => {
        if (!r.pickupDate) return false;
        const requestDate = new Date(r.pickupDate);
        return requestDate >= startDate;
      });
    }

    if (dateFilterEnd) {
      const endDate = new Date(dateFilterEnd);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        if (!r.pickupDate) return false;
        const requestDate = new Date(r.pickupDate);
        return requestDate <= endDate;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((r) => {
        return (
          r.customerName?.toLowerCase().includes(query) ||
          r.customerEmail?.toLowerCase().includes(query) ||
          r.customerPhone?.toLowerCase().includes(query) ||
          r.pickupLocation?.toLowerCase().includes(query) ||
          r.dropoffLocation?.toLowerCase().includes(query) ||
          r.flightNumber?.toLowerCase().includes(query) ||
          r.jobNumber?.toLowerCase().includes(query) ||
          r.tripType?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [requests, statusFilter, dateFilterStart, dateFilterEnd, searchQuery]);

  const pending = filteredRequests.filter((r) => r.status === 'Pending');
  const accepted = filteredRequests.filter((r) => r.status === 'Accepted');
  const rejected = filteredRequests.filter((r) => r.status === 'Rejected');

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

      {/* Search and Filter Controls */}
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Search */}
          <div>
            <label htmlFor="booking-search" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Search
            </label>
            <input
              id="booking-search"
              type="text"
              placeholder="Search by name, email, phone, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="booking-status-filter" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Status
            </label>
            <select
              id="booking-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label htmlFor="booking-date-start" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              id="booking-date-start"
              type="date"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Date Range End */}
          <div>
            <label htmlFor="booking-date-end" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              End Date
            </label>
            <input
              id="booking-date-end"
              type="date"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || statusFilter !== 'all' || dateFilterStart || dateFilterEnd) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateFilterStart('');
              setDateFilterEnd('');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Clear Filters
          </button>
        )}

        {/* Results Count */}
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {filteredRequests.length} of {requests.length} booking requests
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="booking-requests-empty">
          <p>No booking requests.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="booking-requests-empty">
          <p>No booking requests match your filters.</p>
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
