import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';
import './TripFilters.css';

interface TripFiltersProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  onFilterChange: (filteredTrips: Array<Schema['Trip']['type']>) => void;
}

type SortField = 'pickupDate' | 'flightNumber' | 'status' | 'driver' | 'none';
type SortDirection = 'asc' | 'desc';
type QuickDateFilter = 'all' | 'today' | 'thisWeek' | 'nextWeek' | 'custom';

function TripFilters({ trips, drivers, onFilterChange }: TripFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('pickupDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Calculate date ranges for quick filters
  const getDateRange = (filter: QuickDateFilter): { from: Date | null; to: Date | null } => {
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return {
          from: startOfDay(now),
          to: endOfDay(now),
        };
      case 'thisWeek':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          to: endOfWeek(now, { weekStartsOn: 1 }), // Sunday
        };
      case 'nextWeek':
        const nextWeekStart = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
        const nextWeekEnd = addWeeks(endOfWeek(now, { weekStartsOn: 1 }), 1);
        return {
          from: nextWeekStart,
          to: nextWeekEnd,
        };
      case 'custom':
        return {
          from: dateFrom ? new Date(dateFrom) : null,
          to: dateTo ? new Date(dateTo) : null,
        };
      case 'all':
      default:
        return { from: null, to: null };
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...trips];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }

    // Driver filter
    if (driverFilter !== 'all') {
      if (driverFilter === 'unassigned') {
        filtered = filtered.filter((trip) => !trip.driverId);
      } else {
        filtered = filtered.filter((trip) => trip.driverId === driverFilter);
      }
    }

    // Recurring filter - by default show all (including recurring)
    if (recurringFilter !== 'all') {
      if (recurringFilter === 'recurring') {
        filtered = filtered.filter((trip) => trip.isRecurring === true);
      } else if (recurringFilter === 'one-time') {
        filtered = filtered.filter((trip) => !trip.isRecurring);
      }
    }

    // Date filter - use quick filter or custom date range
    if (quickDateFilter !== 'all' && quickDateFilter !== 'custom') {
      const dateRange = getDateRange(quickDateFilter);
      if (dateRange.from && dateRange.to) {
        filtered = filtered.filter((trip) => {
          if (!trip.pickupDate) return false;
          const tripDate = new Date(trip.pickupDate);
          return tripDate >= dateRange.from! && tripDate <= dateRange.to!;
        });
      }
    } else if (quickDateFilter === 'custom') {
      // Use custom date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter((trip) => {
          if (!trip.pickupDate) return false;
          return new Date(trip.pickupDate) >= fromDate;
        });
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date
        filtered = filtered.filter((trip) => {
          if (!trip.pickupDate) return false;
          return new Date(trip.pickupDate) <= toDate;
        });
      }
    }
    // If quickDateFilter is 'all', show all trips (no date filtering)

    // Search filter (flight number, locations)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.flightNumber?.toLowerCase().includes(search) ||
          trip.pickupLocation?.toLowerCase().includes(search) ||
          trip.dropoffLocation?.toLowerCase().includes(search)
      );
    }

    // Sorting
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'pickupDate':
            aValue = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
            bValue = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
            break;
          case 'flightNumber':
            aValue = a.flightNumber || '';
            bValue = b.flightNumber || '';
            break;
          case 'status':
            aValue = a.status || 'Unassigned';
            bValue = b.status || 'Unassigned';
            break;
          case 'driver':
            const getDriverName = (driverId: string | null | undefined) => {
              if (!driverId) return 'Unassigned';
              const driver = drivers.find((d) => d.id === driverId);
              return driver?.name || 'Unknown';
            };
            aValue = getDriverName(a.driverId);
            bValue = getDriverName(b.driverId);
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
    }

    onFilterChange(filtered);
  };

  // Apply filters on mount and when any filter or trips change
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, statusFilter, driverFilter, recurringFilter, quickDateFilter, dateFrom, dateTo, searchTerm, sortField, sortDirection]);

  const handleFilterChange = () => {
    applyFiltersAndSort();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDriverFilter('all');
    setRecurringFilter('all');
    setQuickDateFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setSortField('pickupDate');
    setSortDirection('asc');
    setTimeout(() => applyFiltersAndSort(), 0);
  };

  const handleQuickDateFilter = (filter: QuickDateFilter) => {
    setQuickDateFilter(filter);
    if (filter !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    driverFilter !== 'all' ||
    recurringFilter !== 'all' ||
    quickDateFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    searchTerm !== '';

  return (
    <div className="trip-filters">
      <div className="filters-header">
        <div className="filters-search">
          <input
            type="text"
            placeholder="Search by flight number, pickup, or dropoff location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTimeout(handleFilterChange, 0);
            }}
            className="search-input"
          />
        </div>
        <div className="filters-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
          {hasActiveFilters && (
            <button className="btn btn-link" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="quick-date-filters">
        <label className="quick-filters-label">View:</label>
        <div className="quick-filter-buttons">
          <button
            className={`quick-filter-btn ${quickDateFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleQuickDateFilter('all')}
          >
            All Trips
          </button>
          <button
            className={`quick-filter-btn ${quickDateFilter === 'today' ? 'active' : ''}`}
            onClick={() => handleQuickDateFilter('today')}
          >
            Today
          </button>
          <button
            className={`quick-filter-btn ${quickDateFilter === 'thisWeek' ? 'active' : ''}`}
            onClick={() => handleQuickDateFilter('thisWeek')}
          >
            This Week
          </button>
          <button
            className={`quick-filter-btn ${quickDateFilter === 'nextWeek' ? 'active' : ''}`}
            onClick={() => handleQuickDateFilter('nextWeek')}
          >
            Next Week
          </button>
          <button
            className={`quick-filter-btn ${quickDateFilter === 'custom' ? 'active' : ''}`}
            onClick={() => handleQuickDateFilter('custom')}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Show custom date inputs when custom range is selected */}
      {quickDateFilter === 'custom' && (
        <div className="custom-date-range">
          <div className="filter-group">
            <label htmlFor="dateFrom">From Date</label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange();
              }}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="dateTo">To Date</label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange();
              }}
            />
          </div>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="all">All Statuses</option>
                <option value="Unassigned">Unassigned</option>
                <option value="Assigned">Assigned</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="driverFilter">Driver</label>
              <select
                id="driverFilter"
                value={driverFilter}
                onChange={(e) => {
                  setDriverFilter(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="all">All Drivers</option>
                <option value="unassigned">Unassigned</option>
                {drivers
                  .filter((d) => d.isActive)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="recurringFilter">Job Type</label>
              <select
                id="recurringFilter"
                value={recurringFilter}
                onChange={(e) => {
                  setRecurringFilter(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="all">All Jobs</option>
                <option value="recurring">Recurring Only</option>
                <option value="one-time">One-Time Only</option>
              </select>
            </div>

          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="sortField">Sort By</label>
              <select
                id="sortField"
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as SortField);
                  handleFilterChange();
                }}
              >
                <option value="none">No Sorting</option>
                <option value="pickupDate">Pickup Date</option>
                <option value="flightNumber">Flight Number</option>
                <option value="status">Status</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            {sortField !== 'none' && (
              <div className="filter-group">
                <label htmlFor="sortDirection">Direction</label>
                <select
                  id="sortDirection"
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.target.value as SortDirection);
                    handleFilterChange();
                  }}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TripFilters;
