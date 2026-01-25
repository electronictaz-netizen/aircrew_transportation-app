import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';
import './ReportConfigurationManagement.css';

const client = generateClient<Schema>();

interface ReportConfigurationManagementProps {
  onClose: () => void;
}

function ReportConfigurationManagement({ onClose }: ReportConfigurationManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [reportConfigs, setReportConfigs] = useState<Array<Schema['ReportConfiguration']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Schema['ReportConfiguration']['type'] | null>(null);
  const [reportType, setReportType] = useState<'Driver' | 'Trip'>('Driver');
  const [formData, setFormData] = useState({
    name: '',
    reportType: 'Driver' as 'Driver' | 'Trip',
    fields: [] as string[],
    grouping: [] as string[],
    filters: [] as Array<{ field: string; operator: string; value: string }>,
    sortBy: '',
    sortOrder: 'asc' as 'asc' | 'desc',
    displayOrder: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  useEffect(() => {
    if (companyId) {
      loadReportConfigs();
    }
  }, [companyId, reportType]);

  useEffect(() => {
    // Update available fields when report type changes
    if (reportType === 'Driver') {
      setAvailableFields([
        'name', 'email', 'phone', 'licenseNumber', 'isActive',
        'payRatePerTrip', 'payRatePerHour', 'notificationPreference',
      ]);
    } else {
      setAvailableFields([
        'pickupDate', 'flightNumber', 'pickupLocation', 'dropoffLocation',
        'numberOfPassengers', 'status', 'tripRate', 'driverPayAmount',
        'primaryLocationCategory', 'notes',
      ]);
    }
  }, [reportType]);

  const loadReportConfigs = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      // @ts-ignore - Complex union type from Amplify Data
      const { data: configsData } = await client.models.ReportConfiguration.list({
        filter: { 
          companyId: { eq: companyId },
          reportType: { eq: reportType },
        }
      });
      setReportConfigs((configsData || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (error) {
      logger.error('Error loading report configurations:', error);
      showError('Failed to load report configurations. Please try again.');
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
      newErrors.name = 'Report name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Report name must be 100 characters or less';
    }

    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field must be selected';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fix the errors in the form');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const configData: any = {
        companyId: companyId!,
        name: sanitizeString(formData.name.trim(), 100),
        reportType: formData.reportType,
        fields: JSON.stringify(formData.fields),
        grouping: JSON.stringify(formData.grouping),
        filters: JSON.stringify(formData.filters),
        sortBy: formData.sortBy || undefined,
        sortOrder: formData.sortOrder,
        displayOrder: formData.displayOrder || 0,
        isActive: formData.isActive,
      };

      if (editingConfig) {
        await client.models.ReportConfiguration.update({
          id: editingConfig.id,
          ...configData,
        });
        showSuccess('Report configuration updated successfully!');
      } else {
        await client.models.ReportConfiguration.create(configData);
        showSuccess('Report configuration created successfully!');
      }
      
      loadReportConfigs();
      resetForm();
    } catch (error) {
      logger.error('Error saving report configuration:', error);
      showError('Failed to save report configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: Schema['ReportConfiguration']['type'], e?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Reset form first to clear any previous state
    setEditingConfig(null);
    setShowForm(false);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setEditingConfig(config);
      setReportType(config.reportType || 'Driver');
      setFormData({
        name: config.name,
        reportType: config.reportType || 'Driver',
        fields: config.fields ? JSON.parse(config.fields) : [],
        grouping: config.grouping ? JSON.parse(config.grouping) : [],
        filters: config.filters ? JSON.parse(config.filters) : [],
        sortBy: config.sortBy || '',
        sortOrder: (config.sortOrder as 'asc' | 'desc') || 'asc',
        displayOrder: config.displayOrder || 0,
        isActive: config.isActive !== false,
      });
      setShowForm(true);
      setErrors({}); // Clear any previous errors
    }, 0);
  };

  const handleDelete = async (configId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this report configuration?',
      'Delete Report Configuration',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await client.models.ReportConfiguration.delete({ id: configId });
      showSuccess('Report configuration deleted successfully!');
      loadReportConfigs();
    } catch (error) {
      logger.error('Error deleting report configuration:', error);
      showError('Failed to delete report configuration. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reportType: 'Driver',
      fields: [],
      grouping: [],
      filters: [],
      sortBy: '',
      sortOrder: 'asc',
      displayOrder: 0,
      isActive: true,
    });
    setEditingConfig(null);
    setShowForm(false);
    setErrors({});
  };

  const toggleField = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter((f) => f !== field)
        : [...prev.fields, field],
    }));
  };

  const toggleGrouping = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      grouping: prev.grouping.includes(field)
        ? prev.grouping.filter((f) => f !== field)
        : [...prev.grouping, field],
    }));
  };

  const addFilter = () => {
    setFormData((prev) => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: 'eq', value: '' }],
    }));
  };

  const updateFilter = (index: number, updates: Partial<{ field: string; operator: string; value: string }>) => {
    setFormData((prev) => ({
      ...prev,
      filters: prev.filters.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }));
  };

  const removeFilter = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-config-management" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Configuration Management</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="report-type-selector">
          <label>Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as 'Driver' | 'Trip');
              setShowForm(false);
              setEditingConfig(null);
            }}
          >
            <option value="Driver">Driver Reports</option>
            <option value="Trip">Trip Reports</option>
          </select>
        </div>

        <div className="config-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Report Configuration
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="report-config-form">
            <div className="form-group">
              <label htmlFor="name">Report Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                maxLength={100}
                placeholder="e.g., Monthly Driver Summary"
                aria-invalid={!!errors.name}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Select Fields to Include *</label>
              <div className="field-checkboxes">
                {availableFields.map((field) => (
                  <label key={field} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.fields.includes(field)}
                      onChange={() => toggleField(field)}
                    />
                    {field}
                  </label>
                ))}
              </div>
              {errors.fields && <span className="error-message">{errors.fields}</span>}
            </div>

            <div className="form-group">
              <label>Grouping Fields (Optional)</label>
              <div className="field-checkboxes">
                {formData.fields.map((field) => (
                  <label key={field} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.grouping.includes(field)}
                      onChange={() => toggleGrouping(field)}
                    />
                    {field}
                  </label>
                ))}
              </div>
              <small>Select fields to group results by</small>
            </div>

            <div className="form-group">
              <label>Default Filters (Optional)</label>
              {formData.filters.map((filter, index) => (
                <div key={index} className="filter-row">
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                  >
                    <option value="">Select Field</option>
                    {formData.fields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value })}
                  >
                    <option value="eq">Equals</option>
                    <option value="ne">Not Equals</option>
                    <option value="gt">Greater Than</option>
                    <option value="gte">Greater Than or Equal</option>
                    <option value="lt">Less Than</option>
                    <option value="lte">Less Than or Equal</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    placeholder="Filter value"
                  />
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="btn-icon btn-delete"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={addFilter} className="btn btn-secondary">
                + Add Filter
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="sortBy">Sort By</label>
              <select
                id="sortBy"
                value={formData.sortBy}
                onChange={(e) => setFormData({ ...formData, sortBy: e.target.value })}
              >
                <option value="">None</option>
                {formData.fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            {formData.sortBy && (
              <div className="form-group">
                <label htmlFor="sortOrder">Sort Order</label>
                <select
                  id="sortOrder"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            )}

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
                {loading ? 'Saving...' : editingConfig ? 'Update' : 'Create'} Configuration
              </button>
            </div>
          </form>
        )}

        <div className="report-configs-list">
          <h4>Report Configurations for {reportType}s ({reportConfigs.length})</h4>
          {loading ? (
            <p>Loading...</p>
          ) : reportConfigs.length === 0 ? (
            <p className="empty-message">No report configurations defined yet.</p>
          ) : (
            <table className="report-configs-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Fields</th>
                  <th>Grouping</th>
                  <th>Sort</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportConfigs.map((config) => {
                  const fields = config.fields ? JSON.parse(config.fields) : [];
                  const grouping = config.grouping ? JSON.parse(config.grouping) : [];
                  return (
                    <tr key={config.id}>
                      <td><strong>{config.name}</strong></td>
                      <td>{fields.length} fields</td>
                      <td>{grouping.length > 0 ? grouping.join(', ') : 'None'}</td>
                      <td>{config.sortBy || 'None'}</td>
                      <td>{config.displayOrder || 0}</td>
                      <td>
                        <span className={config.isActive !== false ? 'status-active' : 'status-inactive'}>
                          {config.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-edit"
                            onClick={(e) => handleEdit(config, e)}
                            type="button"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(config.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

export default ReportConfigurationManagement;
