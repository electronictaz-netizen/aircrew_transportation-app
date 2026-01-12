import { useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import './TripForm.css';

interface TripFormProps {
  trip?: Schema['Trip']['type'] | null;
  drivers: Array<Schema['Driver']['type']>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function TripForm({ trip, drivers, onSubmit, onCancel }: TripFormProps) {
  const [formData, setFormData] = useState({
    pickupDate: trip?.pickupDate ? format(new Date(trip.pickupDate), "yyyy-MM-dd'T'HH:mm") : '',
    flightNumber: trip?.flightNumber || '',
    pickupLocation: trip?.pickupLocation || '',
    dropoffLocation: trip?.dropoffLocation || '',
    numberOfPassengers: trip?.numberOfPassengers || 1,
    driverId: trip?.driverId || '',
    status: trip?.status || 'Unassigned',
    isRecurring: trip?.isRecurring || false,
    recurringPattern: trip?.recurringPattern || 'weekly',
    recurringEndDate: trip?.recurringEndDate ? format(new Date(trip.recurringEndDate), "yyyy-MM-dd'T'HH:mm") : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      pickupDate: new Date(formData.pickupDate).toISOString(),
      driverId: formData.driverId || undefined,
      status: formData.driverId ? 'Assigned' : 'Unassigned',
    };
    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberOfPassengers' ? parseInt(value) || 1 : value,
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
            <input
              type="text"
              id="pickupLocation"
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              required
              placeholder="e.g., Airport Terminal 1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dropoffLocation">Dropoff Location *</label>
            <input
              type="text"
              id="dropoffLocation"
              name="dropoffLocation"
              value={formData.dropoffLocation}
              onChange={handleChange}
              required
              placeholder="e.g., Hotel Downtown"
            />
          </div>

          <div className="form-group">
            <label htmlFor="numberOfPassengers">Number of Passengers</label>
            <input
              type="number"
              id="numberOfPassengers"
              name="numberOfPassengers"
              value={formData.numberOfPassengers}
              onChange={handleChange}
              min="1"
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
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              />
              Recurring Job
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
