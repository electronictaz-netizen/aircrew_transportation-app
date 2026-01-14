import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import './FilterCategoryManagement.css';

const client = generateClient<Schema>();

interface FilterCategoryManagementProps {
  onClose: () => void;
  onUpdate: () => void;
  locations?: Array<Schema['Location']['type']>;
}

function FilterCategoryManagement({ onClose, onUpdate, locations = [] }: FilterCategoryManagementProps) {
  const { companyId } = useCompany();
  const [filterCategories, setFilterCategories] = useState<Array<Schema['FilterCategory']['type']>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Schema['FilterCategory']['type'] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    field: 'locationCategory',
    values: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadFilterCategories();
  }, [companyId]);

  const loadFilterCategories = async () => {
    if (!companyId) return;
    
    try {
      const { data } = await client.models.FilterCategory.list({
        filter: { companyId: { eq: companyId } },
      });
      setFilterCategories((data || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (error) {
      console.error('Error loading filter categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      alert('Company not found. Please contact support.');
      return;
    }

    try {
      // Parse values as JSON array
      let valuesArray: string[] = [];
      if (formData.values.trim()) {
        try {
          valuesArray = JSON.parse(formData.values);
          if (!Array.isArray(valuesArray)) {
            throw new Error('Values must be a JSON array');
          }
        } catch (parseError) {
          // If not valid JSON, treat as comma-separated values
          valuesArray = formData.values.split(',').map(v => v.trim()).filter(v => v);
        }
      }

      if (editingCategory) {
        await client.models.FilterCategory.update({
          id: editingCategory.id,
          name: formData.name,
          field: formData.field,
          values: JSON.stringify(valuesArray),
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        });
      } else {
        await client.models.FilterCategory.create({
          name: formData.name,
          field: formData.field,
          values: JSON.stringify(valuesArray),
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          companyId: companyId!,
        });
      }
      onUpdate();
      resetForm();
      loadFilterCategories();
    } catch (error) {
      console.error('Error saving filter category:', error);
      alert('Failed to save filter category. Please try again.');
    }
  };

  const handleEdit = (category: Schema['FilterCategory']['type']) => {
    setEditingCategory(category);
    try {
      const valuesArray = category.values ? JSON.parse(category.values) : [];
      setFormData({
        name: category.name,
        field: category.field || 'locationCategory',
        values: Array.isArray(valuesArray) ? valuesArray.join(', ') : category.values || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive ?? true,
      });
    } catch {
      setFormData({
        name: category.name,
        field: category.field || 'locationCategory',
        values: category.values || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive ?? true,
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this filter category?')) return;
    try {
      await client.models.FilterCategory.delete({ id: categoryId });
      loadFilterCategories();
      onUpdate();
    } catch (error) {
      console.error('Error deleting filter category:', error);
      alert('Failed to delete filter category. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      field: 'locationCategory',
      values: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content filter-category-management">
        <div className="modal-header">
          <h3>Filter Categories</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="info-section" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <strong>Filter Categories</strong> allow you to create custom filter buttons (like the airport filters) 
            for your company. Categories can filter by location categories, pickup/dropoff locations, or other trip fields.
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
            <strong>Tip:</strong> For "Location Category" filters, use the "Auto-fill" button to automatically populate 
            values from your existing location categories.
          </p>
        </div>

        <div className="category-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Filter Category
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
              <label htmlFor="name">Category Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Airports, Service Type, Region"
              />
            </div>

            <div className="form-group">
              <label htmlFor="field">Filter Field *</label>
              <select
                id="field"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                required
              >
                <option value="locationCategory">Location Category</option>
                <option value="pickupLocation">Pickup Location</option>
                <option value="dropoffLocation">Dropoff Location</option>
                <option value="primaryLocationCategory">Primary Location Category</option>
              </select>
              <small>Which field to filter on</small>
            </div>

            <div className="form-group">
              <label htmlFor="values">Filter Values</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="text"
                  id="values"
                  value={formData.values}
                  onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                  placeholder="Comma-separated: Airport, Hotel, Office"
                  style={{ flex: 1 }}
                />
                {formData.field === 'locationCategory' || formData.field === 'primaryLocationCategory' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      // Auto-populate from location categories
                      const categories = new Set<string>();
                      locations
                        .filter(l => l.isActive !== false && l.category)
                        .forEach(l => categories.add(l.category!));
                      const categoryArray = Array.from(categories).sort();
                      setFormData({ ...formData, values: categoryArray.join(', ') });
                    }}
                    title="Auto-populate from existing location categories"
                  >
                    Auto-fill
                  </button>
                ) : null}
              </div>
              <small>
                {formData.field === 'locationCategory' || formData.field === 'primaryLocationCategory' 
                  ? 'Enter values manually or click "Auto-fill" to use existing location categories'
                  : 'Enter comma-separated values to filter on'}
              </small>
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
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active (shown in filters)
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCategory ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        )}

        <div className="categories-list">
          <h4>Filter Categories ({filterCategories.filter(c => c.isActive !== false).length} active, {filterCategories.length} total)</h4>
          {filterCategories.length === 0 ? (
            <p className="empty-message">No filter categories added yet. Add categories to create custom filter buttons.</p>
          ) : (
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Field</th>
                  <th>Values</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterCategories.map((category) => {
                  let valuesDisplay = '-';
                  try {
                    const valuesArray = category.values ? JSON.parse(category.values) : [];
                    if (Array.isArray(valuesArray) && valuesArray.length > 0) {
                      valuesDisplay = valuesArray.join(', ');
                    }
                  } catch {}
                  
                  return (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.field}</td>
                      <td style={{ fontSize: '0.875rem' }}>{valuesDisplay}</td>
                      <td>{category.displayOrder || 0}</td>
                      <td>
                        <span className={category.isActive ? 'status-active' : 'status-inactive'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEdit(category)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(category.id)}
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
    </div>
  );
}

export default FilterCategoryManagement;
