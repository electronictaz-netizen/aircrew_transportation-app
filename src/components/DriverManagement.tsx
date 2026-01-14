import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import './DriverManagement.css';

const client = generateClient<Schema>();

interface DriverManagementProps {
  drivers: Array<Schema['Driver']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function DriverManagement({ drivers, onClose, onUpdate }: DriverManagementProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await client.models.Driver.update({
          id: editingDriver.id,
          ...formData,
        });
      } else {
        await client.models.Driver.create(formData);
      }
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('Failed to save driver. Please try again.');
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
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await client.models.Driver.delete({ id: driverId });
      onUpdate();
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Failed to delete driver. Please try again.');
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
    if (!confirm(`Are you sure you want to delete ${count} driver${count > 1 ? 's' : ''}?`)) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const driverId of selectedDrivers) {
        try {
          await client.models.Driver.delete({ id: driverId });
          successCount++;
        } catch (error) {
          console.error(`Error deleting driver ${driverId}:`, error);
          failCount++;
        }
      }
      
      setSelectedDrivers(new Set());
      onUpdate();
      
      if (failCount > 0) {
        alert(`Deleted ${successCount} driver${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        alert(`Successfully deleted ${successCount} driver${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      console.error('Error deleting drivers:', error);
      alert('Failed to delete some drivers. Please try again.');
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
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
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingDriver ? 'Update' : 'Create'} Driver
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
    </div>
  );
}

export default DriverManagement;
