import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { validateName, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import './CustomerManagement.css';

const client = generateClient<Schema>();

interface CustomerManagementProps {
  customers: Array<Schema['Customer']['type']>;
  onClose: () => void;
  onUpdate: () => void;
}

function CustomerManagement({ customers, onClose, onUpdate }: CustomerManagementProps) {
  const { companyId } = useCompany();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Schema['Customer']['type'] | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    notes: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Phone is optional
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
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
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.companyName && formData.companyName.length > 100) {
      newErrors.companyName = 'Company name must be no more than 100 characters';
    }
    
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be no more than 500 characters';
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
      const customerData = {
        name: nameValidation.sanitized,
        email: sanitizeString(formData.email, 100) || undefined,
        phone: sanitizeString(formData.phone, 20) || undefined,
        companyName: sanitizeString(formData.companyName, 100) || undefined,
        notes: sanitizeString(formData.notes, 500) || undefined,
        isActive: formData.isActive,
      };
      
      if (editingCustomer) {
        const updateData: {
          id: string;
          name: string;
          email?: string;
          phone?: string;
          companyName?: string;
          notes?: string;
          isActive: boolean;
        } = {
          id: editingCustomer.id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          companyName: customerData.companyName,
          notes: customerData.notes,
          isActive: customerData.isActive,
        };
        // @ts-ignore - Complex union type inference
        await client.models.Customer.update(updateData);
        showSuccess('Customer updated successfully!');
      } else {
        const createData: {
          name: string;
          email?: string;
          phone?: string;
          companyName?: string;
          notes?: string;
          isActive: boolean;
          companyId: string;
        } = {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          companyName: customerData.companyName,
          notes: customerData.notes,
          isActive: customerData.isActive,
          companyId: companyId!,
        };
        // @ts-ignore - Complex union type inference
        await client.models.Customer.create(createData);
        showSuccess('Customer created successfully!');
      }
      onUpdate();
      resetForm();
    } catch (error) {
      logger.error('Error saving customer:', error);
      showError('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Schema['Customer']['type']) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      companyName: customer.companyName || '',
      notes: customer.notes || '',
      isActive: customer.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this customer?',
      'Delete Customer',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await client.models.Customer.delete({ id: customerId });
      showSuccess('Customer deleted successfully!');
      onUpdate();
    } catch (error) {
      logger.error('Error deleting customer:', error);
      showError('Failed to delete customer. Please try again.');
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === companyCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(companyCustomers.map(c => c.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.size === 0) return;
    
    const count = selectedCustomers.size;
    const confirmed = await confirm(
      `Are you sure you want to delete ${count} customer${count > 1 ? 's' : ''}?`,
      'Delete Customers',
      'danger'
    );
    if (!confirmed) return;
    
    setLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const customerId of selectedCustomers) {
        try {
          await client.models.Customer.delete({ id: customerId });
          successCount++;
        } catch (error) {
          logger.error(`Error deleting customer ${customerId}:`, error);
          failCount++;
        }
      }
      
      setSelectedCustomers(new Set());
      onUpdate();
      
      if (failCount > 0) {
        showWarning(`Deleted ${successCount} customer${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        showSuccess(`Successfully deleted ${successCount} customer${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      logger.error('Error deleting customers:', error);
      showError('Failed to delete some customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      notes: '',
      isActive: true,
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  // Filter customers to ensure only customers for the current company are shown
  const companyCustomers = customers.filter(c => c.companyId === companyId);
  const activeCustomers = companyCustomers.filter(c => c.isActive !== false);
  
  // Log warning if customers from other companies are detected (for debugging)
  if (companyId && customers.length > companyCustomers.length) {
    const otherCompanyCustomers = customers.filter(c => c.companyId !== companyId);
    logger.warn('Customer data isolation issue detected:', {
      currentCompanyId: companyId,
      totalCustomers: customers.length,
      companyCustomers: companyCustomers.length,
      otherCompanyCustomers: otherCompanyCustomers.length,
      otherCompanyIds: [...new Set(otherCompanyCustomers.map(c => c.companyId))],
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content customer-management">
        <div className="modal-header">
          <h3>Customer Management</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customer-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Customer
          </button>
          {selectedCustomers.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
              title={`Delete ${selectedCustomers.size} selected customer${selectedCustomers.size > 1 ? 's' : ''}`}
            >
              Delete Selected ({selectedCustomers.size})
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-group">
              <label htmlFor="name">Customer Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                placeholder="e.g., John Smith, ABC Corporation"
                maxLength={MAX_LENGTHS.NAME}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
            </div>

            <div className="form-row">
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
                  placeholder="customer@example.com"
                  maxLength={100}
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
                  placeholder="(555) 123-4567"
                  maxLength={20}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && <span id="phone-error" className="error-message" role="alert">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="companyName">Company/Organization</label>
              <input
                type="text"
                id="companyName"
                value={formData.companyName}
                onChange={(e) => {
                  setFormData({ ...formData, companyName: e.target.value });
                  if (errors.companyName) setErrors({ ...errors, companyName: '' });
                }}
                placeholder="e.g., ABC Corporation, XYZ Inc."
                maxLength={100}
                aria-invalid={!!errors.companyName}
                aria-describedby={errors.companyName ? 'companyName-error' : undefined}
              />
              {errors.companyName && <span id="companyName-error" className="error-message" role="alert">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the customer"
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
                Active (available for selection)
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                {loading ? 'Saving...' : editingCustomer ? 'Update' : 'Create'} Customer
              </button>
            </div>
          </form>
        )}

        <div className="customers-list">
          <h4>Customers ({activeCustomers.length} active, {companyCustomers.length} total)</h4>
          {companyCustomers.length === 0 ? (
            <p className="empty-message">No customers added yet. Add customers to make them available for trip assignment.</p>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === companyCustomers.length && companyCustomers.length > 0}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyCustomers.map((customer) => (
                  <tr key={customer.id} className={selectedCustomers.has(customer.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                      />
                    </td>
                    <td>{customer.name}</td>
                    <td>{customer.companyName || '-'}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>
                      <span className={customer.isActive ? 'status-active' : 'status-inactive'}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(customer)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(customer.id)}
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

export default CustomerManagement;
