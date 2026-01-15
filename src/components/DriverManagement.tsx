import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { validateName, validateEmail, validatePhone, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import './DriverManagement.css';

const client = generateClient<Schema>();

interface DriverManagementProps {
  drivers: Array<Schema['Driver']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function DriverManagement({ drivers, onClose, onUpdate }: DriverManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Schema['Driver']['type'] | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    isActive: true,
    notificationPreference: 'both' as 'email' | 'sms' | 'both',
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
    
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || 'Invalid email';
      }
    }
    
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || 'Invalid phone number';
      }
    }
    
    if (formData.licenseNumber && formData.licenseNumber.length > MAX_LENGTHS.LICENSE_NUMBER) {
      newErrors.licenseNumber = `License number must be no more than ${MAX_LENGTHS.LICENSE_NUMBER} characters`;
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
      const emailValidation = formData.email ? validateEmail(formData.email) : { isValid: true, sanitized: '' };
      const phoneValidation = formData.phone ? validatePhone(formData.phone) : { isValid: true, sanitized: '' };
      
      const driverData = {
        name: nameValidation.sanitized,
        email: emailValidation.sanitized || undefined,
        phone: phoneValidation.sanitized || undefined,
        licenseNumber: sanitizeString(formData.licenseNumber, MAX_LENGTHS.LICENSE_NUMBER) || undefined,
        isActive: formData.isActive,
        notificationPreference: formData.notificationPreference,
      };
      
      if (editingDriver) {
        await client.models.Driver.update({
          id: editingDriver.id,
          ...driverData,
        });
        showSuccess('Driver updated successfully!');
      } else {
        await client.models.Driver.create({
          ...driverData,
          companyId: companyId!,
        });
        showSuccess('Driver created successfully!');
      }
      onUpdate();
      resetForm();
    } catch (error) {
      logger.error('Error saving driver:', error);
      showError('Failed to save driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Schema['Driver']['type']) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      isActive: driver.isActive ?? true,
      notificationPreference: (driver.notificationPreference as 'email' | 'sms' | 'both') || 'both',
    });
    setShowForm(true);
  };

  const handleDelete = async (driverId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this driver?',
      'Delete Driver',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await client.models.Driver.delete({ id: driverId });
      showSuccess('Driver deleted successfully!');
      onUpdate();
    } catch (error) {
      logger.error('Error deleting driver:', error);
      showError('Failed to delete driver. Please try again.');
    }
  };

  const handleSelectDriver = (driverId: string) => {
    const newSelected = new Set(selectedDrivers);
    if (newSelected.has(driverId)) {
      newSelected.delete(driverId);
    } else {
      newSelected.add(driverId);
    }
    setSelectedDrivers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDrivers.size === drivers.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(drivers.map(d => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDrivers.size === 0) return;
    
    const count = selectedDrivers.size;
    const confirmed = await confirm(
      `Are you sure you want to delete ${count} driver${count > 1 ? 's' : ''}?`,
      'Delete Drivers',
      'danger'
    );
    if (!confirmed) return;
    
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const driverId of selectedDrivers) {
        try {
          await client.models.Driver.delete({ id: driverId });
          successCount++;
        } catch (error) {
          logger.error(`Error deleting driver ${driverId}:`, error);
          failCount++;
        }
      }
      
      setSelectedDrivers(new Set());
      onUpdate();
      
      if (failCount > 0) {
        showWarning(`Deleted ${successCount} driver${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        showSuccess(`Successfully deleted ${successCount} driver${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      logger.error('Error deleting drivers:', error);
      showError('Failed to delete some drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      isActive: true,
      notificationPreference: 'both',
    });
    setEditingDriver(null);
    setShowForm(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content driver-management">
        <div className="modal-header">
          <h3>Driver Management</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="driver-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Driver
          </button>
          {selectedDrivers.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedDrivers.size} selected driver${selectedDrivers.size > 1 ? 's' : ''}`}
            >
              Delete Selected ({selectedDrivers.size})
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="driver-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                maxLength={MAX_LENGTHS.NAME}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                maxLength={MAX_LENGTHS.EMAIL}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <span id="email-error" className="error-message" role="alert">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                maxLength={MAX_LENGTHS.PHONE}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && <span id="phone-error" className="error-message" role="alert">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="licenseNumber">License Number</label>
              <input
                type="text"
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="notificationPreference">Notification Preference</label>
              <select
                id="notificationPreference"
                value={formData.notificationPreference}
                onChange={(e) => setFormData({ ...formData, notificationPreference: e.target.value as 'email' | 'sms' | 'both' })}
              >
                <option value="both">Both (Email & SMS)</option>
                <option value="email">Email Only</option>
                <option value="sms">SMS/Text Only</option>
              </select>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                {formData.notificationPreference === 'email' && 'Driver will only receive email notifications'}
                {formData.notificationPreference === 'sms' && 'Driver will only receive SMS/text notifications'}
                {formData.notificationPreference === 'both' && 'Driver will receive both email and SMS notifications'}
              </small>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                {loading ? 'Saving...' : editingDriver ? 'Update' : 'Create'} Driver
              </button>
            </div>
          </form>
        )}

        <div className="drivers-list">
          <h4>Drivers ({drivers.length})</h4>
          {drivers.length === 0 ? (
            <p className="empty-message">No drivers added yet.</p>
          ) : (
            <table className="drivers-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedDrivers.size === drivers.length && drivers.length > 0}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>License Number</th>
                  <th>Notification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className={selectedDrivers.has(driver.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDrivers.has(driver.id)}
                        onChange={() => handleSelectDriver(driver.id)}
                      />
                    </td>
                    <td>{driver.name}</td>
                    <td>{driver.email || '-'}</td>
                    <td>{driver.phone || '-'}</td>
                    <td>{driver.licenseNumber || '-'}</td>
                    <td>
                      <span className="notification-preference">
                        {driver.notificationPreference === 'email' ? '📧 Email' :
                         driver.notificationPreference === 'sms' ? '📱 SMS' :
                         driver.notificationPreference === 'both' ? '📧📱 Both' :
                         '📧📱 Both'}
                      </span>
                    </td>
                    <td>
                      <span className={driver.isActive ? 'status-active' : 'status-inactive'}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(driver)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(driver.id)}
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

export default DriverManagement;
