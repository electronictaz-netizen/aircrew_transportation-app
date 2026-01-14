import { useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import './TripForm.css';

interface TripFormProps {
  trip?: Schema['Trip']['type'] | null;
  drivers: Array<Schema['Driver']['type']>;
  locations?: Array<Schema['Location']['type']>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Airport options
const AIRPORTS = [
  { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)' },
  { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)' },
  { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)' },
  { code: 'ALB', name: 'Albany International Airport (ALB)' },
];

function TripForm({ trip, drivers, locations = [], onSubmit, onCancel }: TripFormProps) {
  const [formData, setFormData] = useState({
    airport: trip?.airport || '',
    pickupDate: trip?.pickupDate ? format(new Date(trip.pickupDate), "yyyy-MM-dd'T'HH:mm") : '',
    flightNumber: trip?.flightNumber || '',
    pickupLocation: trip?.pickupLocation || '',
    dropoffLocation: trip?.dropoffLocation || '',
    numberOfPassengers: trip?.numberOfPassengers || 1,
    driverId: trip?.driverId || '',
    status: trip?.status || 'Unassigned',
    isRecurring: trip?.isRecurring || !!trip?.parentTripId || false, // Show as recurring if it's a parent or child
    recurringPattern: trip?.recurringPattern || 'weekly',
    recurringEndDate: trip?.recurringEndDate ? format(new Date(trip.recurringEndDate), "yyyy-MM-dd'T'HH:mm") : '',
  });
  
  const [passengerInput, setPassengerInput] = useState(String(formData.numberOfPassengers));
  
  // Initialize location modes based on whether current values match airport names or saved locations
  const getInitialLocationMode = (location: string): 'text' | 'airport' | 'location' => {
    const airportNames = AIRPORTS.map(a => a.name);
    if (airportNames.includes(location)) return 'airport';
    const savedLocationNames = locations.filter(l => l.isActive !== false).map(l => l.name);
    if (savedLocationNames.includes(location)) return 'location';
    return 'text';
  };
  
  const [pickupLocationMode, setPickupLocationMode] = useState<'text' | 'airport' | 'location'>(() => 
    getInitialLocationMode(formData.pickupLocation)
  );
  const [dropoffLocationMode, setDropoffLocationMode] = useState<'text' | 'airport' | 'location'>(() => 
    getInitialLocationMode(formData.dropoffLocation)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.airport || !formData.pickupDate || !formData.flightNumber || !formData.pickupLocation || !formData.dropoffLocation) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate recurring job fields if recurring is checked
    if (formData.isRecurring && !formData.recurringEndDate) {
      alert('Please provide an end date for recurring jobs.');
      return;
    }

    try {
      const submitData: any = {
        airport: formData.airport || undefined,
        pickupDate: new Date(formData.pickupDate).toISOString(),
        flightNumber: formData.flightNumber.trim(),
        pickupLocation: formData.pickupLocation.trim(),
        dropoffLocation: formData.dropoffLocation.trim(),
        numberOfPassengers: typeof formData.numberOfPassengers === 'number' 
          ? formData.numberOfPassengers 
          : (parseInt(String(formData.numberOfPassengers)) || 1),
        driverId: formData.driverId || undefined,
        status: formData.driverId ? 'Assigned' : 'Unassigned',
        isRecurring: formData.isRecurring === true, // Explicitly set to true or false
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

      console.log('TripForm submitting data:', submitData);
      onSubmit(submitData);
    } catch (error) {
      console.error('Error preparing trip data:', error);
      alert('Error preparing trip data. Please check your input and try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // numberOfPassengers is handled separately in its own onChange
    if (name === 'numberOfPassengers') {
      return; // Skip, handled by custom onChange
    }
    
    // If airport changes and location modes are set to airport, update locations
    if (name === 'airport' && value) {
      const selectedAirport = AIRPORTS.find(a => a.code === value);
      setFormData((prev) => {
        const updates: any = { airport: value };
        // Update pickup location if in airport mode
        if (pickupLocationMode === 'airport' && selectedAirport) {
          updates.pickupLocation = selectedAirport.name;
        }
        // Update dropoff location if in airport mode
        if (dropoffLocationMode === 'airport' && selectedAirport) {
          updates.dropoffLocation = selectedAirport.name;
        }
        return { ...prev, ...updates };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{trip ? 'Edit Trip' : 'Create New Trip'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="airport">Airport *</label>
            <select
              id="airport"
              name="airport"
              value={formData.airport}
              onChange={handleChange}
              required
            >
              <option value="">Select Airport</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pickupDate">Pickup Date and Time *</label>
            <input
              type="datetime-local"
              id="pickupDate"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="flightNumber">Flight Number *</label>
            <input
              type="text"
              id="flightNumber"
              name="flightNumber"
              value={formData.flightNumber}
              onChange={handleChange}
              required
              placeholder="e.g., AA1234"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pickupLocation">Pickup Location *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setPickupLocationMode('airport');
                  if (formData.airport) {
                    const selectedAirport = AIRPORTS.find(a => a.code === formData.airport);
                    if (selectedAirport) {
                      setFormData(prev => ({
                        ...prev,
                        pickupLocation: selectedAirport.name
                      }));
                    }
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: pickupLocationMode === 'airport' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: pickupLocationMode === 'airport' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Use Airport
              </button>
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
                disabled={locations.filter(l => l.isActive !== false).length === 0}
                title={locations.filter(l => l.isActive !== false).length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
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
            {pickupLocationMode === 'airport' ? (
              <select
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                disabled={!formData.airport}
              >
                <option value="">Select Airport</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.name}>
                    {airport.name}
                  </option>
                ))}
              </select>
            ) : pickupLocationMode === 'location' ? (
              <select
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
              >
                <option value="">Select Saved Location</option>
                {locations.filter(l => l.isActive !== false).map((location) => (
                  <option key={location.id} value={location.name}>
                    {location.name}{location.address ? ` - ${location.address}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                placeholder="e.g., Airport Terminal 1"
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dropoffLocation">Dropoff Location *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setDropoffLocationMode('airport');
                  if (formData.airport) {
                    const selectedAirport = AIRPORTS.find(a => a.code === formData.airport);
                    if (selectedAirport) {
                      setFormData(prev => ({
                        ...prev,
                        dropoffLocation: selectedAirport.name
                      }));
                    }
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: dropoffLocationMode === 'airport' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: dropoffLocationMode === 'airport' ? '#eff6ff' : 'white',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Use Airport
              </button>
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
                disabled={locations.filter(l => l.isActive !== false).length === 0}
                title={locations.filter(l => l.isActive !== false).length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
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
            {dropoffLocationMode === 'airport' ? (
              <select
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={handleChange}
                required
                disabled={!formData.airport}
              >
                <option value="">Select Airport</option>
                {AIRPORTS.map((airport) => (
                  <option key={airport.code} value={airport.name}>
                    {airport.name}
                  </option>
                ))}
              </select>
            ) : dropoffLocationMode === 'location' ? (
              <select
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={handleChange}
                required
              >
                <option value="">Select Saved Location</option>
                {locations.filter(l => l.isActive !== false).map((location) => (
                  <option key={location.id} value={location.name}>
                    {location.name}{location.address ? ` - ${location.address}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="dropoffLocation"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={handleChange}
                required
                placeholder="e.g., Hotel Downtown"
              />
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
              }}
              placeholder="Enter number"
            />
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
                  onChange={handleChange}
                  required={formData.isRecurring}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                  Jobs will be automatically created until this date
                </small>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {trip ? 'Update' : 'Create'} Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripForm;
