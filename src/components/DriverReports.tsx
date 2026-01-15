import { useState, useEffect, useMemo } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { extractAirlineCode, getAirlineName, groupTripsByAirline } from '../utils/airlineCode';
import { useNotification } from './Notification';
import './DriverReports.css';

interface DriverReportsProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  onClose: () => void;
  onEdit?: (trip: Schema['Trip']['type']) => void;
}

interface DriverStats {
  driverId: string;
  driverName: string;
  totalTrips: number;
  completedTrips: number;
  assignedTrips: number;
  inProgressTrips: number;
  unassignedTrips: number;
  tripsByAirline: Map<string, number>;
  dateRange: { earliest: Date | null; latest: Date | null };
}

type ViewMode = 'summary' | 'driver' | 'airline';

function DriverReports({ trips, drivers, onClose, onEdit }: DriverReportsProps) {
  const { showNotification } = useNotification();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  // Filter trips by date range
  const filteredTrips = useMemo(() => {
    let filtered = trips;

    // Filter by date range
    if (dateFilterStart) {
      const startDate = new Date(dateFilterStart);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(trip => {
        if (!trip.pickupDate) return false;
        const tripDate = new Date(trip.pickupDate);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= startDate;
      });
    }

    if (dateFilterEnd) {
      const endDate = new Date(dateFilterEnd);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(trip => {
        if (!trip.pickupDate) return false;
        const tripDate = new Date(trip.pickupDate);
        return tripDate <= endDate;
      });
    }

    // Filter by completion status
    if (showCompletedOnly) {
      filtered = filtered.filter(trip => trip.status === 'Completed');
    }

    return filtered;
  }, [trips, dateFilterStart, dateFilterEnd, showCompletedOnly]);

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    const stats = new Map<string, DriverStats>();

    filteredTrips.forEach(trip => {
      if (!trip.driverId) {
        // Handle unassigned trips
        const unassignedKey = '__unassigned__';
        if (!stats.has(unassignedKey)) {
          stats.set(unassignedKey, {
            driverId: unassignedKey,
            driverName: 'Unassigned',
            totalTrips: 0,
            completedTrips: 0,
            assignedTrips: 0,
            inProgressTrips: 0,
            unassignedTrips: 0,
            tripsByAirline: new Map(),
            dateRange: { earliest: null, latest: null },
          });
        }
        const stat = stats.get(unassignedKey)!;
        stat.totalTrips++;
        stat.unassignedTrips++;
        updateAirlineCount(stat, trip);
        updateDateRange(stat, trip);
        return;
      }

      if (!stats.has(trip.driverId)) {
        const driver = drivers.find(d => d.id === trip.driverId);
        stats.set(trip.driverId, {
          driverId: trip.driverId,
          driverName: driver?.name || 'Unknown Driver',
          totalTrips: 0,
          completedTrips: 0,
          assignedTrips: 0,
          inProgressTrips: 0,
          unassignedTrips: 0,
          tripsByAirline: new Map(),
          dateRange: { earliest: null, latest: null },
        });
      }

      const stat = stats.get(trip.driverId)!;
      stat.totalTrips++;

      // Count by status
      switch (trip.status) {
        case 'Completed':
          stat.completedTrips++;
          break;
        case 'Assigned':
          stat.assignedTrips++;
          break;
        case 'InProgress':
          stat.inProgressTrips++;
          break;
        case 'Unassigned':
          stat.unassignedTrips++;
          break;
      }

      updateAirlineCount(stat, trip);
      updateDateRange(stat, trip);
    });

    return Array.from(stats.values()).sort((a, b) => {
      // Sort unassigned to bottom
      if (a.driverId === '__unassigned__') return 1;
      if (b.driverId === '__unassigned__') return -1;
      // Sort by total trips descending
      return b.totalTrips - a.totalTrips;
    });
  }, [filteredTrips, drivers]);

  function updateAirlineCount(stat: DriverStats, trip: Schema['Trip']['type']) {
    const airlineCode = extractAirlineCode(trip.flightNumber);
    const currentCount = stat.tripsByAirline.get(airlineCode) || 0;
    stat.tripsByAirline.set(airlineCode, currentCount + 1);
  }

  function updateDateRange(stat: DriverStats, trip: Schema['Trip']['type']) {
    if (!trip.pickupDate) return;
    const tripDate = new Date(trip.pickupDate);
    
    if (!stat.dateRange.earliest || tripDate < stat.dateRange.earliest) {
      stat.dateRange.earliest = tripDate;
    }
    if (!stat.dateRange.latest || tripDate > stat.dateRange.latest) {
      stat.dateRange.latest = tripDate;
    }
  }

  // Get trips for selected driver
  const selectedDriverTrips = useMemo(() => {
    if (!selectedDriverId) return [];
    return filteredTrips.filter(trip => trip.driverId === selectedDriverId);
  }, [filteredTrips, selectedDriverId]);

  // Get trips grouped by airline for selected driver
  const tripsByAirline = useMemo(() => {
    return groupTripsByAirline(selectedDriverTrips);
  }, [selectedDriverTrips]);

  // Get all trips for selected airline (across all drivers)
  const airlineTrips = useMemo(() => {
    if (!selectedAirline) return [];
    return filteredTrips.filter(trip => {
      const airlineCode = extractAirlineCode(trip.flightNumber);
      return airlineCode === selectedAirline;
    });
  }, [filteredTrips, selectedAirline]);

  const handleDriverSelect = (driverId: string | null) => {
    setSelectedDriverId(driverId);
    setSelectedAirline(null);
    setViewMode('driver');
  };

  const handleAirlineSelect = (airlineCode: string) => {
    setSelectedAirline(airlineCode);
    setViewMode('airline');
  };

  const handleExport = () => {
    try {
      let exportData: any = {};

      if (viewMode === 'summary') {
        exportData = {
          reportType: 'Driver Summary Report',
          generatedAt: new Date().toISOString(),
          dateRange: {
            start: dateFilterStart || 'All',
            end: dateFilterEnd || 'All',
          },
          drivers: driverStats.map(stat => ({
            driverName: stat.driverName,
            totalTrips: stat.totalTrips,
            completedTrips: stat.completedTrips,
            assignedTrips: stat.assignedTrips,
            inProgressTrips: stat.inProgressTrips,
            tripsByAirline: Object.fromEntries(stat.tripsByAirline),
          })),
        };
      } else if (viewMode === 'driver' && selectedDriverId) {
        const driver = drivers.find(d => d.id === selectedDriverId);
        exportData = {
          reportType: 'Driver Detail Report',
          generatedAt: new Date().toISOString(),
          driver: {
            name: driver?.name || 'Unknown',
            email: driver?.email || '',
            phone: driver?.phone || '',
          },
          statistics: driverStats.find(s => s.driverId === selectedDriverId),
          trips: selectedDriverTrips.map(trip => ({
            pickupDate: trip.pickupDate,
            flightNumber: trip.flightNumber,
            airline: extractAirlineCode(trip.flightNumber),
            pickupLocation: trip.pickupLocation,
            dropoffLocation: trip.dropoffLocation,
            status: trip.status,
            numberOfPassengers: trip.numberOfPassengers,
          })),
        };
      } else if (viewMode === 'airline' && selectedAirline) {
        exportData = {
          reportType: 'Airline Report',
          generatedAt: new Date().toISOString(),
          airline: {
            code: selectedAirline,
            name: getAirlineName(selectedAirline),
          },
          trips: airlineTrips.map(trip => ({
            pickupDate: trip.pickupDate,
            flightNumber: trip.flightNumber,
            driver: drivers.find(d => d.id === trip.driverId)?.name || 'Unassigned',
            pickupLocation: trip.pickupLocation,
            dropoffLocation: trip.dropoffLocation,
            status: trip.status,
            numberOfPassengers: trip.numberOfPassengers,
          })),
        };
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `driver-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('Report exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showNotification('Failed to export report', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedDriver = selectedDriverId ? drivers.find(d => d.id === selectedDriverId) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content driver-reports" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Driver Reports</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="reports-controls">
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="date-start">Start Date:</label>
              <input
                type="date"
                id="date-start"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="date-end">End Date:</label>
              <input
                type="date"
                id="date-end"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={showCompletedOnly}
                  onChange={(e) => setShowCompletedOnly(e.target.checked)}
                />
                Completed Only
              </label>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDateFilterStart('');
                setDateFilterEnd('');
                setShowCompletedOnly(false);
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className="view-controls">
            <button
              className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setViewMode('summary');
                setSelectedDriverId(null);
                setSelectedAirline(null);
              }}
            >
              Summary
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              title="Export report as JSON"
            >
              📥 Export
            </button>
            <button
              className="btn btn-secondary"
              onClick={handlePrint}
              title="Print report"
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {viewMode === 'summary' && (
          <div className="reports-content">
            <h3>Driver Summary</h3>
            <p className="report-info">
              Showing {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} 
              {dateFilterStart || dateFilterEnd ? ' (filtered)' : ''}
            </p>
            
            {driverStats.length === 0 ? (
              <div className="empty-state">
                <p>No trips found for the selected filters.</p>
              </div>
            ) : (
              <div className="driver-stats-table-wrapper">
                <table className="driver-stats-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Total Trips</th>
                      <th>Completed</th>
                      <th>Assigned</th>
                      <th>In Progress</th>
                      <th>Unassigned</th>
                      <th>Trips by Airline</th>
                      <th>Date Range</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverStats.map((stat) => (
                      <tr key={stat.driverId}>
                        <td>
                          <strong>{stat.driverName}</strong>
                          {stat.driverId === '__unassigned__' && (
                            <span className="badge badge-secondary">Unassigned</span>
                          )}
                        </td>
                        <td><strong>{stat.totalTrips}</strong></td>
                        <td>{stat.completedTrips}</td>
                        <td>{stat.assignedTrips}</td>
                        <td>{stat.inProgressTrips}</td>
                        <td>{stat.unassignedTrips}</td>
                        <td>
                          <div className="airline-breakdown">
                            {Array.from(stat.tripsByAirline.entries())
                              .sort((a, b) => b[1] - a[1])
                              .map(([airline, count]) => (
                                <span key={airline} className="airline-tag">
                                  {getAirlineName(airline)}: {count}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td>
                          {stat.dateRange.earliest && stat.dateRange.latest ? (
                            <span>
                              {format(stat.dateRange.earliest, 'MMM d, yyyy')} - {format(stat.dateRange.latest, 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          {stat.driverId !== '__unassigned__' && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleDriverSelect(stat.driverId)}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewMode === 'driver' && selectedDriverId && (
          <div className="reports-content">
            <div className="report-header">
              <div>
                <h3>Driver Details: {selectedDriver?.name || 'Unknown'}</h3>
                <p className="driver-info">
                  {selectedDriver?.email && <span>Email: {selectedDriver.email}</span>}
                  {selectedDriver?.phone && <span>Phone: {selectedDriver.phone}</span>}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setViewMode('summary');
                  setSelectedDriverId(null);
                }}
              >
                ← Back to Summary
              </button>
            </div>

            {selectedDriverTrips.length === 0 ? (
              <div className="empty-state">
                <p>No trips found for this driver with the current filters.</p>
              </div>
            ) : (
              <>
                <div className="driver-summary-stats">
                  <div className="stat-card">
                    <div className="stat-value">{selectedDriverTrips.length}</div>
                    <div className="stat-label">Total Trips</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {selectedDriverTrips.filter(t => t.status === 'Completed').length}
                    </div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {tripsByAirline.size}
                    </div>
                    <div className="stat-label">Airlines</div>
                  </div>
                </div>

                <div className="airline-breakdown-section">
                  <h4>Trips by Airline</h4>
                  <div className="airline-list">
                    {Array.from(tripsByAirline.entries())
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([airlineCode, airlineTrips]) => (
                        <div key={airlineCode} className="airline-card">
                          <div className="airline-header">
                            <span className="airline-name">{getAirlineName(airlineCode)}</span>
                            <span className="airline-count">{airlineTrips.length} trip{airlineTrips.length !== 1 ? 's' : ''}</span>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleAirlineSelect(airlineCode)}
                            >
                              View All
                            </button>
                          </div>
                          <div className="airline-trips-preview">
                            {airlineTrips.slice(0, 5).map(trip => (
                              <div key={trip.id} className="trip-preview">
                                <span className="trip-flight">{trip.flightNumber}</span>
                                <span className="trip-date">
                                  {trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy') : 'N/A'}
                                </span>
                                <span className={`trip-status status-${trip.status?.toLowerCase()}`}>
                                  {trip.status}
                                </span>
                                {onEdit && (
                                  <button
                                    className="btn-icon btn-edit"
                                    onClick={() => onEdit(trip)}
                                    title="Edit trip"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            ))}
                            {airlineTrips.length > 5 && (
                              <div className="more-trips">
                                + {airlineTrips.length - 5} more trip{airlineTrips.length - 5 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="all-trips-section">
                  <h4>All Trips</h4>
                  <div className="trips-list-table-wrapper">
                    <table className="trips-list-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Flight Number</th>
                          <th>Airline</th>
                          <th>Pickup</th>
                          <th>Dropoff</th>
                          <th>Passengers</th>
                          <th>Status</th>
                          {onEdit && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDriverTrips
                          .sort((a, b) => {
                            const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
                            const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
                            return dateB - dateA; // Most recent first
                          })
                          .map(trip => (
                            <tr key={trip.id}>
                              <td>
                                {trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : 'N/A'}
                              </td>
                              <td>{trip.flightNumber}</td>
                              <td>{getAirlineName(extractAirlineCode(trip.flightNumber))}</td>
                              <td>{trip.pickupLocation}</td>
                              <td>{trip.dropoffLocation}</td>
                              <td>{trip.numberOfPassengers || 1}</td>
                              <td>
                                <span className={`status-badge status-${trip.status?.toLowerCase()}`}>
                                  {trip.status || 'Unassigned'}
                                </span>
                              </td>
                              {onEdit && (
                                <td>
                                  <button
                                    className="btn-icon btn-edit"
                                    onClick={() => onEdit(trip)}
                                    title="Edit trip"
                                  >
                                    ✏️
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {viewMode === 'airline' && selectedAirline && (
          <div className="reports-content">
            <div className="report-header">
              <div>
                <h3>Airline Report: {getAirlineName(selectedAirline)}</h3>
                <p className="report-info">
                  {airlineTrips.length} trip{airlineTrips.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setViewMode('summary');
                  setSelectedAirline(null);
                }}
              >
                ← Back to Summary
              </button>
            </div>

            {airlineTrips.length === 0 ? (
              <div className="empty-state">
                <p>No trips found for this airline with the current filters.</p>
              </div>
            ) : (
              <div className="trips-list-table-wrapper">
                <table className="trips-list-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Flight Number</th>
                      <th>Driver</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Passengers</th>
                      <th>Status</th>
                      {onEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {airlineTrips
                      .sort((a, b) => {
                        const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
                        const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
                        return dateB - dateA; // Most recent first
                      })
                      .map(trip => {
                        const driver = drivers.find(d => d.id === trip.driverId);
                        return (
                          <tr key={trip.id}>
                            <td>
                              {trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : 'N/A'}
                            </td>
                            <td>{trip.flightNumber}</td>
                            <td>{driver?.name || 'Unassigned'}</td>
                            <td>{trip.pickupLocation}</td>
                            <td>{trip.dropoffLocation}</td>
                            <td>{trip.numberOfPassengers || 1}</td>
                            <td>
                              <span className={`status-badge status-${trip.status?.toLowerCase()}`}>
                                {trip.status || 'Unassigned'}
                              </span>
                            </td>
                            {onEdit && (
                              <td>
                                <button
                                  className="btn-icon btn-edit"
                                  onClick={() => onEdit(trip)}
                                  title="Edit trip"
                                >
                                  ✏️
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverReports;
