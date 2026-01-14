import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import './LocationManagement.css';

const client = generateClient<Schema>();

interface LocationManagementProps {
  locations: Array<Schema['Location']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function LocationManagement({ locations, onClose, onUpdate }: LocationManagementProps) {
  const { companyId } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Schema['Location']['type'] | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    category: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      alert('Company not found. Please contact support.');
      return;
    }

    try {
      if (editingLocation) {
        // Ensure companyId is not changed - it's not in formData anyway
        await client.models.Location.update({
          id: editingLocation.id,
          ...formData,
        });
      } else {
        const createData: any = {
          ...formData,
          companyId: companyId!,
        };
        await client.models.Location.create(createData);
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
      category: location.category || '',
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
      category: '',
      isActive: true,
    });
    setEditingLocation(null);
    setShowForm(false);
  };

  const handleAddAirports = async () => {
    if (!companyId) {
      alert('Company not found. Please contact support.');
      return;
    }

    const airports = [
      { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)', address: 'Buffalo, NY' },
      { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)', address: 'Rochester, NY' },
      { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)', address: 'Syracuse, NY' },
      { code: 'ALB', name: 'Albany International Airport (ALB)', address: 'Albany, NY' },
    ];

    // Check which airports already exist
    const existingNames = new Set(locations.map(l => l.name));
    const airportsToAdd = airports.filter(a => !existingNames.has(a.name));

    if (airportsToAdd.length === 0) {
      alert('All airports already exist in your locations.');
      return;
    }

    if (!confirm(`Add ${airportsToAdd.length} airport location(s)?\n\n${airportsToAdd.map(a => `- ${a.name}`).join('\n')}`)) {
      return;
    }

    try {
      let createdCount = 0;
      let errorCount = 0;

      for (const airport of airportsToAdd) {
        try {
          await client.models.Location.create({
            name: airport.name,
            address: airport.address,
            category: 'Airport',
            description: `Airport code: ${airport.code}`,
            isActive: true,
            companyId: companyId!,
          });
          createdCount++;
        } catch (error) {
          console.error(`Error creating ${airport.code}:`, error);
          errorCount++;
        }
      }

      if (createdCount > 0) {
        alert(`Successfully added ${createdCount} airport location(s)${errorCount > 0 ? `\n${errorCount} failed` : ''}.`);
        onUpdate(); // Refresh the locations list
      } else {
        alert(`Failed to add airports. Please check the console for errors.`);
      }
    } catch (error) {
      console.error('Error adding airports:', error);
      alert('Failed to add airports. Please try again.');
    }
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
          <button
            className="btn btn-secondary"
            onClick={handleAddAirports}
            title="Add default airports (BUF, ROC, SYR, ALB) as locations"
          >
            + Add Default Airports
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
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Airport, Hotel, Office, Warehouse"
              />
              <small>Used for filtering and organization (optional)</small>
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
                  <th>Category</th>
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
                    <td>{location.category || '-'}</td>
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
