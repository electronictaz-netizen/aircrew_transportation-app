import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { validateName, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import './VehicleManagement.css';

const client = generateClient<Schema>();

interface VehicleManagementProps {
  vehicles: Array<Schema['Vehicle']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function VehicleManagement({ vehicles, onClose, onUpdate }: VehicleManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Schema['Vehicle']['type'] | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      showError('Company not found. Please contact support.');
      return;
    }

    // Validate inputs
    const newErrors: Record<string, string> = {};
    
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Invalid name';
    }
    
    if (formData.make && formData.make.length > 50) {
      newErrors.make = 'Make must be no more than 50 characters';
    }
    
    if (formData.model && formData.model.length > 50) {
      newErrors.model = 'Model must be no more than 50 characters';
    }
    
    if (formData.year) {
      const yearNum = parseInt(formData.year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        newErrors.year = `Year must be between 1900 and ${new Date().getFullYear() + 1}`;
      }
    }
    
    if (formData.licensePlate && formData.licensePlate.length > 20) {
      newErrors.licensePlate = 'License plate must be no more than 20 characters';
    }
    
    if (formData.vin && formData.vin.length > 17) {
      newErrors.vin = 'VIN must be no more than 17 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be no more than 500 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fix the errors in the form');
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      // Sanitize inputs
      const nameValidation = validateName(formData.name);
      const vehicleData = {
        name: nameValidation.sanitized,
        make: sanitizeString(formData.make, 50) || undefined,
        model: sanitizeString(formData.model, 50) || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        licensePlate: sanitizeString(formData.licensePlate, 20) || undefined,
        vin: sanitizeString(formData.vin, 17) || undefined,
        description: sanitizeString(formData.description, 500) || undefined,
        isActive: formData.isActive,
      };
      
      if (editingVehicle) {
        // @ts-ignore - Complex union type from Amplify Data
        await client.models.Vehicle.update({
          id: editingVehicle.id,
          ...vehicleData,
        });
        showSuccess('Vehicle updated successfully!');
      } else {
        await client.models.Vehicle.create({
          ...vehicleData,
          companyId: companyId!,
        });
        showSuccess('Vehicle created successfully!');
      }
      onUpdate();
      resetForm();
    } catch (error) {
      logger.error('Error saving vehicle:', error);
      showError('Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Schema['Vehicle']['type']) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year ? String(vehicle.year) : '',
      licensePlate: vehicle.licensePlate || '',
      vin: vehicle.vin || '',
      description: vehicle.description || '',
      isActive: vehicle.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this vehicle?',
      'Delete Vehicle',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await client.models.Vehicle.delete({ id: vehicleId });
      showSuccess('Vehicle deleted successfully!');
      onUpdate();
    } catch (error) {
      logger.error('Error deleting vehicle:', error);
      showError('Failed to delete vehicle. Please try again.');
    }
  };

  const handleSelectVehicle = (vehicleId: string) => {
    const newSelected = new Set(selectedVehicles);
    if (newSelected.has(vehicleId)) {
      newSelected.delete(vehicleId);
    } else {
      newSelected.add(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVehicles.size === companyVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(companyVehicles.map(v => v.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedVehicles.size === 0) return;
    
    const count = selectedVehicles.size;
    const confirmed = await confirm(
      `Are you sure you want to delete ${count} vehicle${count > 1 ? 's' : ''}?`,
      'Delete Vehicles',
      'danger'
    );
    if (!confirmed) return;
    
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const vehicleId of selectedVehicles) {
        try {
          await client.models.Vehicle.delete({ id: vehicleId });
          successCount++;
        } catch (error) {
          logger.error(`Error deleting vehicle ${vehicleId}:`, error);
          failCount++;
        }
      }
      
      setSelectedVehicles(new Set());
      onUpdate();
      
      if (failCount > 0) {
        showWarning(`Deleted ${successCount} vehicle${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        showSuccess(`Successfully deleted ${successCount} vehicle${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      logger.error('Error deleting vehicles:', error);
      showError('Failed to delete some vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      description: '',
      isActive: true,
    });
    setEditingVehicle(null);
    setShowForm(false);
  };

  // Filter vehicles to ensure only vehicles for the current company are shown
  const companyVehicles = vehicles.filter(v => v.companyId === companyId);
  const activeVehicles = companyVehicles.filter(v => v.isActive !== false);
  
  // Log warning if vehicles from other companies are detected (for debugging)
  if (companyId && vehicles.length > companyVehicles.length) {
    const otherCompanyVehicles = vehicles.filter(v => v.companyId !== companyId);
    logger.warn('Vehicle data isolation issue detected:', {
      currentCompanyId: companyId,
      totalVehicles: vehicles.length,
      companyVehicles: companyVehicles.length,
      otherCompanyVehicles: otherCompanyVehicles.length,
      otherCompanyIds: [...new Set(otherCompanyVehicles.map(v => v.companyId))],
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content vehicle-management">
        <div className="modal-header">
          <h3>Vehicle Management</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="vehicle-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Vehicle
          </button>
          {selectedVehicles.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedVehicles.size} selected vehicle${selectedVehicles.size > 1 ? 's' : ''}`}
            >
              Delete Selected ({selectedVehicles.size})
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="vehicle-form">
            <div className="form-group">
              <label htmlFor="name">Vehicle Name/Identifier *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                placeholder="e.g., Van 1, SUV-123, Sedan A"
                maxLength={MAX_LENGTHS.NAME}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="make">Make</label>
                <input
                  type="text"
                  id="make"
                  value={formData.make}
                  onChange={(e) => {
                    setFormData({ ...formData, make: e.target.value });
                    if (errors.make) setErrors({ ...errors, make: '' });
                  }}
                  placeholder="e.g., Ford, Chevrolet"
                  maxLength={50}
                  aria-invalid={!!errors.make}
                  aria-describedby={errors.make ? 'make-error' : undefined}
                />
                {errors.make && <span id="make-error" className="error-message" role="alert">{errors.make}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="model">Model</label>
                <input
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={(e) => {
                    setFormData({ ...formData, model: e.target.value });
                    if (errors.model) setErrors({ ...errors, model: '' });
                  }}
                  placeholder="e.g., Transit, Suburban"
                  maxLength={50}
                  aria-invalid={!!errors.model}
                  aria-describedby={errors.model ? 'model-error' : undefined}
                />
                {errors.model && <span id="model-error" className="error-message" role="alert">{errors.model}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) => {
                    setFormData({ ...formData, year: e.target.value });
                    if (errors.year) setErrors({ ...errors, year: '' });
                  }}
                  placeholder="e.g., 2023"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  aria-invalid={!!errors.year}
                  aria-describedby={errors.year ? 'year-error' : undefined}
                />
                {errors.year && <span id="year-error" className="error-message" role="alert">{errors.year}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="licensePlate">License Plate</label>
                <input
                  type="text"
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => {
                    setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() });
                    if (errors.licensePlate) setErrors({ ...errors, licensePlate: '' });
                  }}
                  placeholder="e.g., ABC-1234"
                  maxLength={20}
                  aria-invalid={!!errors.licensePlate}
                  aria-describedby={errors.licensePlate ? 'licensePlate-error' : undefined}
                />
                {errors.licensePlate && <span id="licensePlate-error" className="error-message" role="alert">{errors.licensePlate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN (Vehicle Identification Number)</label>
                <input
                  type="text"
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => {
                    setFormData({ ...formData, vin: e.target.value.toUpperCase() });
                    if (errors.vin) setErrors({ ...errors, vin: '' });
                  }}
                  placeholder="17-character VIN"
                  maxLength={17}
                  aria-invalid={!!errors.vin}
                  aria-describedby={errors.vin ? 'vin-error' : undefined}
                />
                {errors.vin && <span id="vin-error" className="error-message" role="alert">{errors.vin}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details or notes"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active (available for assignment)
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                {loading ? 'Saving...' : editingVehicle ? 'Update' : 'Create'} Vehicle
              </button>
            </div>
          </form>
        )}

        <div className="vehicles-list">
          <h4>Vehicles ({activeVehicles.length} active, {companyVehicles.length} total)</h4>
          {companyVehicles.length === 0 ? (
            <p className="empty-message">No vehicles added yet. Add vehicles to make them available for trip assignment.</p>
          ) : (
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedVehicles.size === companyVehicles.length && companyVehicles.length > 0}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th>Make/Model</th>
                  <th>Year</th>
                  <th>License Plate</th>
                  <th>VIN</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className={selectedVehicles.has(vehicle.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedVehicles.has(vehicle.id)}
                        onChange={() => handleSelectVehicle(vehicle.id)}
                      />
                    </td>
                    <td>{vehicle.name}</td>
                    <td>
                      {vehicle.make || vehicle.model 
                        ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() 
                        : '-'}
                    </td>
                    <td>{vehicle.year || '-'}</td>
                    <td>{vehicle.licensePlate || '-'}</td>
                    <td>{vehicle.vin || '-'}</td>
                    <td>
                      <span className={vehicle.isActive ? 'status-active' : 'status-inactive'}>
                        {vehicle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(vehicle)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(vehicle.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={() => {
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default VehicleManagement;
