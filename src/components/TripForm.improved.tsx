/**
 * IMPROVED TripForm with validation and better UX
 * This is an example of how to integrate the validation utilities
 * Replace the existing TripForm.tsx with this implementation
 */

import { useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import {
  validateFlightNumber,
  validateLocation,
  validatePassengers,
  validateFutureDate,
  validateRecurringEndDate,
  sanitizeString,
  MAX_LENGTHS,
} from '../utils/validation';
import { useNotification } from './Notification';
import './TripForm.css';

interface TripFormProps {
  trip?: Schema['Trip']['type'] | null;
  drivers: Array<Schema['Driver']['type']>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormErrors {
  pickupDate?: string;
  flightNumber?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  numberOfPassengers?: string;
  recurringEndDate?: string;
}

function TripForm({ trip, drivers, onSubmit, onCancel }: TripFormProps) {
  const { showError } = useNotification();
  const [formData, setFormData] = useState({
    pickupDate: trip?.pickupDate ? format(new Date(trip.pickupDate), "yyyy-MM-dd'T'HH:mm") : '',
    flightNumber: trip?.flightNumber || '',
    pickupLocation: trip?.pickupLocation || '',
    dropoffLocation: trip?.dropoffLocation || '',
    numberOfPassengers: trip?.numberOfPassengers || 1,
    driverId: trip?.driverId || '',
    status: trip?.status || 'Unassigned',
    isRecurring: trip?.isRecurring || !!trip?.parentTripId || false,
    recurringPattern: trip?.recurringPattern || 'weekly',
    recurringEndDate: trip?.recurringEndDate ? format(new Date(trip.recurringEndDate), "yyyy-MM-dd'T'HH:mm") : '',
  });
  
  const [passengerInput, setPassengerInput] = useState(String(formData.numberOfPassengers));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate individual field
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'flightNumber': {
        const result = validateFlightNumber(value);
        return result.isValid ? undefined : result.error;
      }
      case 'pickupLocation': {
        const result = validateLocation(value);
        return result.isValid ? undefined : result.error;
      }
      case 'dropoffLocation': {
        const result = validateLocation(value);
        return result.isValid ? undefined : result.error;
      }
      case 'numberOfPassengers': {
        const result = validatePassengers(value);
        return result.isValid ? undefined : result.error;
      }
      case 'pickupDate': {
        const result = validateFutureDate(value);
        return result.isValid ? undefined : result.error;
      }
      case 'recurringEndDate': {
        if (formData.isRecurring && value) {
          const result = validateRecurringEndDate(formData.pickupDate, value);
          return result.isValid ? undefined : result.error;
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate required fields
    const flightNumberError = validateField('flightNumber', formData.flightNumber);
    if (flightNumberError) newErrors.flightNumber = flightNumberError;

    const pickupLocationError = validateField('pickupLocation', formData.pickupLocation);
    if (pickupLocationError) newErrors.pickupLocation = pickupLocationError;

    const dropoffLocationError = validateField('dropoffLocation', formData.dropoffLocation);
    if (dropoffLocationError) newErrors.dropoffLocation = dropoffLocationError;

    const pickupDateError = validateField('pickupDate', formData.pickupDate);
    if (pickupDateError) newErrors.pickupDate = pickupDateError;

    const passengersError = validateField('numberOfPassengers', formData.numberOfPassengers);
    if (passengersError) newErrors.numberOfPassengers = passengersError;

    // Validate recurring fields if recurring is checked
    if (formData.isRecurring) {
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = 'Recurring end date is required';
      } else {
        const recurringEndDateError = validateField('recurringEndDate', formData.recurringEndDate);
        if (recurringEndDateError) newErrors.recurringEndDate = recurringEndDateError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize and validate all inputs
      const flightNumberResult = validateFlightNumber(formData.flightNumber);
      const pickupLocationResult = validateLocation(formData.pickupLocation);
      const dropoffLocationResult = validateLocation(formData.dropoffLocation);
      const passengersResult = validatePassengers(formData.numberOfPassengers);
      const pickupDateResult = validateFutureDate(formData.pickupDate);

      if (!flightNumberResult.isValid || !pickupLocationResult.isValid || 
          !dropoffLocationResult.isValid || !passengersResult.isValid || 
          !pickupDateResult.isValid || !pickupDateResult.date) {
        showError('Invalid form data. Please check your inputs.');
        setIsSubmitting(false);
        return;
      }

      const submitData: any = {
        pickupDate: pickupDateResult.date.toISOString(),
        flightNumber: flightNumberResult.sanitized,
        pickupLocation: pickupLocationResult.sanitized,
        dropoffLocation: dropoffLocationResult.sanitized,
        numberOfPassengers: passengersResult.value,
        driverId: formData.driverId || undefined,
        status: formData.driverId ? 'Assigned' : 'Unassigned',
        isRecurring: formData.isRecurring === true,
      };

      // Only include recurring fields if it's a recurring job
      if (formData.isRecurring) {
        submitData.recurringPattern = formData.recurringPattern;
        if (formData.recurringEndDate) {
          const endDateResult = validateRecurringEndDate(formData.pickupDate, formData.recurringEndDate);
          if (endDateResult.isValid && endDateResult.date) {
            submitData.recurringEndDate = endDateResult.date.toISOString();
          } else {
            showError(endDateResult.error || 'Invalid recurring end date');
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        submitData.recurringPattern = undefined;
        submitData.recurringEndDate = undefined;
        submitData.parentTripId = undefined;
      }

      onSubmit(submitData);
    } catch (error: any) {
      console.error('Error preparing trip data:', error);
      showError(error.message || 'Error preparing trip data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'numberOfPassengers') {
      return; // Handled separately
    }

    // Sanitize input based on field type
    let sanitizedValue = value;
    if (name === 'flightNumber') {
      sanitizedValue = sanitizeString(value, MAX_LENGTHS.FLIGHT_NUMBER).toUpperCase();
    } else if (name === 'pickupLocation' || name === 'dropoffLocation') {
      sanitizedValue = sanitizeString(value, MAX_LENGTHS.LOCATION);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }

    // Validate on blur (handled in onBlur handlers)
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
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
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={!!errors.pickupDate}
              aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
            />
            {errors.pickupDate && (
              <span id="pickupDate-error" className="error-message" role="alert">
                {errors.pickupDate}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="flightNumber">Flight Number *</label>
            <input
              type="text"
              id="flightNumber"
              name="flightNumber"
              value={formData.flightNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="e.g., AA1234"
              maxLength={MAX_LENGTHS.FLIGHT_NUMBER}
              aria-invalid={!!errors.flightNumber}
              aria-describedby={errors.flightNumber ? 'flightNumber-error' : undefined}
            />
            {errors.flightNumber && (
              <span id="flightNumber-error" className="error-message" role="alert">
                {errors.flightNumber}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pickupLocation">Pickup Location *</label>
            <input
              type="text"
              id="pickupLocation"
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="e.g., Airport Terminal 1"
              maxLength={MAX_LENGTHS.LOCATION}
              aria-invalid={!!errors.pickupLocation}
              aria-describedby={errors.pickupLocation ? 'pickupLocation-error' : undefined}
            />
            {errors.pickupLocation && (
              <span id="pickupLocation-error" className="error-message" role="alert">
                {errors.pickupLocation}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dropoffLocation">Dropoff Location *</label>
            <input
              type="text"
              id="dropoffLocation"
              name="dropoffLocation"
              value={formData.dropoffLocation}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="e.g., Hotel Downtown"
              maxLength={MAX_LENGTHS.LOCATION}
              aria-invalid={!!errors.dropoffLocation}
              aria-describedby={errors.dropoffLocation ? 'dropoffLocation-error' : undefined}
            />
            {errors.dropoffLocation && (
              <span id="dropoffLocation-error" className="error-message" role="alert">
                {errors.dropoffLocation}
              </span>
            )}
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
                if (value === '' || /^\d+$/.test(value)) {
                  setPassengerInput(value);
                  const numValue = value === '' ? formData.numberOfPassengers : (parseInt(value) || 1);
                  setFormData({
                    ...formData,
                    numberOfPassengers: numValue,
                  });
                  
                  // Clear error
                  if (errors.numberOfPassengers) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.numberOfPassengers;
                      return newErrors;
                    });
                  }
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1;
                const finalValue = value < 1 ? 1 : value;
                setPassengerInput(String(finalValue));
                setFormData({
                  ...formData,
                  numberOfPassengers: finalValue,
                });
                
                // Validate
                const error = validateField('numberOfPassengers', finalValue);
                if (error) {
                  setErrors((prev) => ({ ...prev, numberOfPassengers: error }));
                }
              }}
              placeholder="Enter number"
              aria-invalid={!!errors.numberOfPassengers}
              aria-describedby={errors.numberOfPassengers ? 'numberOfPassengers-error' : undefined}
            />
            {errors.numberOfPassengers && (
              <span id="numberOfPassengers-error" className="error-message" role="alert">
                {errors.numberOfPassengers}
              </span>
            )}
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
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: newValue,
                    recurringPattern: newValue ? prev.recurringPattern : 'weekly',
                    recurringEndDate: newValue ? prev.recurringEndDate : '',
                  }));
                  
                  // Clear recurring end date error if unchecking
                  if (!newValue && errors.recurringEndDate) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.recurringEndDate;
                      return newErrors;
                    });
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
                <label htmlFor="recurringEndDate">Recurring End Date *</label>
                <input
                  type="datetime-local"
                  id="recurringEndDate"
                  name="recurringEndDate"
                  value={formData.recurringEndDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required={formData.isRecurring}
                  aria-invalid={!!errors.recurringEndDate}
                  aria-describedby={errors.recurringEndDate ? 'recurringEndDate-error' : undefined}
                />
                {errors.recurringEndDate && (
                  <span id="recurringEndDate-error" className="error-message" role="alert">
                    {errors.recurringEndDate}
                  </span>
                )}
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                  Jobs will be automatically created until this date
                </small>
              </div>
            </>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (trip ? 'Update' : 'Create')} Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripForm;
