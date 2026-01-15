import { useState, useMemo } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { extractAirlineCode, getAirlineName, groupTripsByAirline } from '../utils/airlineCode';
import { useNotification } from './Notification';
import './TripReports.css';

interface TripReportsProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  locations?: Array<Schema['Location']['type']>;
  onClose: () => void;
  onEdit?: (trip: Schema['Trip']['type']) => void;
}

type ViewMode = 'summary' | 'byStatus' | 'byAirline' | 'byLocation' | 'byDriver' | 'allTrips';

function TripReports({ trips, drivers, locations: _locations = [], onClose, onEdit }: TripReportsProps) {
  const { showNotification } = useNotification();
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Filter trips by date range and status
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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(trip => 
        trip.pickupLocation === selectedLocation || 
        trip.dropoffLocation === selectedLocation
      );
    }

    // Filter by airline
    if (selectedAirline) {
      filtered = filtered.filter(trip => {
        const airlineCode = extractAirlineCode(trip.flightNumber);
        return airlineCode === selectedAirline;
      });
    }

    // Filter by driver
    if (selectedDriverId) {
      filtered = filtered.filter(trip => trip.driverId === selectedDriverId);
    }

    return filtered;
  }, [trips, dateFilterStart, dateFilterEnd, statusFilter, selectedLocation, selectedAirline, selectedDriverId]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredTrips.length,
      unassigned: filteredTrips.filter(t => t.status === 'Unassigned').length,
      assigned: filteredTrips.filter(t => t.status === 'Assigned').length,
      inProgress: filteredTrips.filter(t => t.status === 'InProgress').length,
      completed: filteredTrips.filter(t => t.status === 'Completed').length,
      totalPassengers: filteredTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
      dateRange: {
        earliest: null as Date | null,
        latest: null as Date | null,
      },
    };

    // Calculate date range
    filteredTrips.forEach(trip => {
      if (trip.pickupDate) {
        const tripDate = new Date(trip.pickupDate);
        if (!stats.dateRange.earliest || tripDate < stats.dateRange.earliest) {
          stats.dateRange.earliest = tripDate;
        }
        if (!stats.dateRange.latest || tripDate > stats.dateRange.latest) {
          stats.dateRange.latest = tripDate;
        }
      }
    });

    return stats;
  }, [filteredTrips]);

  // Group trips by status
  const tripsByStatus = useMemo(() => {
    const grouped = new Map<string, Array<Schema['Trip']['type']>>();
    filteredTrips.forEach(trip => {
      const status = trip.status || 'Unassigned';
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(trip);
    });
    return grouped;
  }, [filteredTrips]);

  // Group trips by airline
  const tripsByAirline = useMemo(() => {
    return groupTripsByAirline(filteredTrips);
  }, [filteredTrips]);

  // Group trips by location
  const tripsByLocation = useMemo(() => {
    const pickupMap = new Map<string, Array<Schema['Trip']['type']>>();
    const dropoffMap = new Map<string, Array<Schema['Trip']['type']>>();
    const combinedMap = new Map<string, { pickup: number; dropoff: number; total: number }>();

    filteredTrips.forEach(trip => {
      // Pickup locations
      if (trip.pickupLocation) {
        if (!pickupMap.has(trip.pickupLocation)) {
          pickupMap.set(trip.pickupLocation, []);
        }
        pickupMap.get(trip.pickupLocation)!.push(trip);

        const current = combinedMap.get(trip.pickupLocation) || { pickup: 0, dropoff: 0, total: 0 };
        current.pickup++;
        current.total++;
        combinedMap.set(trip.pickupLocation, current);
      }

      // Dropoff locations
      if (trip.dropoffLocation) {
        if (!dropoffMap.has(trip.dropoffLocation)) {
          dropoffMap.set(trip.dropoffLocation, []);
        }
        dropoffMap.get(trip.dropoffLocation)!.push(trip);

        const current = combinedMap.get(trip.dropoffLocation) || { pickup: 0, dropoff: 0, total: 0 };
        current.dropoff++;
        current.total++;
        combinedMap.set(trip.dropoffLocation, current);
      }
    });

    return { pickupMap, dropoffMap, combinedMap };
  }, [filteredTrips]);

  // Group trips by driver
  const tripsByDriver = useMemo(() => {
    const grouped = new Map<string, Array<Schema['Trip']['type']>>();
    filteredTrips.forEach(trip => {
      const driverId = trip.driverId || '__unassigned__';
      if (!grouped.has(driverId)) {
        grouped.set(driverId, []);
      }
      grouped.get(driverId)!.push(trip);
    });
    return grouped;
  }, [filteredTrips]);

  const handleExport = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Total Trips', 'Value': statistics.total },
        { 'Metric': 'Unassigned', 'Value': statistics.unassigned },
        { 'Metric': 'Assigned', 'Value': statistics.assigned },
        { 'Metric': 'In Progress', 'Value': statistics.inProgress },
        { 'Metric': 'Completed', 'Value': statistics.completed },
        { 'Metric': 'Total Passengers', 'Value': statistics.totalPassengers },
        { 'Metric': 'Date Range Start', 'Value': statistics.dateRange.earliest ? format(statistics.dateRange.earliest, 'MMM d, yyyy') : '' },
        { 'Metric': 'Date Range End', 'Value': statistics.dateRange.latest ? format(statistics.dateRange.latest, 'MMM d, yyyy') : '' },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Trips by Status
      const statusData = Array.from(tripsByStatus.entries()).map(([status, trips]) => ({
        'Status': status,
        'Trip Count': trips.length,
        'Total Passengers': trips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
      }));
      const statusSheet = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'By Status');

      // Trips by Airline
      const airlineData = Array.from(tripsByAirline.entries())
        .map(([airlineCode, airlineTrips]) => ({
          'Airline': getAirlineName(airlineCode),
          'Airline Code': airlineCode,
          'Trip Count': airlineTrips.length,
          'Total Passengers': airlineTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
        }))
        .sort((a, b) => b['Trip Count'] - a['Trip Count']);
      const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
      XLSX.utils.book_append_sheet(workbook, airlineSheet, 'By Airline');

      // Trips by Location
      const locationData = Array.from(tripsByLocation.combinedMap.entries())
        .map(([location, counts]) => ({
          'Location': location,
          'Pickup Count': counts.pickup,
          'Dropoff Count': counts.dropoff,
          'Total Trips': counts.total,
        }))
        .sort((a, b) => b['Total Trips'] - a['Total Trips']);
      const locationSheet = XLSX.utils.json_to_sheet(locationData);
      XLSX.utils.book_append_sheet(workbook, locationSheet, 'By Location');

      // Trips by Driver
      const driverData = Array.from(tripsByDriver.entries())
        .map(([driverId, driverTrips]) => {
          const driver = driverId === '__unassigned__' 
            ? null 
            : drivers.find(d => d.id === driverId);
          return {
            'Driver': driver?.name || 'Unassigned',
            'Email': driver?.email || '',
            'Phone': driver?.phone || '',
            'Trip Count': driverTrips.length,
            'Completed': driverTrips.filter(t => t.status === 'Completed').length,
            'Total Passengers': driverTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
          };
        })
        .sort((a, b) => b['Trip Count'] - a['Trip Count']);
      const driverSheet = XLSX.utils.json_to_sheet(driverData);
      XLSX.utils.book_append_sheet(workbook, driverSheet, 'By Driver');

      // All Trips Detail
      const allTripsData = filteredTrips.map(trip => {
        const driver = trip.driverId ? drivers.find(d => d.id === trip.driverId) : null;
        return {
          'Pickup Date': trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : '',
          'Flight Number': trip.flightNumber || '',
          'Airline': getAirlineName(extractAirlineCode(trip.flightNumber)),
          'Pickup Location': trip.pickupLocation || '',
          'Dropoff Location': trip.dropoffLocation || '',
          'Passengers': trip.numberOfPassengers || 1,
          'Status': trip.status || 'Unassigned',
          'Driver': driver?.name || 'Unassigned',
          'Driver Email': driver?.email || '',
          'Driver Phone': driver?.phone || '',
          'Actual Pickup': trip.actualPickupTime ? format(new Date(trip.actualPickupTime), 'MMM d, yyyy HH:mm') : '',
          'Actual Dropoff': trip.actualDropoffTime ? format(new Date(trip.actualDropoffTime), 'MMM d, yyyy HH:mm') : '',
          'Category': trip.primaryLocationCategory || trip.airport || '',
        };
      });
      const allTripsSheet = XLSX.utils.json_to_sheet(allTripsData);
      XLSX.utils.book_append_sheet(workbook, allTripsSheet, 'All Trips');

      // Report Info
      const reportInfo = [
        { 'Field': 'Report Type', 'Value': 'Trip Reports' },
        { 'Field': 'Generated At', 'Value': new Date().toLocaleString() },
        { 'Field': 'Date Range Start', 'Value': dateFilterStart || 'All' },
        { 'Field': 'Date Range End', 'Value': dateFilterEnd || 'All' },
        { 'Field': 'Status Filter', 'Value': statusFilter === 'all' ? 'All' : statusFilter },
        { 'Field': 'Total Trips', 'Value': filteredTrips.length },
      ];
      const reportInfoSheet = XLSX.utils.json_to_sheet(reportInfo);
      XLSX.utils.book_append_sheet(workbook, reportInfoSheet, 'Report Info');

      // Generate Excel file
      const fileName = `trip-report-${dateStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showNotification('Report exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showNotification('Failed to export report', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setDateFilterStart('');
    setDateFilterEnd('');
    setStatusFilter('all');
    setSelectedLocation(null);
    setSelectedAirline(null);
    setSelectedDriverId(null);
  };

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    filteredTrips.forEach(trip => {
      if (trip.pickupLocation) locSet.add(trip.pickupLocation);
      if (trip.dropoffLocation) locSet.add(trip.dropoffLocation);
    });
    return Array.from(locSet).sort();
  }, [filteredTrips]);

  // Get unique airlines for filter dropdown
  const uniqueAirlines = useMemo(() => {
    const airlineSet = new Set<string>();
    filteredTrips.forEach(trip => {
      const airlineCode = extractAirlineCode(trip.flightNumber);
      if (airlineCode !== 'Unknown' && airlineCode !== 'Standard Trip') {
        airlineSet.add(airlineCode);
      }
    });
    return Array.from(airlineSet).sort();
  }, [filteredTrips]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content trip-reports" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Trip Reports</h2>
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
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Unassigned">Unassigned</option>
                <option value="Assigned">Assigned</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="location-filter">Location:</label>
              <select
                id="location-filter"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value || null)}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="airline-filter">Airline:</label>
              <select
                id="airline-filter"
                value={selectedAirline || ''}
                onChange={(e) => setSelectedAirline(e.target.value || null)}
              >
                <option value="">All Airlines</option>
                {uniqueAirlines.map(airline => (
                  <option key={airline} value={airline}>{getAirlineName(airline)}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="driver-filter">Driver:</label>
              <select
                id="driver-filter"
                value={selectedDriverId || ''}
                onChange={(e) => setSelectedDriverId(e.target.value || null)}
              >
                <option value="">All Drivers</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <div className="view-controls">
            <button
              className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('summary')}
            >
              Summary
            </button>
            <button
              className={`btn ${viewMode === 'byStatus' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('byStatus')}
            >
              By Status
            </button>
            <button
              className={`btn ${viewMode === 'byAirline' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('byAirline')}
            >
              By Airline
            </button>
            <button
              className={`btn ${viewMode === 'byLocation' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('byLocation')}
            >
              By Location
            </button>
            <button
              className={`btn ${viewMode === 'byDriver' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('byDriver')}
            >
              By Driver
            </button>
            <button
              className={`btn ${viewMode === 'allTrips' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('allTrips')}
            >
              All Trips
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              title="Export report as Excel (.xlsx)"
            >
              📥 Export Excel
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

        <div className="reports-content">
          <p className="report-info">
            Showing {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} 
            {dateFilterStart || dateFilterEnd || statusFilter !== 'all' || selectedLocation || selectedAirline || selectedDriverId ? ' (filtered)' : ''}
          </p>

          {viewMode === 'summary' && (
            <div className="summary-view">
              <h3>Trip Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{statistics.total}</div>
                  <div className="stat-label">Total Trips</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.assigned}</div>
                  <div className="stat-label">Assigned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.inProgress}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.unassigned}</div>
                  <div className="stat-label">Unassigned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.totalPassengers}</div>
                  <div className="stat-label">Total Passengers</div>
                </div>
              </div>
              {statistics.dateRange.earliest && statistics.dateRange.latest && (
                <div className="date-range-info">
                  <strong>Date Range:</strong> {format(statistics.dateRange.earliest, 'MMM d, yyyy')} - {format(statistics.dateRange.latest, 'MMM d, yyyy')}
                </div>
              )}
            </div>
          )}

          {viewMode === 'byStatus' && (
            <div className="view-section">
              <h3>Trips by Status</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Trip Count</th>
                      <th>Total Passengers</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(tripsByStatus.entries())
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([status, statusTrips]) => (
                        <tr key={status}>
                          <td>
                            <span className={`status-badge status-${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </td>
                          <td><strong>{statusTrips.length}</strong></td>
                          <td>{statusTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setStatusFilter(status);
                                setViewMode('allTrips');
                              }}
                            >
                              View Trips
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'byAirline' && (
            <div className="view-section">
              <h3>Trips by Airline</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Airline</th>
                      <th>Airline Code</th>
                      <th>Trip Count</th>
                      <th>Total Passengers</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(tripsByAirline.entries())
                      .map(([airlineCode, airlineTrips]) => ({
                        airlineCode,
                        airlineName: getAirlineName(airlineCode),
                        trips: airlineTrips,
                        count: airlineTrips.length,
                        passengers: airlineTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
                      }))
                      .sort((a, b) => b.count - a.count)
                      .map(({ airlineCode, airlineName, count, passengers }) => (
                        <tr key={airlineCode}>
                          <td><strong>{airlineName}</strong></td>
                          <td>{airlineCode}</td>
                          <td><strong>{count}</strong></td>
                          <td>{passengers}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSelectedAirline(airlineCode);
                                setViewMode('allTrips');
                              }}
                            >
                              View Trips
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'byLocation' && (
            <div className="view-section">
              <h3>Trips by Location</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Pickup Count</th>
                      <th>Dropoff Count</th>
                      <th>Total Trips</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(tripsByLocation.combinedMap.entries())
                      .map(([location, counts]) => ({
                        location,
                        ...counts,
                      }))
                      .sort((a, b) => b.total - a.total)
                      .map(({ location, pickup, dropoff, total }) => (
                        <tr key={location}>
                          <td><strong>{location}</strong></td>
                          <td>{pickup}</td>
                          <td>{dropoff}</td>
                          <td><strong>{total}</strong></td>
                          <td>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSelectedLocation(location);
                                setViewMode('allTrips');
                              }}
                            >
                              View Trips
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'byDriver' && (
            <div className="view-section">
              <h3>Trips by Driver</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Trip Count</th>
                      <th>Completed</th>
                      <th>Total Passengers</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(tripsByDriver.entries())
                      .map(([driverId, driverTrips]) => {
                        const driver = driverId === '__unassigned__' 
                          ? null 
                          : drivers.find(d => d.id === driverId);
                        return {
                          driverId,
                          driverName: driver?.name || 'Unassigned',
                          trips: driverTrips,
                          count: driverTrips.length,
                          completed: driverTrips.filter(t => t.status === 'Completed').length,
                          passengers: driverTrips.reduce((sum, t) => sum + (t.numberOfPassengers || 1), 0),
                        };
                      })
                      .sort((a, b) => b.count - a.count)
                      .map(({ driverId, driverName, count, completed, passengers }) => (
                        <tr key={driverId}>
                          <td><strong>{driverName}</strong></td>
                          <td><strong>{count}</strong></td>
                          <td>{completed}</td>
                          <td>{passengers}</td>
                          <td>
                            {driverId !== '__unassigned__' && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setSelectedDriverId(driverId);
                                  setViewMode('allTrips');
                                }}
                              >
                                View Trips
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'allTrips' && (
            <div className="view-section">
              <h3>All Trips</h3>
              {filteredTrips.length === 0 ? (
                <div className="empty-state">
                  <p>No trips found with the current filters.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table trips-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Flight Number</th>
                        <th>Airline</th>
                        <th>Pickup</th>
                        <th>Dropoff</th>
                        <th>Passengers</th>
                        <th>Driver</th>
                        <th>Status</th>
                        {onEdit && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrips
                        .sort((a, b) => {
                          const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
                          const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
                          return dateB - dateA; // Most recent first
                        })
                        .map(trip => {
                          const driver = trip.driverId ? drivers.find(d => d.id === trip.driverId) : null;
                          return (
                            <tr key={trip.id}>
                              <td>
                                {trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : 'N/A'}
                              </td>
                              <td>{trip.flightNumber}</td>
                              <td>{getAirlineName(extractAirlineCode(trip.flightNumber))}</td>
                              <td>{trip.pickupLocation}</td>
                              <td>{trip.dropoffLocation}</td>
                              <td>{trip.numberOfPassengers || 1}</td>
                              <td>{driver?.name || 'Unassigned'}</td>
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
    </div>
  );
}

export default TripReports;
