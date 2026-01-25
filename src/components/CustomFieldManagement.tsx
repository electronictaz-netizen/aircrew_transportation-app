import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';
import './CustomFieldManagement.css';

const client = generateClient<Schema>();

interface CustomFieldManagementProps {
  onClose: () => void;
}

function CustomFieldManagement({ onClose }: CustomFieldManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [customFields, setCustomFields] = useState<Array<Schema['CustomField']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<Schema['CustomField']['type'] | null>(null);
  const [entityType, setEntityType] = useState<'Trip' | 'Driver'>('Trip');
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    fieldType: 'text' as 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'textarea',
    options: '',
    isRequired: false,
    displayOrder: 0,
    isActive: true,
    defaultValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (companyId) {
      loadCustomFields();
    }
  }, [companyId, entityType]);

  const loadCustomFields = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const { data: fieldsData } = await client.models.CustomField.list({
        filter: { 
          companyId: { eq: companyId },
          entityType: { eq: entityType },
        }
      });
      setCustomFields((fieldsData || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (error) {
      logger.error('Error loading custom fields:', error);
      showError('Failed to load custom fields. Please try again.');
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

    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Field name must be 50 characters or less';
    }
    
    if (!formData.label.trim()) {
      newErrors.label = 'Display label is required';
    } else if (formData.label.length > 100) {
      newErrors.label = 'Display label must be 100 characters or less';
    }

    if (formData.fieldType === 'select' && !formData.options.trim()) {
      newErrors.options = 'Options are required for select fields';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fix the errors in the form');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const fieldData: any = {
        companyId: companyId!,
        entityType: entityType,
        name: sanitizeString(formData.name.trim(), 50),
        label: sanitizeString(formData.label.trim(), 100),
        fieldType: formData.fieldType,
        isRequired: formData.isRequired,
        displayOrder: formData.displayOrder || 0,
        isActive: formData.isActive,
        defaultValue: formData.defaultValue.trim() || undefined,
      };

      if (formData.fieldType === 'select') {
        // Validate options JSON
        try {
          const optionsArray = formData.options.split(',').map(opt => opt.trim()).filter(opt => opt);
          if (optionsArray.length === 0) {
            throw new Error('At least one option is required');
          }
          fieldData.options = JSON.stringify(optionsArray);
        } catch (error) {
          setErrors({ options: 'Invalid options format. Use comma-separated values.' });
          setLoading(false);
          return;
        }
      }

      if (editingField) {
        await client.models.CustomField.update({
          id: editingField.id,
          ...fieldData,
        });
        showSuccess('Custom field updated successfully!');
      } else {
        await client.models.CustomField.create(fieldData);
        showSuccess('Custom field created successfully!');
      }
      
      loadCustomFields();
      resetForm();
    } catch (error) {
      logger.error('Error saving custom field:', error);
      showError('Failed to save custom field. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: Schema['CustomField']['type'], e?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Reset form first to clear any previous state
    setEditingField(null);
    setShowForm(false);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setEditingField(field);
      setEntityType(field.entityType || 'Trip');
      setFormData({
        name: field.name,
        label: field.label,
        fieldType: field.fieldType || 'text',
        options: field.options ? JSON.parse(field.options).join(', ') : '',
        isRequired: field.isRequired || false,
        displayOrder: field.displayOrder || 0,
        isActive: field.isActive !== false,
        defaultValue: field.defaultValue || '',
      });
      setShowForm(true);
      setErrors({}); // Clear any previous errors
    }, 0);
  };

  const handleDelete = async (fieldId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this custom field? All values for this field will also be deleted.',
      'Delete Custom Field',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      // Delete all values for this field first
      const { data: values } = await client.models.CustomFieldValue.list({
        filter: { customFieldId: { eq: fieldId } }
      });
      
      if (values) {
        for (const value of values) {
          await client.models.CustomFieldValue.delete({ id: value.id });
        }
      }
      
      await client.models.CustomField.delete({ id: fieldId });
      showSuccess('Custom field deleted successfully!');
      loadCustomFields();
    } catch (error) {
      logger.error('Error deleting custom field:', error);
      showError('Failed to delete custom field. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      fieldType: 'text',
      options: '',
      isRequired: false,
      displayOrder: 0,
      isActive: true,
      defaultValue: '',
    });
    setEditingField(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content custom-field-management" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Custom Fields Management</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="entity-type-selector">
          <label>Entity Type:</label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as 'Trip' | 'Driver');
              setShowForm(false);
              setEditingField(null);
            }}
          >
            <option value="Trip">Trip Fields</option>
            <option value="Driver">Driver Fields</option>
          </select>
        </div>

        <div className="field-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Custom Field
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="custom-field-form">
            <div className="form-group">
              <label htmlFor="name">Field Name (Internal) *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                maxLength={50}
                placeholder="e.g., vehicleType"
                aria-invalid={!!errors.name}
              />
              <small>Internal identifier (no spaces, use camelCase)</small>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="label">Display Label *</label>
              <input
                type="text"
                id="label"
                value={formData.label}
                onChange={(e) => {
                  setFormData({ ...formData, label: e.target.value });
                  if (errors.label) setErrors({ ...errors, label: '' });
                }}
                required
                maxLength={100}
                placeholder="e.g., Vehicle Type"
                aria-invalid={!!errors.label}
              />
              {errors.label && <span className="error-message">{errors.label}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fieldType">Field Type *</label>
              <select
                id="fieldType"
                value={formData.fieldType}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    fieldType: e.target.value as any,
                    options: e.target.value === 'select' ? formData.options : '',
                  });
                }}
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="datetime">Date & Time</option>
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="select">Select (Dropdown)</option>
              </select>
            </div>

            {formData.fieldType === 'select' && (
              <div className="form-group">
                <label htmlFor="options">Options (comma-separated) *</label>
                <input
                  type="text"
                  id="options"
                  value={formData.options}
                  onChange={(e) => {
                    setFormData({ ...formData, options: e.target.value });
                    if (errors.options) setErrors({ ...errors, options: '' });
                  }}
                  placeholder="e.g., Sedan, SUV, Van, Truck"
                  aria-invalid={!!errors.options}
                />
                <small>Enter options separated by commas</small>
                {errors.options && <span className="error-message">{errors.options}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="defaultValue">Default Value</label>
              <input
                type="text"
                id="defaultValue"
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                placeholder="Optional default value"
              />
            </div>

            <div className="form-group">
              <label htmlFor="displayOrder">Display Order</label>
              <input
                type="number"
                id="displayOrder"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <small>Lower numbers appear first</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                />
                Required Field
              </label>
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

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingField ? 'Update' : 'Create'} Field
              </button>
            </div>
          </form>
        )}

        <div className="custom-fields-list">
          <h4>Custom Fields for {entityType}s ({customFields.length})</h4>
          {loading ? (
            <p>Loading...</p>
          ) : customFields.length === 0 ? (
            <p className="empty-message">No custom fields defined yet.</p>
          ) : (
            <table className="custom-fields-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customFields.map((field) => (
                  <tr key={field.id}>
                    <td><strong>{field.label}</strong></td>
                    <td>{field.name}</td>
                    <td>{field.fieldType}</td>
                    <td>{field.isRequired ? 'Yes' : 'No'}</td>
                    <td>{field.displayOrder || 0}</td>
                    <td>
                      <span className={field.isActive !== false ? 'status-active' : 'status-inactive'}>
                        {field.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={(e) => handleEdit(field, e)}
                          type="button"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(field.id)}
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

export default CustomFieldManagement;
