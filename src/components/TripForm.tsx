import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { validateFlightNumber, validateLocation, validatePassengers, validateFutureDate, validateRecurringEndDate, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { formatCoordinates } from '../utils/gpsLocation';
import { reverseGeocode } from '../utils/reverseGeocoding';
import { renderCustomFieldInput, validateCustomFieldValue } from '../utils/customFields.tsx';
import './TripForm.css';

const client = generateClient<Schema>();

interface TripFormProps {
  trip?: Schema['Trip']['type'] | null;
  drivers: Array<Schema['Driver']['type']>;
  locations?: Array<Schema['Location']['type']>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function TripForm({ trip, drivers, locations = [], onSubmit, onCancel }: TripFormProps) {
  const { companyId } = useCompany();
  const { notification, showError, hideNotification } = useNotification();
  
  // Filter locations to ensure only locations for the current company are shown
  // This is a defensive measure to prevent cross-company data leakage
  const companyLocations = companyId ? locations.filter(l => l.companyId === companyId) : locations;
  
  // Get active locations grouped by category
  const activeLocations = companyLocations.filter(l => l.isActive !== false);
  const locationsByCategory = activeLocations.reduce((acc, loc) => {
    const category = loc.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(loc);
    return acc;
  }, {} as Record<string, typeof activeLocations>);

  // Determine trip type based on existing flight number format
  // If it looks like a flight number (e.g., AA1234, UA123), assume Airport Trip
  // Otherwise, assume Standard Trip (for backward compatibility, default to Airport Trip if empty)
  const getInitialTripType = (flightNumber: string | undefined): 'Airport Trip' | 'Standard Trip' => {
    if (!flightNumber) return 'Airport Trip'; // Default for new trips
    // Simple heuristic: if it matches flight number pattern, it's an airport trip
    // Otherwise, it's a standard trip
    const flightNumberPattern = /^[A-Z]{2,3}\d{1,4}[A-Z]?$/i;
    return flightNumberPattern.test(flightNumber.trim()) ? 'Airport Trip' : 'Standard Trip';
  };

  const initialTripType = trip?.flightNumber ? getInitialTripType(trip.flightNumber) : 'Airport Trip';
  const isInitialAirportTrip = initialTripType === 'Airport Trip';

  const [formData, setFormData] = useState({
    tripType: initialTripType,
    primaryLocationCategory: trip?.primaryLocationCategory || trip?.airport || '',
    pickupDate: trip?.pickupDate ? format(new Date(trip.pickupDate), "yyyy-MM-dd'T'HH:mm") : '',
    flightNumber: isInitialAirportTrip ? (trip?.flightNumber || '') : '',
    standardTripIdentifier: !isInitialAirportTrip ? (trip?.flightNumber || '') : '',
    pickupLocation: trip?.pickupLocation || '',
    dropoffLocation: trip?.dropoffLocation || '',
    numberOfPassengers: trip?.numberOfPassengers || 1,
    driverId: trip?.driverId || '',
    status: trip?.status || 'Unassigned',
    isRecurring: trip?.isRecurring || !!trip?.parentTripId || false,
    recurringPattern: trip?.recurringPattern || 'weekly',
    recurringEndDate: trip?.recurringEndDate ? format(new Date(trip.recurringEndDate), "yyyy-MM-dd'T'HH:mm") : '',
    tripRate: trip?.tripRate !== null && trip?.tripRate !== undefined ? String(trip.tripRate) : '',
    driverPayAmount: trip?.driverPayAmount !== null && trip?.driverPayAmount !== undefined ? String(trip.driverPayAmount) : '',
    notes: trip?.notes || '',
  });
  
  const [passengerInput, setPassengerInput] = useState(String(formData.numberOfPassengers));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<Array<Schema['CustomField']['type']>>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(true);
  
  // GPS address states
  const [pickupAddress, setPickupAddress] = useState<string | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<string | null>(null);
  const [loadingPickupAddress, setLoadingPickupAddress] = useState(false);
  const [loadingDropoffAddress, setLoadingDropoffAddress] = useState(false);

  // Load custom fields for trips
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!companyId) return;
      
      try {
        setLoadingCustomFields(true);
        const { data: fieldsData } = await client.models.CustomField.list({
          filter: {
            companyId: { eq: companyId },
            entityType: { eq: 'Trip' },
            isActive: { eq: true },
          },
        });
        const sortedFields = (fieldsData || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCustomFields(sortedFields);
        
        // Initialize custom field values with defaults
        const initialValues: Record<string, string> = {};
        sortedFields.forEach((field) => {
          initialValues[field.id] = field.defaultValue || '';
        });
        setCustomFieldValues(initialValues);
      } catch (error) {
        logger.error('Error loading custom fields:', error);
      } finally {
        setLoadingCustomFields(false);
      }
    };
    
    loadCustomFields();
  }, [companyId]);

  // Load existing custom field values when editing a trip
  useEffect(() => {
    const loadExistingValues = async () => {
      if (!trip?.id || !companyId || customFields.length === 0) return;
      
      try {
        const { data: valuesData } = await client.models.CustomFieldValue.list({
          filter: {
            companyId: { eq: companyId },
            tripId: { eq: trip.id },
            entityType: { eq: 'Trip' },
          },
        });
        
        const existingValues: Record<string, string> = { ...customFieldValues };
        (valuesData || []).forEach((value) => {
          if (value.customFieldId) {
            existingValues[value.customFieldId] = value.value || '';
          }
        });
        setCustomFieldValues(existingValues);
      } catch (error) {
        logger.error('Error loading custom field values:', error);
      }
    };
    
    loadExistingValues();
  }, [trip?.id, companyId, customFields.length]);

  // Load addresses for GPS coordinates when trip is loaded or changes
  useEffect(() => {
    const loadAddresses = async () => {
      // Load pickup address
      if (trip?.startLocationLat && trip?.startLocationLng) {
        setLoadingPickupAddress(true);
        const result = await reverseGeocode(trip.startLocationLat, trip.startLocationLng);
        if (result.success && result.address) {
          setPickupAddress(result.address);
        } else {
          setPickupAddress(null);
        }
        setLoadingPickupAddress(false);
      } else {
        setPickupAddress(null);
      }

      // Load dropoff address
      if (trip?.completeLocationLat && trip?.completeLocationLng) {
        setLoadingDropoffAddress(true);
        const result = await reverseGeocode(trip.completeLocationLat, trip.completeLocationLng);
        if (result.success && result.address) {
          setDropoffAddress(result.address);
        } else {
          setDropoffAddress(null);
        }
        setLoadingDropoffAddress(false);
      } else {
        setDropoffAddress(null);
      }
    };

    loadAddresses();
  }, [trip?.startLocationLat, trip?.startLocationLng, trip?.completeLocationLat, trip?.completeLocationLng]);
  
  // Initialize location modes based on whether current values match saved locations
  const getInitialLocationMode = (location: string): 'text' | 'location' => {
    const savedLocationNames = activeLocations.map(l => l.name);
    if (savedLocationNames.includes(location)) return 'location';
    return 'text';
  };
  
  const [pickupLocationMode, setPickupLocationMode] = useState<'text' | 'location'>(() => 
    getInitialLocationMode(formData.pickupLocation)
  );
  const [dropoffLocationMode, setDropoffLocationMode] = useState<'text' | 'location'>(() => 
    getInitialLocationMode(formData.dropoffLocation)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    // Validate pickup date
    if (!formData.pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    } else {
      const dateValidation = validateFutureDate(formData.pickupDate);
      if (!dateValidation.isValid) {
        newErrors.pickupDate = dateValidation.error || 'Invalid pickup date';
      }
    }
    
    // Validate flight number or standard trip identifier based on trip type
    if (formData.tripType === 'Airport Trip') {
      const flightValidation = validateFlightNumber(formData.flightNumber);
      if (!flightValidation.isValid) {
        newErrors.flightNumber = flightValidation.error || 'Invalid flight number';
      }
    } else {
      // Standard Trip: just check that something is entered
      if (!formData.standardTripIdentifier || formData.standardTripIdentifier.trim() === '') {
        newErrors.standardTripIdentifier = 'Job number, PO number, or identifier is required';
      }
    }
    
    // Validate pickup location
    const pickupValidation = validateLocation(formData.pickupLocation);
    if (!pickupValidation.isValid) {
      newErrors.pickupLocation = pickupValidation.error || 'Invalid pickup location';
    }
    
    // Validate dropoff location
    const dropoffValidation = validateLocation(formData.dropoffLocation);
    if (!dropoffValidation.isValid) {
      newErrors.dropoffLocation = dropoffValidation.error || 'Invalid dropoff location';
    }
    
    // Validate passengers
    const passengerValidation = validatePassengers(formData.numberOfPassengers);
    if (!passengerValidation.isValid) {
      newErrors.numberOfPassengers = passengerValidation.error || 'Invalid passenger count';
    }
    
    // Validate recurring job fields if recurring is checked
    if (formData.isRecurring) {
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = 'Recurring end date is required';
      } else {
        const endDateValidation = validateRecurringEndDate(formData.pickupDate, formData.recurringEndDate);
        if (!endDateValidation.isValid) {
          newErrors.recurringEndDate = endDateValidation.error || 'Invalid recurring end date';
        }
      }
    }
    
    // Validate custom fields
    customFields.forEach((field) => {
      const value = customFieldValues[field.id] || '';
      const validation = validateCustomFieldValue(field, value);
      if (!validation.isValid) {
        newErrors[`custom_${field.id}`] = validation.error || '';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fix the errors in the form');
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      // Determine primary location category from pickup location
      let primaryCategory = '';
      if (pickupLocationMode === 'location') {
        const selectedLocation = activeLocations.find(l => l.name === formData.pickupLocation);
        primaryCategory = selectedLocation?.category || '';
      }
      
      // Sanitize inputs
      const pickupValidation = validateLocation(formData.pickupLocation);
      const dropoffValidation = validateLocation(formData.dropoffLocation);
      const passengerValidation = validatePassengers(formData.numberOfPassengers);
      
      // Get the identifier value based on trip type
      let identifierValue: string;
      if (formData.tripType === 'Airport Trip') {
        const flightValidation = validateFlightNumber(formData.flightNumber);
        identifierValue = flightValidation.sanitized;
      } else {
        // Standard Trip: use the standard trip identifier, trimmed
        identifierValue = formData.standardTripIdentifier.trim();
      }
      
      const submitData: any = {
        primaryLocationCategory: primaryCategory || undefined,
        airport: primaryCategory || undefined, // Keep for backward compatibility (use category if available)
        pickupDate: new Date(formData.pickupDate).toISOString(),
        flightNumber: identifierValue, // Store in flightNumber field regardless of trip type
        pickupLocation: pickupValidation.sanitized,
        dropoffLocation: dropoffValidation.sanitized,
        numberOfPassengers: passengerValidation.value,
        driverId: formData.driverId || undefined,
        status: formData.driverId ? 'Assigned' : 'Unassigned',
        isRecurring: formData.isRecurring === true,
        tripRate: formData.tripRate ? parseFloat(formData.tripRate) : undefined,
        driverPayAmount: formData.driverPayAmount ? parseFloat(formData.driverPayAmount) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      // Only include recurring fields if it's a recurring job
      if (formData.isRecurring) {
        submitData.recurringPattern = formData.recurringPattern;
        if (formData.recurringEndDate) {
          submitData.recurringEndDate = new Date(formData.recurringEndDate).toISOString();
        }
      } else {
        // Explicitly clear recurring fields when not recurring
        submitData.recurringPattern = undefined;
        submitData.recurringEndDate = undefined;
        submitData.parentTripId = undefined;
      }

      // Add custom field values to submit data
      submitData.customFieldValues = customFieldValues;
      
      logger.debug('TripForm submitting data:', submitData);
      await onSubmit(submitData);
      
      // Custom field values are now saved in the parent component (ManagementDashboard)
      // No need to save them here anymore
    } catch (error) {
      logger.error('Error preparing trip data:', error);
      showError('Error preparing trip data. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // numberOfPassengers is handled separately in its own onChange
    if (name === 'numberOfPassengers') {
      return; // Skip, handled by custom onChange
    }
    
    // Trip type is handled separately in its own onChange
    if (name === 'tripType') {
      return; // Skip, handled by custom onChange
    }
    
    // If location is selected, update primary category
    if (name === 'pickupLocation' && pickupLocationMode === 'location') {
      const selectedLocation = activeLocations.find((l: Schema['Location']['type']) => l.name === value);
      if (selectedLocation?.category) {
        setFormData((prev) => ({
          ...prev,
          pickupLocation: value,
          primaryLocationCategory: selectedLocation.category || '',
        }));
        return;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{trip ? 'Edit Trip' : 'Create New Trip'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pickupDate">Pickup Date and Time *</label>
            <input
              type="datetime-local"
              id="pickupDate"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={(e) => {
                handleChange(e);
                if (errors.pickupDate) setErrors({ ...errors, pickupDate: '' });
              }}
              required
              aria-invalid={!!errors.pickupDate}
              aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
            />
            {errors.pickupDate && <span id="pickupDate-error" className="error-message" role="alert">{errors.pickupDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tripType">Trip Type *</label>
            <select
              id="tripType"
              name="tripType"
              value={formData.tripType}
              onChange={(e) => {
                const newTripType = e.target.value as 'Airport Trip' | 'Standard Trip';
                setFormData((prev) => ({
                  ...prev,
                  tripType: newTripType,
                  // Clear the other field when switching types
                  flightNumber: newTripType === 'Airport Trip' ? prev.flightNumber : '',
                  standardTripIdentifier: newTripType === 'Standard Trip' ? prev.standardTripIdentifier : '',
                }));
                // Clear errors when switching
                setErrors({});
              }}
              required
            >
              <option value="Airport Trip">Airport Trip</option>
              <option value="Standard Trip">Standard Trip</option>
            </select>
          </div>

          {formData.tripType === 'Airport Trip' ? (
            <div className="form-group">
              <label htmlFor="flightNumber">Flight Number *</label>
              <input
                type="text"
                id="flightNumber"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.flightNumber) setErrors({ ...errors, flightNumber: '' });
                }}
                required
                placeholder="e.g., AA1234"
                maxLength={MAX_LENGTHS.FLIGHT_NUMBER}
                aria-invalid={!!errors.flightNumber}
                aria-describedby={errors.flightNumber ? 'flightNumber-error' : undefined}
              />
              {errors.flightNumber && <span id="flightNumber-error" className="error-message" role="alert">{errors.flightNumber}</span>}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="standardTripIdentifier">Job Number / PO Number / Identifier *</label>
              <input
                type="text"
                id="standardTripIdentifier"
                name="standardTripIdentifier"
                value={formData.standardTripIdentifier}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.standardTripIdentifier) setErrors({ ...errors, standardTripIdentifier: '' });
                }}
                required
                placeholder="Enter job number, PO number, or any identifier"
                maxLength={MAX_LENGTHS.FLIGHT_NUMBER} // Use same max length as flight number
                aria-invalid={!!errors.standardTripIdentifier}
                aria-describedby={errors.standardTripIdentifier ? 'standardTripIdentifier-error' : undefined}
              />
              {errors.standardTripIdentifier && <span id="standardTripIdentifier-error" className="error-message" role="alert">{errors.standardTripIdentifier}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="pickupLocation">Pickup Location *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setPickupLocationMode('location');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: pickupLocationMode === 'location' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: pickupLocationMode === 'location' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                disabled={activeLocations.length === 0}
                title={activeLocations.length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
              >
                Use Saved Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickupLocationMode('text');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: pickupLocationMode === 'text' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: pickupLocationMode === 'text' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Enter Text
              </button>
            </div>
            {pickupLocationMode === 'location' ? (
              <select
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: '' });
                }}
                required
                aria-invalid={!!errors.pickupLocation}
                aria-describedby={errors.pickupLocation ? 'pickupLocation-error' : undefined}
              >
                <option value="">Select Saved Location</option>
                {Object.entries(locationsByCategory).map(([category, locs]) => (
                  <optgroup key={category} label={category || 'Uncategorized'}>
                    {(locs as typeof activeLocations).map((location: Schema['Location']['type']) => (
                      <option key={location.id} value={location.name}>
                        {location.name}{location.address ? ` - ${location.address}` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: '' });
                }}
                required
                placeholder="Enter pickup location"
                maxLength={MAX_LENGTHS.LOCATION}
                aria-invalid={!!errors.pickupLocation}
                aria-describedby={errors.pickupLocation ? 'pickupLocation-error' : undefined}
              />
            )}
            {errors.pickupLocation && <span id="pickupLocation-error" className="error-message" role="alert">{errors.pickupLocation}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="dropoffLocation">Dropoff Location *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setDropoffLocationMode('location');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: dropoffLocationMode === 'location' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: dropoffLocationMode === 'location' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                disabled={activeLocations.length === 0}
                title={activeLocations.length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
              >
                Use Saved Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setDropoffLocationMode('text');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: dropoffLocationMode === 'text' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: dropoffLocationMode === 'text' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Enter Text
              </button>
            </div>
            {dropoffLocationMode === 'location' ? (
              <select
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.dropoffLocation) setErrors({ ...errors, dropoffLocation: '' });
                }}
                required
                aria-invalid={!!errors.dropoffLocation}
                aria-describedby={errors.dropoffLocation ? 'dropoffLocation-error' : undefined}
              >
                <option value="">Select Saved Location</option>
                {Object.entries(locationsByCategory).map(([category, locs]) => (
                  <optgroup key={category} label={category || 'Uncategorized'}>
                    {(locs as typeof activeLocations).map((location: Schema['Location']['type']) => (
                      <option key={location.id} value={location.name}>
                        {location.name}{location.address ? ` - ${location.address}` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.dropoffLocation) setErrors({ ...errors, dropoffLocation: '' });
                }}
                required
                placeholder="Enter dropoff location"
                maxLength={MAX_LENGTHS.LOCATION}
                aria-invalid={!!errors.dropoffLocation}
                aria-describedby={errors.dropoffLocation ? 'dropoffLocation-error' : undefined}
              />
            )}
            {errors.dropoffLocation && <span id="dropoffLocation-error" className="error-message" role="alert">{errors.dropoffLocation}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="numberOfPassengers">Number of Passengers</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="numberOfPassengers"
              name="numberOfPassengers"
              value={passengerInput}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string for typing, or valid numbers
                if (value === '' || /^\d+$/.test(value)) {
                  setPassengerInput(value);
                  // Update formData with parsed number or keep current if empty
                  const numValue = value === '' ? formData.numberOfPassengers : (parseInt(value) || 1);
                  setFormData({
                    ...formData,
                    numberOfPassengers: numValue,
                  });
                }
              }}
              onBlur={(e) => {
                // Ensure minimum value of 1 when field loses focus
                const value = parseInt(e.target.value) || 1;
                const finalValue = value < 1 ? 1 : value;
                setPassengerInput(String(finalValue));
                setFormData({
                  ...formData,
                  numberOfPassengers: finalValue,
                });
                if (errors.numberOfPassengers) setErrors({ ...errors, numberOfPassengers: '' });
              }}
              placeholder="Enter number"
              aria-invalid={!!errors.numberOfPassengers}
              aria-describedby={errors.numberOfPassengers ? 'numberOfPassengers-error' : undefined}
            />
            {errors.numberOfPassengers && <span id="numberOfPassengers-error" className="error-message" role="alert">{errors.numberOfPassengers}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="driverId">Driver Assigned</label>
            <select
              id="driverId"
              name="driverId"
              value={formData.driverId}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {drivers
                .filter((d) => d.isActive)
                .map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setFormData({ ...formData, isRecurring: newValue });
                  // If unchecking recurrence, clear recurring fields
                  if (!newValue) {
                    setFormData(prev => ({
                      ...prev,
                      isRecurring: false,
                      recurringPattern: 'weekly',
                      recurringEndDate: '',
                    }));
                  }
                }}
              />
              Recurring Job
              {trip && (trip.isRecurring || trip.parentTripId) && (
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#dc2626' }}>
                  {trip.isRecurring 
                    ? '⚠️ Unchecking will delete all child trips'
                    : '⚠️ Unchecking will cancel recurrence and delete future trips'}
                </small>
              )}
            </label>
          </div>

          {formData.isRecurring && (
            <>
              <div className="form-group">
                <label htmlFor="recurringPattern">Recurring Pattern</label>
                <select
                  id="recurringPattern"
                  name="recurringPattern"
                  value={formData.recurringPattern}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recurringEndDate">Recurring End Date</label>
                <input
                  type="datetime-local"
                  id="recurringEndDate"
                  name="recurringEndDate"
                  value={formData.recurringEndDate}
                  onChange={(e) => {
                    handleChange(e);
                    if (errors.recurringEndDate) setErrors({ ...errors, recurringEndDate: '' });
                  }}
                  required={formData.isRecurring}
                  aria-invalid={!!errors.recurringEndDate}
                  aria-describedby={errors.recurringEndDate ? 'recurringEndDate-error' : undefined}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                  Jobs will be automatically created until this date
                </small>
                {errors.recurringEndDate && <span id="recurringEndDate-error" className="error-message" role="alert">{errors.recurringEndDate}</span>}
              </div>
            </>
          )}

          {/* Financial Information */}
          <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Financial Information (for Billing & Payroll)</h4>
            
            <div className="form-group">
              <label htmlFor="tripRate">Trip Rate (Customer Charge)</label>
              <input
                type="number"
                id="tripRate"
                name="tripRate"
                value={formData.tripRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                style={{ width: '100%' }}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Amount charged to customer/airline for this trip (optional, for billing verification)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="driverPayAmount">Driver Pay Amount</label>
              <input
                type="number"
                id="driverPayAmount"
                name="driverPayAmount"
                value={formData.driverPayAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                style={{ width: '100%' }}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Fixed amount paid to driver for this trip (optional, will calculate from driver pay rate if not specified)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (for Billing/Payroll)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => {
                  handleChange(e as any);
                }}
                rows={3}
                placeholder="Additional notes for billing or payroll verification..."
                maxLength={500}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Optional notes for billing or payroll verification
              </small>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Additional Information</h4>
              {loadingCustomFields ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Loading custom fields...</p>
              ) : (
                customFields.map((field) =>
                  renderCustomFieldInput(
                    field,
                    customFieldValues[field.id] || '',
                    (value) => {
                      setCustomFieldValues((prev) => ({
                        ...prev,
                        [field.id]: value,
                      }));
                      // Clear error when user starts typing
                      if (errors[`custom_${field.id}`]) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[`custom_${field.id}`];
                          return newErrors;
                        });
                      }
                    },
                    errors[`custom_${field.id}`]
                  )
                )
              )}
            </div>
          )}

          {/* GPS Location Information (only shown when editing existing trip with GPS data) */}
          {trip && (trip.startLocationLat || trip.completeLocationLat) && (
            <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>GPS Location Information</h4>
              
              {trip.startLocationLat && trip.startLocationLng && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Pickup Location GPS
                  </label>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    📍 Coordinates: {formatCoordinates(trip.startLocationLat, trip.startLocationLng)}
                  </div>
                  {loadingPickupAddress ? (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Loading address...
                    </div>
                  ) : pickupAddress ? (
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', marginTop: '0.25rem' }}>
                      🏠 Address: {pickupAddress}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Address not available
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${trip.startLocationLat},${trip.startLocationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none', marginTop: '0.25rem', display: 'inline-block' }}
                  >
                    View on Map ↗
                  </a>
                </div>
              )}

              {trip.completeLocationLat && trip.completeLocationLng && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Dropoff Location GPS
                  </label>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    📍 Coordinates: {formatCoordinates(trip.completeLocationLat, trip.completeLocationLng)}
                  </div>
                  {loadingDropoffAddress ? (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Loading address...
                    </div>
                  ) : dropoffAddress ? (
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', marginTop: '0.25rem' }}>
                      🏠 Address: {dropoffAddress}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Address not available
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${trip.completeLocationLat},${trip.completeLocationLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none', marginTop: '0.25rem', display: 'inline-block' }}
                  >
                    View on Map ↗
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
              {loading ? 'Saving...' : trip ? 'Update' : 'Create'} Trip
            </button>
          </div>
        </form>
      </div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}
    </div>
  );
}

export default TripForm;
