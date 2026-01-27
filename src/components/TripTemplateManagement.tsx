import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import ConfirmationDialog from './ConfirmationDialog';
import EmptyState from './EmptyState';
import LoadingButton from './LoadingButton';
import { showSuccess } from '../utils/toast';
import './TripTemplateManagement.css';

const client = generateClient<Schema>();

interface TripTemplateManagementProps {
  onClose: () => void;
  onTemplateSelect?: (template: Schema['TripTemplate']['type']) => void;
}

function TripTemplateManagement({ onClose, onTemplateSelect }: TripTemplateManagementProps) {
  const { companyId } = useCompany();
  const { notification, showError, hideNotification } = useNotification();
  const [templates, setTemplates] = useState<Array<Schema['TripTemplate']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Schema['TripTemplate']['type'] | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<Schema['Customer']['type']>>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tripType, setTripType] = useState<'Airport Trip' | 'Standard Trip'>('Airport Trip');
  const [primaryLocationCategory, setPrimaryLocationCategory] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [numberOfPassengers, setNumberOfPassengers] = useState(1);
  const [customerId, setCustomerId] = useState<string>('');
  const [tripRate, setTripRate] = useState('');
  const [driverPayAmount, setDriverPayAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadTemplates();
      loadCustomers();
    }
  }, [companyId]);

  const loadTemplates = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const { data: templatesData, errors } = await client.models.TripTemplate.list({
        filter: { companyId: { eq: companyId } },
      });

      if (errors) {
        console.error('Error loading templates:', errors);
        showError('Failed to load templates');
        return;
      }

      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      showError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!companyId) return;
    
    try {
      const { data: customersData } = await client.models.Customer.list({
        filter: { companyId: { eq: companyId }, isActive: { eq: true } },
      });
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTripType('Airport Trip');
    setPrimaryLocationCategory('');
    setFlightNumber('');
    setJobNumber('');
    setPickupLocation('');
    setDropoffLocation('');
    setNumberOfPassengers(1);
    setCustomerId('');
    setTripRate('');
    setDriverPayAmount('');
    setNotes('');
    setIsActive(true);
    setEditingTemplate(null);
  };

  const handleEdit = (template: Schema['TripTemplate']['type']) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || '');
    setTripType((template.tripType as 'Airport Trip' | 'Standard Trip') || 'Airport Trip');
    setPrimaryLocationCategory(template.primaryLocationCategory || '');
    setFlightNumber(template.flightNumber || '');
    setJobNumber(template.jobNumber || '');
    setPickupLocation(template.pickupLocation);
    setDropoffLocation(template.dropoffLocation);
    setNumberOfPassengers(template.numberOfPassengers || 1);
    setCustomerId(template.customerId || '');
    setTripRate(template.tripRate ? String(template.tripRate) : '');
    setDriverPayAmount(template.driverPayAmount ? String(template.driverPayAmount) : '');
    setNotes(template.notes || '');
    setIsActive(template.isActive !== false);
  };

  const handleSave = async () => {
    if (!companyId) return;

    if (!name.trim()) {
      showError('Template name is required');
      return;
    }

    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      showError('Pickup and dropoff locations are required');
      return;
    }

    setSaving(true);

    try {
      const templateData: any = {
        companyId,
        name: name.trim(),
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim(),
        numberOfPassengers: numberOfPassengers || 1,
        tripType,
        isActive,
      };

      if (description.trim()) {
        templateData.description = description.trim();
      }

      if (primaryLocationCategory.trim()) {
        templateData.primaryLocationCategory = primaryLocationCategory.trim();
      }

      if (tripType === 'Airport Trip' && flightNumber.trim()) {
        templateData.flightNumber = flightNumber.trim();
      }

      if (tripType === 'Standard Trip' && jobNumber.trim()) {
        templateData.jobNumber = jobNumber.trim();
      }

      if (customerId) {
        templateData.customerId = customerId;
      }

      if (tripRate.trim()) {
        templateData.tripRate = parseFloat(tripRate);
      }

      if (driverPayAmount.trim()) {
        templateData.driverPayAmount = parseFloat(driverPayAmount);
      }

      if (notes.trim()) {
        templateData.notes = notes.trim();
      }

      if (editingTemplate) {
        await client.models.TripTemplate.update({
          id: editingTemplate.id,
          ...templateData,
        });
        showSuccess('Template updated successfully!');
      } else {
        await client.models.TripTemplate.create(templateData);
        showSuccess('Template created successfully!');
      }

      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await client.models.TripTemplate.delete({ id: templateToDelete });
      showSuccess('Template deleted successfully!');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Failed to delete template. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    }
  };

  const handleUseTemplate = (template: Schema['TripTemplate']['type']) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="template-management">
        <div className="template-management-header">
          <h2>Trip Templates</h2>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
        <div className="loading-state">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="template-management">
      <NotificationComponent notification={notification} onClose={hideNotification} />
      
      <div className="template-management-header">
        <h2>Trip Templates</h2>
        <div className="header-actions">
          <Button onClick={resetForm} variant="outline">New Template</Button>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>

      <div className="template-management-content">
        <div className="template-form-section">
          <h3>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Template Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Airport to Downtown"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Trip Type *</label>
              <Select value={tripType} onValueChange={(value) => setTripType(value as 'Airport Trip' | 'Standard Trip')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Airport Trip">Airport Trip</SelectItem>
                  <SelectItem value="Standard Trip">Standard Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <label>Primary Location Category</label>
              <Input
                value={primaryLocationCategory}
                onChange={(e) => setPrimaryLocationCategory(e.target.value)}
                placeholder="e.g., Airport, Downtown"
              />
            </div>

            {tripType === 'Airport Trip' ? (
              <div className="form-group">
                <label>Flight Number Pattern</label>
                <Input
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., AA1234 (optional)"
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Job Number Pattern</label>
                <Input
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="e.g., PO-12345 (optional)"
                />
              </div>
            )}

            <div className="form-group">
              <label>Pickup Location *</label>
              <Input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="form-group">
              <label>Dropoff Location *</label>
              <Input
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="Enter dropoff location"
              />
            </div>

            <div className="form-group">
              <label>Number of Passengers</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={numberOfPassengers}
                onChange={(e) => setNumberOfPassengers(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="form-group">
              <label>Default Customer</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="No default customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.companyName ? ` (${customer.companyName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <label>Default Trip Rate</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tripRate}
                onChange={(e) => setTripRate(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Default Driver Pay</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={driverPayAmount}
                onChange={(e) => setDriverPayAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group full-width">
              <label>Default Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional default notes..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <label htmlFor="isActive" className="cursor-pointer">
                  Template is active
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {editingTemplate && (
              <Button onClick={resetForm} variant="outline">Cancel</Button>
            )}
            <LoadingButton
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || !name.trim() || !pickupLocation.trim() || !dropoffLocation.trim()}
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </LoadingButton>
          </div>
        </div>

        <div className="template-list-section">
          <h3>Saved Templates ({templates.length})</h3>
          
          {templates.length === 0 ? (
            <EmptyState
              icon="file"
              title="No Templates"
              description="Create your first template to save time when creating trips."
            />
          ) : (
            <div className="template-list">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  className={`template-card ${!template.isActive ? 'inactive' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="template-card-header">
                    <div>
                      <h4>{template.name}</h4>
                      {template.description && (
                        <p className="template-description">{template.description}</p>
                      )}
                    </div>
                    {!template.isActive && (
                      <span className="inactive-badge">Inactive</span>
                    )}
                  </div>

                  <div className="template-card-details">
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span>{template.tripType || 'Airport Trip'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Route:</span>
                      <span>{template.pickupLocation} → {template.dropoffLocation}</span>
                    </div>
                    {template.numberOfPassengers && (
                      <div className="detail-item">
                        <span className="detail-label">Passengers:</span>
                        <span>{template.numberOfPassengers}</span>
                      </div>
                    )}
                  </div>

                  <div className="template-card-actions">
                    {onTemplateSelect && (
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        disabled={!template.isActive}
                      >
                        Use Template
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setTemplateToDelete(template.id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

export default TripTemplateManagement;
