import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { fetchFlightStatus } from '../utils/flightStatus';
import { useCompany } from '../contexts/CompanyContext';
import TripFilters from './TripFilters';
import ConfirmationDialog from './ConfirmationDialog';
import AlertDialog from './AlertDialog';
import EmptyState from './EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import './TripList.css';

interface TripListProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  locations?: Array<Schema['Location']['type']>;
  customers?: Array<Schema['Customer']['type']>;
  onEdit?: (trip: Schema['Trip']['type']) => void;
  onDelete?: (tripId: string) => void;
  onDeleteMultiple?: (tripIds: string[]) => void;
  onAssignMultiple?: (tripIds: string[]) => void;
  onBulkStatusUpdate?: (tripIds: string[], status: string) => void;
  onExport?: (tripIds?: string[]) => void;
  onUpdate: () => void;
}

function TripList({ trips, drivers, locations = [], customers = [], onEdit, onDelete, onDeleteMultiple, onAssignMultiple, onBulkStatusUpdate, onExport, onUpdate }: TripListProps) {
  const { company } = useCompany();
  const [displayedTrips, setDisplayedTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [flightStatuses, setFlightStatuses] = useState<Record<string, { status: string; loading: boolean }>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ title: '', message: '', type: 'info' });
  const [tripsToDelete, setTripsToDelete] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<string>('Completed');

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

  const getCustomerName = (customerId: string | null | undefined) => {
    if (!customerId) return null;
    const customer = customers.find((c) => c.id === customerId);
    return customer ? (customer.companyName ? `${customer.name} (${customer.companyName})` : customer.name) : null;
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
    if (!trip.flightNumber) {
      setAlertConfig({
        title: 'Cannot Check Flight Status',
        message: 'This trip has no flight number.',
        type: 'warning',
      });
      setShowAlert(true);
      return;
    }

    // Check if company is premium tier
    const isPremium = company?.subscriptionTier === 'premium';

    if (isPremium) {
      // Premium tier: Use API with cost warning
      // Note: Cost warning confirmation can be added with ConfirmationDialog if needed
      // Note: We'll handle this with a state-based confirmation dialog
      // For now, proceed with the check (confirmation can be added later)
      
      // Only check for current day trips
      if (!trip.pickupDate) {
        setAlertConfig({
          title: 'Cannot Check Flight Status',
          message: 'This trip has no pickup date.',
          type: 'warning',
        });
        setShowAlert(true);
        return;
      }

      const tripDate = new Date(trip.pickupDate);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      if (tripDate < todayStart || tripDate > todayEnd) {
        setAlertConfig({
          title: 'Cannot Check Flight Status',
          message: 'Flight status can only be checked for trips scheduled today.',
          type: 'warning',
        });
        setShowAlert(true);
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
                setAlertConfig({
                  title: 'Flight Status Error',
                  message: 'Failed to fetch flight status. Please try again later.',
                  type: 'error',
                });
                setShowAlert(true);
              }
    } else {
      // Non-premium tier: Open FlightRadar24 in new tab
      const flightNumber = trip.flightNumber.trim().toUpperCase();
      const flightradar24Url = `https://www.flightradar24.com/data/flights/${encodeURIComponent(flightNumber)}`;
      window.open(flightradar24Url, '_blank', 'noopener,noreferrer');
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
    
    setTripsToDelete(Array.from(selectedTrips));
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDeleteMultiple) {
      onDeleteMultiple(tripsToDelete);
      setSelectedTrips(new Set());
    } else if (onDelete) {
      // Fallback to individual deletes
      tripsToDelete.forEach(tripId => onDelete(tripId));
      setSelectedTrips(new Set());
    }
    setShowDeleteConfirm(false);
    setTripsToDelete([]);
  };

  if (trips.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No Trips Scheduled"
        description="You don't have any trips scheduled yet. Create your first trip to get started managing transportation."
        actionLabel="Create New Trip"
        onAction={() => {
          // This will be handled by the parent component
          // For now, we'll trigger a custom event
          window.dispatchEvent(new CustomEvent('create-trip'));
        }}
      />
    );
  }

  return (
    <div className="trip-list">
      <TripFilters
        trips={trips}
        drivers={drivers}
        locations={locations}
        customers={customers}
        onFilterChange={handleFilterChange}
        onRefresh={onUpdate}
      />
      <div className="trip-list-header">
        <p className="trip-count">
          Showing {displayedTrips.length} of {trips.length} trips
        </p>
        {(onDeleteMultiple || onAssignMultiple || onBulkStatusUpdate || onExport) && (
          <div className="bulk-actions">
            {selectedTrips.size > 0 && (
              <>
                {onAssignMultiple && (
                  <button
                    className="btn btn-primary"
                    onClick={() => onAssignMultiple(Array.from(selectedTrips))}
                    title={`Assign ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''} to driver`}
                    aria-label={`Assign ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''} to driver`}
                  >
                    Assign ({selectedTrips.size})
                  </button>
                )}
                {onBulkStatusUpdate && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowStatusUpdateDialog(true)}
                    title={`Update status for ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''}`}
                    aria-label={`Update status for ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''}`}
                  >
                    Update Status ({selectedTrips.size})
                  </button>
                )}
                {onExport && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => onExport(Array.from(selectedTrips))}
                    title={`Export ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''} to CSV`}
                    aria-label={`Export ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''} to CSV`}
                  >
                    📥 Export ({selectedTrips.size})
                  </button>
                )}
                {onDeleteMultiple && (
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteSelected}
                    title={`Delete ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''}`}
                    aria-label={`Delete ${selectedTrips.size} selected trip${selectedTrips.size > 1 ? 's' : ''}`}
                  >
                    Delete Selected ({selectedTrips.size})
                  </button>
                )}
              </>
            )}
            {onExport && selectedTrips.size === 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => onExport()}
                title="Export all trips to CSV"
                aria-label="Export all trips to CSV"
              >
                📥 Export All
              </button>
            )}
          </div>
        )}
      </div>
      <div className="trips-table-wrapper">
        <table className="trips-table" role="table" aria-label="Trips list">
        <thead>
          <tr>
            {onDeleteMultiple && (
              <th>
                <input
                  type="checkbox"
                  checked={selectedTrips.size === displayedTrips.length && displayedTrips.length > 0}
                  onChange={handleSelectAll}
                  title="Select all"
                  aria-label="Select all trips"
                />
              </th>
            )}
            <th>Category</th>
            <th>Pickup<br />Date</th>
            <th>Pickup<br />Time</th>
            <th>Flight<br />Number</th>
            <th>Flight<br />Status</th>
            <th>Pickup<br />Location</th>
            <th>Dropoff<br />Location</th>
            <th>Passengers</th>
            <th>Customer</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Actual<br />Pickup</th>
            <th>Actual<br />Dropoff</th>
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
            <tr 
              key={trip.id} 
              className={selectedTrips.has(trip.id) ? 'selected' : ''}
              onClick={(e) => {
                // Don't trigger if clicking on checkbox, button, or link
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
                  return;
                }
                if (onEdit) {
                  onEdit(trip);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && !target.closest('button') && !target.closest('a')) {
                    if (onEdit) {
                      onEdit(trip);
                    }
                  }
                }
              }}
              style={{ cursor: onEdit ? 'pointer' : 'default' }}
              title={onEdit ? "Click to view/edit trip details" : "Trip details"}
              role="row"
              tabIndex={0}
              aria-label={`Trip ${trip.flightNumber || 'N/A'} on ${trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM dd, yyyy') : 'N/A'}. Click to edit.`}
            >
              {onDeleteMultiple && (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedTrips.has(trip.id)}
                    onChange={() => handleSelectTrip(trip.id)}
                  />
                </td>
              )}
              <td
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) {
                    onEdit(trip);
                  }
                }}
                style={{ cursor: onEdit ? 'pointer' : 'default', fontWeight: '500', color: onEdit ? '#3b82f6' : '#6b7280' }}
                title={onEdit ? "Click to view/edit trip" : "Trip category"}
              >
                {trip.primaryLocationCategory || trip.airport || 'N/A'}
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
                    className="btn btn-small btn-secondary flight-status-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckFlightStatus(trip);
                    }}
                    title={company?.subscriptionTier === 'premium' 
                      ? "Check flight status (may incur API costs)" 
                      : "Open FlightRadar24 to check flight status"}
                  >
                    Check Status
                  </button>
                )}
              </td>
              <td>{trip.pickupLocation}</td>
              <td>{trip.dropoffLocation}</td>
              <td className="passengers-cell">
                <span className="passengers-count" title={`${trip.numberOfPassengers} passenger${trip.numberOfPassengers !== 1 ? 's' : ''}`}>
                  👥 {trip.numberOfPassengers}
                </span>
              </td>
              <td>{getCustomerName(trip.customerId) || '-'}</td>
              <td>{getDriverName(trip.driverId)}</td>
              <td>
                <span className={`status-badge ${getStatusBadgeClass(trip.status || 'Unassigned')}`}>
                  {trip.status || 'Unassigned'}
                </span>
              </td>
              <td>
                {trip.actualPickupTime
                  ? format(new Date(trip.actualPickupTime), 'HH:mm')
                  : '-'}
              </td>
              <td>
                {trip.actualDropoffTime
                  ? format(new Date(trip.actualDropoffTime), 'HH:mm')
                  : '-'}
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
          <EmptyState
            icon="search"
            title="No Trips Found"
            description="No trips match your current filters. Try adjusting your search criteria or clear filters to see all trips."
          />
        ) : (
          displayedTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              className={`trip-card-mobile ${selectedTrips.has(trip.id) ? 'selected' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onClick={(e) => {
                // Don't trigger if clicking on checkbox, button, or link
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
                  return;
                }
                if (onEdit) {
                  onEdit(trip);
                }
              }}
              style={{ cursor: onEdit ? 'pointer' : 'default' }}
              title={onEdit ? "Click to view/edit trip details" : "Trip details"}
            >
              <div className="trip-card-header">
                <div className="trip-card-title">
                  {onDeleteMultiple && (
                    <input
                      type="checkbox"
                      className="trip-card-checkbox"
                      checked={selectedTrips.has(trip.id)}
                      onChange={() => handleSelectTrip(trip.id)}
                      onClick={(e) => e.stopPropagation()}
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
              </div>
              
              {(trip.primaryLocationCategory || trip.airport) && (
                <div 
                  className="trip-card-field"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) {
                      onEdit(trip);
                    }
                  }}
                  style={{ cursor: onEdit ? 'pointer' : 'default' }}
                  title={onEdit ? "Click to view/edit trip" : "Trip category"}
                >
                  <span className="trip-card-label">Category</span>
                  <span className="trip-card-value" style={{ color: '#3b82f6', fontWeight: '500' }}>
                    {trip.primaryLocationCategory || trip.airport}
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
                      title={company?.subscriptionTier === 'premium' 
                        ? "Check flight status (may incur API costs)" 
                        : "Open FlightRadar24 to check flight status"}
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
                <span className="trip-card-value passengers-count">👥 {trip.numberOfPassengers}</span>
              </div>
              
              <div className="trip-card-field">
                <span className="trip-card-label">Customer</span>
                <span className="trip-card-value">{getCustomerName(trip.customerId) || '-'}</span>
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
            </motion.div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title={`Delete ${tripsToDelete.length} Trip${tripsToDelete.length > 1 ? 's' : ''}?`}
        description={`Are you sure you want to delete ${tripsToDelete.length} selected trip${tripsToDelete.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Status Update Dialog */}
      {showStatusUpdateDialog && (
        <div className="modal-overlay" onClick={() => setShowStatusUpdateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Update Status for {selectedTrips.size} Trip{selectedTrips.size > 1 ? 's' : ''}</h3>
              <button className="close-btn" onClick={() => setShowStatusUpdateDialog(false)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Select new status for {selectedTrips.size} selected trip{selectedTrips.size > 1 ? 's' : ''}:
              </p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger style={{ width: '100%', marginBottom: '1.5rem' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowStatusUpdateDialog(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (onBulkStatusUpdate && selectedTrips.size > 0) {
                      onBulkStatusUpdate(Array.from(selectedTrips), newStatus);
                      setSelectedTrips(new Set());
                      setShowStatusUpdateDialog(false);
                    }
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}

export default TripList;
