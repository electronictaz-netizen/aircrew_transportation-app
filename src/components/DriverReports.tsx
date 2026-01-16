import { useState, useMemo } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { extractAirlineCode, getAirlineName, groupTripsByAirline } from '../utils/airlineCode';
import { 
  calculateTripDuration, 
  calculateTotalHoursWorked, 
  calculateDriverPay,
  calculateTotalDriverPay,
  calculateTotalRevenue,
  formatDuration,
  formatCurrency
} from '../utils/tripCalculations';
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
  totalHoursWorked: number;
  totalDriverPay: number;
  totalRevenue: number;
  profit: number;
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
          totalHoursWorked: 0,
          totalDriverPay: 0,
          totalRevenue: 0,
          profit: 0,
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
          totalHoursWorked: 0,
          totalDriverPay: 0,
          totalRevenue: 0,
          profit: 0,
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

    // Calculate financial and time data for each driver
    Array.from(stats.values()).forEach(stat => {
      if (stat.driverId === '__unassigned__') return;
      
      const driverTrips = filteredTrips.filter(t => t.driverId === stat.driverId);
      
      // Calculate hours worked
      stat.totalHoursWorked = calculateTotalHoursWorked(driverTrips);
      
      // Calculate total driver pay
      stat.totalDriverPay = calculateTotalDriverPay(driverTrips, drivers);
      
      // Calculate total revenue
      stat.totalRevenue = calculateTotalRevenue(driverTrips);
      
      // Calculate profit
      stat.profit = stat.totalRevenue - stat.totalDriverPay;
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
      const workbook = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];

      if (viewMode === 'summary') {
        // Summary sheet with driver statistics
        const summaryData = driverStats.map(stat => {
          const airlineBreakdown = Array.from(stat.tripsByAirline.entries())
            .map(([airline, count]) => `${getAirlineName(airline)}: ${count}`)
            .join('; ');
          
          return {
            'Driver Name': stat.driverName,
            'Total Trips': stat.totalTrips,
            'Completed Trips': stat.completedTrips,
            'Assigned': stat.assignedTrips,
            'In Progress': stat.inProgressTrips,
            'Unassigned': stat.unassignedTrips,
            'Total Hours Worked': stat.totalHoursWorked.toFixed(2),
            'Total Driver Pay': formatCurrency(stat.totalDriverPay),
            'Total Revenue': formatCurrency(stat.totalRevenue),
            'Profit': formatCurrency(stat.profit),
            'Trips by Airline': airlineBreakdown,
            'Date Range Start': stat.dateRange.earliest ? format(stat.dateRange.earliest, 'MMM d, yyyy') : '',
            'Date Range End': stat.dateRange.latest ? format(stat.dateRange.latest, 'MMM d, yyyy') : '',
          };
        });

        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Driver Summary');

        // Add metadata sheet
        const completedTrips = filteredTrips.filter(t => t.status === 'Completed');
        const totalHours = calculateTotalHoursWorked(completedTrips);
        const totalPay = calculateTotalDriverPay(completedTrips, drivers);
        const totalRevenue = calculateTotalRevenue(completedTrips);
        
        const metadata = [
          { 'Report Type': 'Driver Summary Report' },
          { 'Generated At': new Date().toLocaleString() },
          { 'Date Range Start': dateFilterStart || 'All' },
          { 'Date Range End': dateFilterEnd || 'All' },
          { 'Total Trips': filteredTrips.length },
          { 'Completed Trips': completedTrips.length },
          { 'Total Hours Worked': `${totalHours.toFixed(2)} hours` },
          { 'Total Driver Pay': formatCurrency(totalPay) },
          { 'Total Revenue': formatCurrency(totalRevenue) },
          { 'Total Profit': formatCurrency(totalRevenue - totalPay) },
        ];
        const metadataSheet = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Report Info');

      } else if (viewMode === 'driver' && selectedDriverId) {
        const driver = drivers.find(d => d.id === selectedDriverId);
        const driverStat = driverStats.find(s => s.driverId === selectedDriverId);

        // Driver info sheet
        const driverInfo = [
          { 'Field': 'Driver Name', 'Value': driver?.name || 'Unknown' },
          { 'Field': 'Email', 'Value': driver?.email || '' },
          { 'Field': 'Phone', 'Value': driver?.phone || '' },
          { 'Field': 'License Number', 'Value': driver?.licenseNumber || '' },
          { 'Field': 'Pay Rate Per Trip', 'Value': formatCurrency(driver?.payRatePerTrip) },
          { 'Field': 'Pay Rate Per Hour', 'Value': formatCurrency(driver?.payRatePerHour) },
          { 'Field': 'Total Trips', 'Value': driverStat?.totalTrips || 0 },
          { 'Field': 'Completed Trips', 'Value': driverStat?.completedTrips || 0 },
          { 'Field': 'Assigned Trips', 'Value': driverStat?.assignedTrips || 0 },
          { 'Field': 'In Progress Trips', 'Value': driverStat?.inProgressTrips || 0 },
          { 'Field': 'Unassigned Trips', 'Value': driverStat?.unassignedTrips || 0 },
          { 'Field': 'Total Hours Worked', 'Value': driverStat ? `${driverStat.totalHoursWorked.toFixed(2)} hours` : '0 hours' },
          { 'Field': 'Total Driver Pay', 'Value': formatCurrency(driverStat?.totalDriverPay) },
          { 'Field': 'Total Revenue', 'Value': formatCurrency(driverStat?.totalRevenue) },
          { 'Field': 'Profit', 'Value': formatCurrency(driverStat?.profit) },
        ];
        const driverInfoSheet = XLSX.utils.json_to_sheet(driverInfo);
        XLSX.utils.book_append_sheet(workbook, driverInfoSheet, 'Driver Info');

        // Trips sheet with detailed financial and time data
        const tripsData = selectedDriverTrips.map(trip => {
          const duration = calculateTripDuration(trip);
          const pay = calculateDriverPay(trip, driver || null);
          
          return {
            'Trip ID': trip.id,
            'Pickup Date': trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : '',
            'Flight Number': trip.flightNumber || '',
            'Airline': getAirlineName(extractAirlineCode(trip.flightNumber)),
            'Pickup Location': trip.pickupLocation || '',
            'Dropoff Location': trip.dropoffLocation || '',
            'Passengers': trip.numberOfPassengers || 1,
            'Status': trip.status || 'Unassigned',
            'Scheduled Pickup': trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : '',
            'Actual Pickup': trip.actualPickupTime ? format(new Date(trip.actualPickupTime), 'MMM d, yyyy HH:mm') : '',
            'Actual Dropoff': trip.actualDropoffTime ? format(new Date(trip.actualDropoffTime), 'MMM d, yyyy HH:mm') : '',
            'Trip Duration (Hours)': duration !== null ? duration.toFixed(2) : 'N/A',
            'Trip Duration (HH:MM)': formatDuration(duration),
            'Trip Rate': formatCurrency(trip.tripRate),
            'Driver Pay': formatCurrency(pay),
            'Notes': trip.notes || '',
          };
        });

        const tripsSheet = XLSX.utils.json_to_sheet(tripsData);
        XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');

        // Airline breakdown sheet with financial data
        const airlineBreakdown = Array.from(tripsByAirline.entries())
          .map(([airlineCode, airlineTrips]) => {
            const completedTrips = airlineTrips.filter(t => t.status === 'Completed');
            const totalHours = calculateTotalHoursWorked(completedTrips);
            const totalPay = calculateTotalDriverPay(completedTrips, drivers);
            const totalRevenue = calculateTotalRevenue(completedTrips);
            
            return {
              'Airline': getAirlineName(airlineCode),
              'Airline Code': airlineCode,
              'Trip Count': airlineTrips.length,
              'Completed Trips': completedTrips.length,
              'Total Hours': totalHours.toFixed(2),
              'Total Driver Pay': formatCurrency(totalPay),
              'Total Revenue': formatCurrency(totalRevenue),
              'Profit': formatCurrency(totalRevenue - totalPay),
            };
          })
          .sort((a, b) => b['Trip Count'] - a['Trip Count']);

        const airlineSheet = XLSX.utils.json_to_sheet(airlineBreakdown);
        XLSX.utils.book_append_sheet(workbook, airlineSheet, 'By Airline');

      } else if (viewMode === 'airline' && selectedAirline) {
        // Airline info sheet
        const airlineInfo = [
          { 'Field': 'Airline Code', 'Value': selectedAirline },
          { 'Field': 'Airline Name', 'Value': getAirlineName(selectedAirline) },
          { 'Field': 'Total Trips', 'Value': airlineTrips.length },
        ];
        const airlineInfoSheet = XLSX.utils.json_to_sheet(airlineInfo);
        XLSX.utils.book_append_sheet(workbook, airlineInfoSheet, 'Airline Info');

        // Trips sheet with detailed data
        const tripsData = airlineTrips.map(trip => {
          const driver = drivers.find(d => d.id === trip.driverId);
          const duration = calculateTripDuration(trip);
          const pay = calculateDriverPay(trip, driver || null);
          
          return {
            'Trip ID': trip.id,
            'Pickup Date': trip.pickupDate ? format(new Date(trip.pickupDate), 'MMM d, yyyy HH:mm') : '',
            'Flight Number': trip.flightNumber || '',
            'Driver': driver?.name || 'Unassigned',
            'Driver Email': driver?.email || '',
            'Driver Phone': driver?.phone || '',
            'Pickup Location': trip.pickupLocation || '',
            'Dropoff Location': trip.dropoffLocation || '',
            'Passengers': trip.numberOfPassengers || 1,
            'Status': trip.status || 'Unassigned',
            'Actual Pickup': trip.actualPickupTime ? format(new Date(trip.actualPickupTime), 'MMM d, yyyy HH:mm') : '',
            'Actual Dropoff': trip.actualDropoffTime ? format(new Date(trip.actualDropoffTime), 'MMM d, yyyy HH:mm') : '',
            'Trip Duration (Hours)': duration !== null ? duration.toFixed(2) : 'N/A',
            'Trip Rate': formatCurrency(trip.tripRate),
            'Driver Pay': formatCurrency(pay),
            'Notes': trip.notes || '',
          };
        });

        const tripsSheet = XLSX.utils.json_to_sheet(tripsData);
        XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');
      }

      // Generate Excel file
      const fileName = `driver-report-${dateStr}.xlsx`;
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
                      <th>Hours<br />Worked</th>
                      <th>Driver Pay</th>
                      <th>Revenue</th>
                      <th>Profit</th>
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
                        <td>{stat.totalHoursWorked.toFixed(2)}</td>
                        <td>{formatCurrency(stat.totalDriverPay)}</td>
                        <td>{formatCurrency(stat.totalRevenue)}</td>
                        <td>{formatCurrency(stat.profit)}</td>
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
                      {calculateTotalHoursWorked(selectedDriverTrips.filter(t => t.status === 'Completed')).toFixed(1)}
                    </div>
                    <div className="stat-label">Hours Worked</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {formatCurrency(calculateTotalDriverPay(selectedDriverTrips, drivers))}
                    </div>
                    <div className="stat-label">Total Pay</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {formatCurrency(calculateTotalRevenue(selectedDriverTrips))}
                    </div>
                    <div className="stat-label">Total Revenue</div>
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
                          <th>Flight<br />Number</th>
                          <th>Airline</th>
                          <th>Pickup</th>
                          <th>Dropoff</th>
                          <th>Passengers</th>
                          <th>Duration</th>
                          <th>Trip Rate</th>
                          <th>Driver Pay</th>
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
                              <td>{formatDuration(calculateTripDuration(trip))}</td>
                              <td>{formatCurrency(trip.tripRate)}</td>
                              <td>{formatCurrency(calculateDriverPay(trip, selectedDriver || null))}</td>
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
                      <th>Flight<br />Number</th>
                      <th>Driver</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Passengers</th>
                      <th>Duration</th>
                      <th>Trip Rate</th>
                      <th>Driver Pay</th>
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
                            <td>{formatDuration(calculateTripDuration(trip))}</td>
                            <td>{formatCurrency(trip.tripRate)}</td>
                            <td>{formatCurrency(calculateDriverPay(trip, driver || null))}</td>
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
