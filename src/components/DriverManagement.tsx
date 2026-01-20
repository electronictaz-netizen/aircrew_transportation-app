import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification, useConfirm, ConfirmDialog } from './Notification';
import NotificationComponent from './Notification';
import { canManageDrivers } from '../utils/rolePermissions';
import { Navigate } from 'react-router-dom';
import { validateName, validateEmail, validatePhone, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';
import { renderCustomFieldInput, validateCustomFieldValue } from '../utils/customFields.tsx';
import { driverFormSchema, type DriverFormData } from '../schemas/driverSchema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import './DriverManagement.css';

const client = generateClient<Schema>();

function DriverManagement() {
  const { companyId, userRole, loading: companyLoading } = useCompany();
  const [drivers, setDrivers] = useState<Array<Schema['Driver']['type']>>([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect drivers - they can't manage drivers
  if (!companyLoading && !canManageDrivers(userRole)) {
    return <Navigate to="/driver" replace />;
  }
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const { confirmState, confirm, handleCancel } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Schema['Driver']['type'] | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  
  // Initialize form with React Hook Form
  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      isActive: true,
      notificationPreference: 'email',
      payRatePerTrip: '',
      payRatePerHour: '',
    },
  });
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<Array<Schema['CustomField']['type']>>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadDrivers();
      loadCustomFields();
    }
  }, [companyId]);
  
  // Load custom fields for drivers
  const loadCustomFields = async () => {
    if (!companyId) return;
    
    try {
      setLoadingCustomFields(true);
      const { data: fieldsData } = await client.models.CustomField.list({
        filter: {
          companyId: { eq: companyId },
          entityType: { eq: 'Driver' },
          isActive: { eq: true },
        },
      });
      const sortedFields = (fieldsData || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCustomFields(sortedFields);
      
      // Initialize custom field values with defaults
      const initialValues: Record<string, string> = {};
      sortedFields.forEach((field) => {
        initialValues[field.id] = field.defaultValue || '';
      });
      setCustomFieldValues(initialValues);
    } catch (error) {
      logger.error('Error loading custom fields:', error);
    } finally {
      setLoadingCustomFields(false);
    }
  };
  
  // Load existing custom field values when editing a driver
  useEffect(() => {
    const loadExistingValues = async () => {
      if (!editingDriver?.id || !companyId || customFields.length === 0) return;
      
      try {
        const { data: valuesData } = await client.models.CustomFieldValue.list({
          filter: {
            companyId: { eq: companyId },
            driverId: { eq: editingDriver.id },
            entityType: { eq: 'Driver' },
          },
        });
        
        const existingValues: Record<string, string> = { ...customFieldValues };
        (valuesData || []).forEach((value) => {
          if (value.customFieldId) {
            existingValues[value.customFieldId] = value.value || '';
          }
        });
        setCustomFieldValues(existingValues);
      } catch (error) {
        logger.error('Error loading custom field values:', error);
      }
    };
    
    loadExistingValues();
  }, [editingDriver?.id, companyId, customFields.length]);

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

  // Helper function to save custom field values
  const saveCustomFieldValues = async (
    driverId: string,
    customFieldValues: Record<string, string>
  ) => {
    if (!companyId) return;
    
    try {
      // Get existing custom field values for this driver
      const { data: existingValues } = await client.models.CustomFieldValue.list({
        filter: {
          companyId: { eq: companyId },
          driverId: { eq: driverId },
          entityType: { eq: 'Driver' },
        },
      });
      
      // Create a map of existing values by customFieldId
      const existingMap = new Map<string, Schema['CustomFieldValue']['type']>();
      (existingValues || []).forEach((val) => {
        if (val.customFieldId) {
          existingMap.set(val.customFieldId, val);
        }
      });
      
      // Save or update custom field values
      for (const field of customFields) {
        const value = customFieldValues[field.id] || '';
        const stringValue = value.trim();
        
        const existing = existingMap.get(field.id);
        
        if (stringValue || field.isRequired) {
          if (existing) {
            // Update existing value
            await client.models.CustomFieldValue.update({
              id: existing.id,
              value: stringValue,
            });
          } else {
            // Create new value
            await client.models.CustomFieldValue.create({
              companyId: companyId!,
              customFieldId: field.id,
              entityType: 'Driver',
              driverId: driverId,
              value: stringValue,
            });
          }
        } else if (existing) {
          // Delete empty optional values
          await client.models.CustomFieldValue.delete({ id: existing.id });
        }
      }
    } catch (error) {
      logger.error('Error saving custom field values:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  const onSubmitForm = async (values: DriverFormData) => {
    if (!companyId) {
      showError('Company not found. Please contact support.');
      return;
    }

    // Validate custom fields
    const customFieldErrors: Record<string, string> = {};
    customFields.forEach((field) => {
      const value = customFieldValues[field.id] || '';
      const validation = validateCustomFieldValue(field, value);
      if (!validation.isValid) {
        customFieldErrors[`custom_${field.id}`] = validation.error || '';
      }
    });
    
    if (Object.keys(customFieldErrors).length > 0) {
      Object.entries(customFieldErrors).forEach(([key, error]) => {
        showError(`${key}: ${error}`);
      });
      return;
    }
    
    setFormLoading(true);

    try {
      // Sanitize inputs
      const nameValidation = validateName(values.name);
      const emailValidation = values.email ? validateEmail(values.email) : { isValid: true, sanitized: '' };
      const phoneValidation = values.phone ? validatePhone(values.phone) : { isValid: true, sanitized: '' };
      
      const driverData: any = {
        name: nameValidation.sanitized,
        email: emailValidation.sanitized || undefined,
        phone: phoneValidation.sanitized || undefined,
        licenseNumber: sanitizeString(values.licenseNumber || '', MAX_LENGTHS.LICENSE_NUMBER) || undefined,
        isActive: values.isActive,
        notificationPreference: values.notificationPreference,
        payRatePerTrip: values.payRatePerTrip ? parseFloat(values.payRatePerTrip) : undefined,
        payRatePerHour: values.payRatePerHour ? parseFloat(values.payRatePerHour) : undefined,
        customFieldValues: customFieldValues,
      };
      
      let driverId: string;
      if (editingDriver) {
        await client.models.Driver.update({
          id: editingDriver.id,
          ...driverData,
        });
        driverId = editingDriver.id;
        showSuccess('Driver updated successfully!');
      } else {
        const result = await client.models.Driver.create({
          ...driverData,
          companyId: companyId!,
        });
        if (!result.data) {
          throw new Error('Failed to create driver');
        }
        driverId = result.data.id;
        showSuccess('Driver created successfully!');
      }
      
      // Save custom field values
      if (driverData.customFieldValues && companyId) {
        await saveCustomFieldValues(driverId, driverData.customFieldValues);
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
    form.reset({
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
    form.reset({
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
    setCustomFieldValues({});
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="driver-form space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={MAX_LENGTHS.NAME}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      maxLength={MAX_LENGTHS.EMAIL}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      maxLength={MAX_LENGTHS.PHONE}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notificationPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Preference</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="both">Both (Email & In-App)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {form.watch('notificationPreference') === 'email' && 'Driver will receive email notifications'}
                    {form.watch('notificationPreference') === 'both' && 'Driver will receive email and in-app notifications'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-6 pt-6 border-t">
              <h4 className="mb-4 text-base font-semibold text-foreground">Pay Rate Information (for Payroll)</h4>
              
              <FormField
                control={form.control}
                name="payRatePerTrip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Rate Per Trip</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Fixed amount paid per completed trip (optional, for payroll calculation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payRatePerHour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Rate Per Hour</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Hourly rate for calculating pay based on trip duration (optional, for payroll calculation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormDescription className="mt-2 italic">
                Note: If both rates are set, per-trip rate takes precedence. If neither is set, pay will be calculated from trip-specific driver pay amount.
              </FormDescription>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="mb-4 text-base font-semibold text-foreground">Additional Information</h4>
                {loadingCustomFields ? (
                  <p className="text-muted-foreground italic">Loading custom fields...</p>
                ) : (
                  customFields.map((field) => {
                    const fieldError = form.formState.errors[`custom_${field.id}` as keyof typeof form.formState.errors];
                    return (
                      <div key={field.id} className="mb-4">
                        {renderCustomFieldInput(
                          field,
                          customFieldValues[field.id] || '',
                          (value) => {
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: value,
                            }));
                          },
                          fieldError ? String(fieldError) : undefined
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={resetForm} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : editingDriver ? 'Update' : 'Create'} Driver
              </Button>
            </div>
          </form>
        </Form>
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
