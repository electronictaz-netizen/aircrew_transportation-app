import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import './LocationManagement.css';

const client = generateClient<Schema>();

interface LocationManagementProps {
  locations: Array<Schema['Location']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function LocationManagement({ locations, onClose, onUpdate }: LocationManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Schema['Location']['type'] | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await client.models.Location.update({
          id: editingLocation.id,
          ...formData,
        });
      } else {
        await client.models.Location.create(formData);
      }
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    }
  };

  const handleEdit = (location: Schema['Location']['type']) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      description: location.description || '',
      isActive: location.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await client.models.Location.delete({ id: locationId });
      onUpdate();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  const handleSelectLocation = (locationId: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId);
    } else {
      newSelected.add(locationId);
    }
    setSelectedLocations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLocations.size === locations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(locations.map(l => l.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLocations.size === 0) return;
    
    const count = selectedLocations.size;
    if (!confirm(`Are you sure you want to delete ${count} location${count > 1 ? 's' : ''}?`)) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const locationId of selectedLocations) {
        try {
          await client.models.Location.delete({ id: locationId });
          successCount++;
        } catch (error) {
          console.error(`Error deleting location ${locationId}:`, error);
          failCount++;
        }
      }
      
      setSelectedLocations(new Set());
      onUpdate();
      
      if (failCount > 0) {
        alert(`Deleted ${successCount} location${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        alert(`Successfully deleted ${successCount} location${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      console.error('Error deleting locations:', error);
      alert('Failed to delete some locations. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      isActive: true,
    });
    setEditingLocation(null);
    setShowForm(false);
  };

  const activeLocations = locations.filter(l => l.isActive !== false);

  return (
    <div className="modal-overlay">
      <div className="modal-content location-management">
        <div className="modal-header">
          <h3>Location Management</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="location-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Location
          </button>
          {selectedLocations.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedLocations.size} selected location${selectedLocations.size > 1 ? 's' : ''}`}
            >
              Delete Selected ({selectedLocations.size})
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="location-form">
            <div className="form-group">
              <label htmlFor="name">Location Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Downtown Office, Hotel Lobby"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main St, City, State 12345"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details or instructions"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active (available for selection)
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingLocation ? 'Update' : 'Create'} Location
              </button>
            </div>
          </form>
        )}

        <div className="locations-list">
          <h4>Locations ({activeLocations.length} active, {locations.length} total)</h4>
          {locations.length === 0 ? (
            <p className="empty-message">No locations added yet. Add locations to make them available in trip forms.</p>
          ) : (
            <table className="locations-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedLocations.size === locations.length && locations.length > 0}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.id} className={selectedLocations.has(location.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLocations.has(location.id)}
                        onChange={() => handleSelectLocation(location.id)}
                      />
                    </td>
                    <td>{location.name}</td>
                    <td>{location.address || '-'}</td>
                    <td>{location.description || '-'}</td>
                    <td>
                      <span className={location.isActive ? 'status-active' : 'status-inactive'}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(location)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(location.id)}
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

export default LocationManagement;
