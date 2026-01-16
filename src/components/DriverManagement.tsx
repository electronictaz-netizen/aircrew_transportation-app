import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { validateName, validateEmail, validatePhone, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';
import './DriverManagement.css';

const client = generateClient<Schema>();

function DriverManagement() {
  const { companyId } = useCompany();
  const [drivers, setDrivers] = useState<Array<Schema['Driver']['type']>>([]);
  const [loading, setLoading] = useState(true);
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
    notificationPreference: 'email' as 'email' | 'both',
    payRatePerTrip: '',
    payRatePerHour: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadDrivers();
    }
  }, [companyId]);

  const loadDrivers = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const { data: driversData } = await client.models.Driver.list({
        filter: { companyId: { eq: companyId! } }
      });
      setDrivers(driversData as Array<Schema['Driver']['type']>);
    } catch (error) {
      logger.error('Error loading drivers:', error);
      showError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    setFormLoading(true);

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
        payRatePerTrip: formData.payRatePerTrip ? parseFloat(formData.payRatePerTrip) : undefined,
        payRatePerHour: formData.payRatePerHour ? parseFloat(formData.payRatePerHour) : undefined,
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
      loadDrivers();
      resetForm();
    } catch (error) {
      logger.error('Error saving driver:', error);
      showError('Failed to save driver. Please try again.');
    } finally {
      setFormLoading(false);
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
      notificationPreference: (driver.notificationPreference as 'email' | 'both') || 'email',
      payRatePerTrip: driver.payRatePerTrip !== null && driver.payRatePerTrip !== undefined ? String(driver.payRatePerTrip) : '',
      payRatePerHour: driver.payRatePerHour !== null && driver.payRatePerHour !== undefined ? String(driver.payRatePerHour) : '',
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
      loadDrivers();
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
      loadDrivers();
      
      if (failCount > 0) {
        showWarning(`Deleted ${successCount} driver${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        showSuccess(`Successfully deleted ${successCount} driver${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      logger.error('Error deleting drivers:', error);
      showError('Failed to delete some drivers. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      isActive: true,
      notificationPreference: 'email',
      payRatePerTrip: '',
      payRatePerHour: '',
    });
    setEditingDriver(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="driver-management-page">
        <div className="loading-state">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="driver-management-page">
      <div className="dashboard-header">
        <div>
          <h2>Driver Management</h2>
          <Link to="/management" className="back-link" style={{ marginTop: '0.5rem', display: 'inline-block', color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to Management Dashboard
          </Link>
        </div>
        <div className="header-actions">
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
                onChange={(e) => setFormData({ ...formData, notificationPreference: e.target.value as 'email' | 'both' })}
              >
                <option value="email">Email Only</option>
                <option value="both">Both (Email & In-App)</option>
              </select>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                {formData.notificationPreference === 'email' && 'Driver will receive email notifications'}
                {formData.notificationPreference === 'both' && 'Driver will receive email and in-app notifications'}
              </small>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Pay Rate Information (for Payroll)</h4>
              
              <div className="form-group">
                <label htmlFor="payRatePerTrip">Pay Rate Per Trip</label>
                <input
                  type="number"
                  id="payRatePerTrip"
                  name="payRatePerTrip"
                  value={formData.payRatePerTrip}
                  onChange={(e) => setFormData({ ...formData, payRatePerTrip: e.target.value })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                  Fixed amount paid per completed trip (optional, for payroll calculation)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="payRatePerHour">Pay Rate Per Hour</label>
                <input
                  type="number"
                  id="payRatePerHour"
                  name="payRatePerHour"
                  value={formData.payRatePerHour}
                  onChange={(e) => setFormData({ ...formData, payRatePerHour: e.target.value })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                  Hourly rate for calculating pay based on trip duration (optional, for payroll calculation)
                </small>
              </div>
              
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontStyle: 'italic' }}>
                Note: If both rates are set, per-trip rate takes precedence. If neither is set, pay will be calculated from trip-specific driver pay amount.
              </small>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={formLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={formLoading} aria-busy={formLoading}>
                {formLoading ? 'Saving...' : editingDriver ? 'Update' : 'Create'} Driver
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
                  <tr 
                    key={driver.id} 
                    className={selectedDrivers.has(driver.id) ? 'selected' : ''}
                    onClick={(e) => {
                      // Don't trigger if clicking on checkbox, button, or link
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
                        return;
                      }
                      handleEdit(driver);
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to view/edit driver details"
                  >
                    <td onClick={(e) => e.stopPropagation()}>
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
                         driver.notificationPreference === 'both' ? '📧 Both' :
                         '📧 Email'}
                      </span>
                    </td>
                    <td>
                      <span className={driver.isActive ? 'status-active' : 'status-inactive'}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
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
