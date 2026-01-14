import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import './TripFilters.css';

const client = generateClient<Schema>();

interface TripFiltersProps {
  trips: Array<Schema['Trip']['type']>;
  drivers: Array<Schema['Driver']['type']>;
  onFilterChange: (filteredTrips: Array<Schema['Trip']['type']>) => void;
  onRefresh?: () => void;
}

type SortField = 'pickupDate' | 'flightNumber' | 'status' | 'driver' | 'none';
type SortDirection = 'asc' | 'desc';
type QuickDateFilter = 'all' | 'today' | 'thisWeek' | 'nextWeek' | 'custom';

function TripFilters({ trips, drivers, onFilterChange, onRefresh }: TripFiltersProps) {
  const { companyId } = useCompany();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({}); // Dynamic filters by category name
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('pickupDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterCategories, setFilterCategories] = useState<Array<Schema['FilterCategory']['type']>>([]);

  // Load filter categories
  useEffect(() => {
    if (companyId) {
      loadFilterCategories();
    }
  }, [companyId]);

  const loadFilterCategories = async () => {
    if (!companyId) return;
    
    try {
      const { data } = await client.models.FilterCategory.list({
        filter: { 
          companyId: { eq: companyId },
          isActive: { eq: true }
        },
      });
      setFilterCategories((data || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (error) {
      console.error('Error loading filter categories:', error);
    }
  };

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
    console.log('TripFilters: Starting with', trips.length, 'trips');
    // Filter out any trips that might have been deleted (safety check)
    // This shouldn't be necessary if trips are properly refreshed, but it's a safeguard
    const validTrips = trips.filter(trip => trip && trip.id);
    console.log('TripFilters: Valid trips after filtering deleted:', validTrips.length);
    
    // Create a copy with original index to maintain stable sort
    let filtered = validTrips.map((trip, index) => ({ trip, originalIndex: index }));
    console.log('TripFilters: After initial copy:', filtered.length);

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.trip.status === statusFilter);
    }

    // Driver filter
    if (driverFilter !== 'all') {
      if (driverFilter === 'unassigned') {
        filtered = filtered.filter((item) => !item.trip.driverId);
      } else {
        filtered = filtered.filter((item) => item.trip.driverId === driverFilter);
      }
    }

    // Recurring filter - by default show all (including recurring)
    if (recurringFilter !== 'all') {
      if (recurringFilter === 'recurring') {
        filtered = filtered.filter((item) => item.trip.isRecurring === true);
      } else if (recurringFilter === 'one-time') {
        filtered = filtered.filter((item) => !item.trip.isRecurring);
      }
    }

    // Dynamic custom filters based on FilterCategories
    for (const category of filterCategories) {
      const filterValue = customFilters[category.name];
      if (filterValue && filterValue !== 'all') {
        try {
          let values: string[] = [];
          if (category.values) {
            try {
              values = JSON.parse(category.values);
            } catch {
              // If not JSON, treat as comma-separated
              values = category.values.split(',').map(v => v.trim());
            }
          }
          
          // Filter based on the category's field
          if (category.field === 'locationCategory' || category.field === 'primaryLocationCategory') {
            // Get locations with this category
            filtered = filtered.filter((item) => {
              const trip = item.trip;
              // Check primaryLocationCategory first, then fall back to airport for backward compatibility
              const categoryValue = trip.primaryLocationCategory || trip.airport || '';
              return categoryValue === filterValue;
            });
          } else if (category.field === 'pickupLocation') {
            filtered = filtered.filter((item) => item.trip.pickupLocation === filterValue);
          } else if (category.field === 'dropoffLocation') {
            filtered = filtered.filter((item) => item.trip.dropoffLocation === filterValue);
          }
        } catch (error) {
          console.error(`Error applying filter for category ${category.name}:`, error);
        }
      }
    }
    
    // Legacy airport filter (for backward compatibility)
    const legacyAirportFilter = customFilters['Airports'] || 'all';
    if (legacyAirportFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const trip = item.trip;
        return trip.airport === legacyAirportFilter || trip.primaryLocationCategory === legacyAirportFilter;
      });
    }

    // Date filter - use quick filter or custom date range
    if (quickDateFilter !== 'all' && quickDateFilter !== 'custom') {
      const dateRange = getDateRange(quickDateFilter);
      if (dateRange.from && dateRange.to) {
        const fromDate = dateRange.from;
        const toDate = dateRange.to;
        filtered = filtered.filter((item) => {
          const trip = item.trip;
          if (!trip.pickupDate) return false;
          const tripDate = new Date(trip.pickupDate);
          // Compare dates at start of day for accurate filtering
          const tripDateStart = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
          const fromStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
          const toStart = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
          return tripDateStart >= fromStart && tripDateStart <= toStart;
        });
      }
    } else if (quickDateFilter === 'custom') {
      // Use custom date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0); // Start of day
        filtered = filtered.filter((item) => {
          const trip = item.trip;
          if (!trip.pickupDate) return false;
          const tripDate = new Date(trip.pickupDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate >= fromDate;
        });
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date
        filtered = filtered.filter((item) => {
          const trip = item.trip;
          if (!trip.pickupDate) return false;
          const tripDate = new Date(trip.pickupDate);
          return tripDate <= toDate;
        });
      }
    }
    // If quickDateFilter is 'all', show all trips (no date filtering)
    console.log('TripFilters: After date filtering:', filtered.length);

    // Search filter (flight number, locations)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) => {
          const trip = item.trip;
          return trip.flightNumber?.toLowerCase().includes(search) ||
            trip.pickupLocation?.toLowerCase().includes(search) ||
            trip.dropoffLocation?.toLowerCase().includes(search);
        }
      );
    }

    console.log('TripFilters: After search filtering:', filtered.length);

    // Sorting - Always sort by pickupDate by default if sortField is 'none' or not set
    const effectiveSortField = sortField === 'none' ? 'pickupDate' : sortField;
    if (effectiveSortField) {
      filtered.sort((a, b) => {
        const tripA = a.trip;
        const tripB = b.trip;
        let aValue: any;
        let bValue: any;

        switch (effectiveSortField) {
          case 'pickupDate':
            // Handle missing dates - put them at the end
            if (!tripA.pickupDate && !tripB.pickupDate) {
              // If both missing, maintain original order for stable sort
              return a.originalIndex - b.originalIndex;
            }
            if (!tripA.pickupDate) return 1; // a goes to end
            if (!tripB.pickupDate) return -1; // b goes to end
            // Both have dates, compare them
            // Ensure dates are parsed correctly and handle invalid dates
            const dateA = new Date(tripA.pickupDate);
            const dateB = new Date(tripB.pickupDate);
            
            // Check for invalid dates
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
              return a.originalIndex - b.originalIndex;
            }
            if (isNaN(dateA.getTime())) return 1; // Invalid date goes to end
            if (isNaN(dateB.getTime())) return -1; // Invalid date goes to end
            
            // Sort by date first (ignoring time)
            const dateOnlyA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
            const dateOnlyB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
            const dateComparison = dateOnlyA.getTime() - dateOnlyB.getTime();
            
            // If dates are the same, sort by time
            if (dateComparison === 0) {
              // Extract time components (hours and minutes)
              const timeA = dateA.getHours() * 60 + dateA.getMinutes();
              const timeB = dateB.getHours() * 60 + dateB.getMinutes();
              const timeComparison = timeA - timeB;
              
              // If times are also the same, maintain original order
              if (timeComparison === 0) {
                return a.originalIndex - b.originalIndex;
              }
              
              // Return time comparison (will be multiplied by sortDirection later)
              aValue = timeA;
              bValue = timeB;
            } else {
              // Return date comparison (will be multiplied by sortDirection later)
              aValue = dateOnlyA.getTime();
              bValue = dateOnlyB.getTime();
            }
            break;
          case 'flightNumber':
            aValue = tripA.flightNumber || '';
            bValue = tripB.flightNumber || '';
            break;
          case 'status':
            aValue = tripA.status || 'Unassigned';
            bValue = tripB.status || 'Unassigned';
            break;
          case 'driver':
            const getDriverName = (driverId: string | null | undefined) => {
              if (!driverId) return 'Unassigned';
              const driver = drivers.find((d) => d.id === driverId);
              return driver?.name || 'Unknown';
            };
            aValue = getDriverName(tripA.driverId);
            bValue = getDriverName(tripB.driverId);
            break;
          default:
            return a.originalIndex - b.originalIndex;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const result = sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
          // If strings are equal, maintain original order for stable sort
          if (result === 0) {
            return a.originalIndex - b.originalIndex;
          }
          return result;
        } else {
          // For numbers (including dates as timestamps)
          const result = sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          // If values are equal, maintain original order for stable sort
          if (result === 0) {
            return a.originalIndex - b.originalIndex;
          }
          return result;
        }
      });
    }
    
    // Extract trips from the filtered array
    const finalTrips = filtered.map(item => item.trip);

    console.log('TripFilters: Final filtered trips:', finalTrips.length);
    console.log('TripFilters: Final trip dates (sorted):', finalTrips.map(t => ({
      id: t.id,
      date: t.pickupDate,
      dateParsed: t.pickupDate ? new Date(t.pickupDate).toISOString() : 'N/A',
      dateTime: t.pickupDate ? new Date(t.pickupDate).getTime() : 0,
      flight: t.flightNumber,
      isRecurring: t.isRecurring,
      parentId: t.parentTripId
    })));
    
    // Verify sorting is correct
    if (effectiveSortField === 'pickupDate' && finalTrips.length > 1) {
      const dates = finalTrips.map(t => t.pickupDate ? new Date(t.pickupDate).getTime() : 0);
      const isSorted = dates.every((date, i) => i === 0 || dates[i - 1] <= date);
      console.log('TripFilters: Sorting verification:', {
        isSorted,
        firstDate: finalTrips[0]?.pickupDate,
        lastDate: finalTrips[finalTrips.length - 1]?.pickupDate,
        sortField: effectiveSortField,
        sortDirection
      });
    }
    
    onFilterChange(finalTrips);
  };

  // Track previous quickDateFilter to detect filter changes
  const prevQuickDateFilterRef = useRef<QuickDateFilter>(quickDateFilter);
  
  // Apply filters on mount and when any filter or trips change
  useEffect(() => {
    // If quick date filter changed, refresh trips to ensure we have latest data
    if (prevQuickDateFilterRef.current !== quickDateFilter && onRefresh) {
      console.log('Quick date filter changed, refreshing trips...');
      onRefresh();
      prevQuickDateFilterRef.current = quickDateFilter;
      // Wait a bit for refresh to complete, then apply filters
      setTimeout(() => {
        applyFiltersAndSort();
      }, 300);
    } else {
      applyFiltersAndSort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, statusFilter, driverFilter, recurringFilter, customFilters, quickDateFilter, dateFrom, dateTo, searchTerm, sortField, sortDirection, filterCategories]);

  const handleFilterChange = () => {
    applyFiltersAndSort();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDriverFilter('all');
    setRecurringFilter('all');
    setCustomFilters({});
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
    // Always ensure sorting by pickup date when filter changes
    setSortField('pickupDate');
    setSortDirection('asc');
    if (filter !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    driverFilter !== 'all' ||
    recurringFilter !== 'all' ||
    Object.values(customFilters).some(v => v !== 'all') ||
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

      {/* Dynamic Custom Filters */}
      {filterCategories.map((category) => {
        // Get filter values for this category
        let values: string[] = [];
        try {
          if (category.values) {
            values = JSON.parse(category.values);
            if (!Array.isArray(values)) {
              values = category.values.split(',').map(v => v.trim()).filter(v => v);
            }
          } else {
            // Auto-generate from trips if no values specified
            // This would require loading locations, so for now we'll use empty array
            values = [];
          }
        } catch {
          values = category.values ? category.values.split(',').map(v => v.trim()).filter(v => v) : [];
        }

        const currentFilter = customFilters[category.name] || 'all';

        return (
          <div key={category.id} className="custom-filters">
            <label className="quick-filters-label">{category.name}:</label>
            <div className="quick-filter-buttons">
              <button
                className={`quick-filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setCustomFilters(prev => ({ ...prev, [category.name]: 'all' }));
                  setSortField('pickupDate');
                  setSortDirection('asc');
                }}
              >
                All {category.name}
              </button>
              {values.length > 0 ? (
                values.map((value) => (
                  <button
                    key={value}
                    className={`quick-filter-btn ${currentFilter === value ? 'active' : ''}`}
                    onClick={() => {
                      setCustomFilters(prev => ({ ...prev, [category.name]: value }));
                      setSortField('pickupDate');
                      setSortDirection('asc');
                    }}
                  >
                    {value}
                  </button>
                ))
              ) : (
                // If no values specified, show a message or auto-generate from trips
                <span style={{ fontSize: '0.875rem', color: '#6b7280', padding: '0.5rem' }}>
                  Configure values in Filter Categories
                </span>
              )}
            </div>
          </div>
        );
      })}

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
                  setSortField('pickupDate');
                  setSortDirection('asc');
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
                  setSortField('pickupDate');
                  setSortDirection('asc');
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
                  setSortField('pickupDate');
                  setSortDirection('asc');
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
