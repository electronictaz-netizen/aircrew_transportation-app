import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { validateName, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import './LocationManagement.css';

const client = generateClient<Schema>();

interface LocationManagementProps {
  locations: Array<Schema['Location']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function LocationManagement({ locations, onClose, onUpdate }: LocationManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, showWarning, showInfo, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
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
    
    if (formData.address && formData.address.length > MAX_LENGTHS.LOCATION) {
      newErrors.address = `Address must be no more than ${MAX_LENGTHS.LOCATION} characters`;
    }
    
    if (formData.category && formData.category.length > 50) {
      newErrors.category = 'Category must be no more than 50 characters';
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
      const locationData = {
        name: nameValidation.sanitized,
        address: sanitizeString(formData.address, MAX_LENGTHS.LOCATION) || undefined,
        description: sanitizeString(formData.description, 500) || undefined,
        category: sanitizeString(formData.category, 50) || undefined,
        isActive: formData.isActive,
      };
      
      if (editingLocation) {
        // @ts-ignore - Complex union type from Amplify Data
        await client.models.Location.update({
          id: editingLocation.id,
          ...locationData,
        });
        showSuccess('Location updated successfully!');
      } else {
        await client.models.Location.create({
          ...locationData,
          companyId: companyId!,
        });
        showSuccess('Location created successfully!');
      }
      onUpdate();
      resetForm();
    } catch (error) {
      logger.error('Error saving location:', error);
      showError('Failed to save location. Please try again.');
    } finally {
      setLoading(false);
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
    const confirmed = await confirm(
      'Are you sure you want to delete this location?',
      'Delete Location',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await client.models.Location.delete({ id: locationId });
      showSuccess('Location deleted successfully!');
      onUpdate();
    } catch (error) {
      logger.error('Error deleting location:', error);
      showError('Failed to delete location. Please try again.');
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
    if (selectedLocations.size === companyLocations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(companyLocations.map(l => l.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLocations.size === 0) return;
    
    const count = selectedLocations.size;
    const confirmed = await confirm(
      `Are you sure you want to delete ${count} location${count > 1 ? 's' : ''}?`,
      'Delete Locations',
      'danger'
    );
    if (!confirmed) return;
    
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const locationId of selectedLocations) {
        try {
          await client.models.Location.delete({ id: locationId });
          successCount++;
        } catch (error) {
          logger.error(`Error deleting location ${locationId}:`, error);
          failCount++;
        }
      }
      
      setSelectedLocations(new Set());
      onUpdate();
      
      if (failCount > 0) {
        showWarning(`Deleted ${successCount} location${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        showSuccess(`Successfully deleted ${successCount} location${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      logger.error('Error deleting locations:', error);
      showError('Failed to delete some locations. Please try again.');
    } finally {
      setLoading(false);
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
      showError('Company not found. Please contact support.');
      return;
    }

    const airports = [
      { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)', address: 'Buffalo, NY' },
      { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)', address: 'Rochester, NY' },
      { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)', address: 'Syracuse, NY' },
      { code: 'ALB', name: 'Albany International Airport (ALB)', address: 'Albany, NY' },
    ];

    // Check which airports already exist (only for current company)
    const existingNames = new Set(companyLocations.map(l => l.name));
    const airportsToAdd = airports.filter(a => !existingNames.has(a.name));

    if (airportsToAdd.length === 0) {
      showInfo('All airports already exist in your locations.');
      return;
    }

    const confirmed = await confirm(
      `Add ${airportsToAdd.length} airport location(s)?\n\n${airportsToAdd.map(a => `- ${a.name}`).join('\n')}`,
      'Add Default Airports',
      'info'
    );
    if (!confirmed) return;

    setLoading(true);
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
          logger.error(`Error creating ${airport.code}:`, error);
          errorCount++;
        }
      }

      if (createdCount > 0) {
        showSuccess(`Successfully added ${createdCount} airport location(s)${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`);
        onUpdate(); // Refresh the locations list
      } else {
        showError('Failed to add airports. Please check the console for errors.');
      }
    } catch (error) {
      logger.error('Error adding airports:', error);
      showError('Failed to add airports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter locations to ensure only locations for the current company are shown
  // This is a defensive measure to prevent cross-company data leakage
  const companyLocations = locations.filter(l => l.companyId === companyId);
  const activeLocations = companyLocations.filter(l => l.isActive !== false);
  
  // Log warning if locations from other companies are detected (for debugging)
  if (companyId && locations.length > companyLocations.length) {
    const otherCompanyLocations = locations.filter(l => l.companyId !== companyId);
    logger.warn('Location data isolation issue detected:', {
      currentCompanyId: companyId,
      totalLocations: locations.length,
      companyLocations: companyLocations.length,
      otherCompanyLocations: otherCompanyLocations.length,
      otherCompanyIds: [...new Set(otherCompanyLocations.map(l => l.companyId))],
    });
  }

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
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                placeholder="e.g., Downtown Office, Hotel Lobby"
                maxLength={MAX_LENGTHS.NAME}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <AddressAutocompleteInput
                value={formData.address}
                onChange={(value) => {
                  setFormData({ ...formData, address: value });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                placeholder="e.g., 123 Main St, City, State 12345"
                maxLength={MAX_LENGTHS.LOCATION}
                aria-label="Location address"
                aria-describedby={errors.address ? 'address-error' : undefined}
              />
              {errors.address && <span id="address-error" className="error-message" role="alert">{errors.address}</span>}
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
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: '' });
                }}
                placeholder="e.g., Airport, Hotel, Office, Warehouse"
                maxLength={50}
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
              />
              <small>Used for filtering and organization (optional)</small>
              {errors.category && <span id="category-error" className="error-message" role="alert">{errors.category}</span>}
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
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                {loading ? 'Saving...' : editingLocation ? 'Update' : 'Create'} Location
              </button>
            </div>
          </form>
        )}

        <div className="locations-list">
          <h4>Locations ({activeLocations.length} active, {companyLocations.length} total)</h4>
          {companyLocations.length === 0 ? (
            <p className="empty-message">No locations added yet. Add locations to make them available in trip forms.</p>
          ) : (
            <table className="locations-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedLocations.size === companyLocations.length && companyLocations.length > 0}
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
                {companyLocations.map((location) => (
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

export default LocationManagement;
