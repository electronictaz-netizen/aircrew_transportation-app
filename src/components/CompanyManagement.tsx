import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { validateUrl, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import './CompanyManagement.css';

const client = generateClient<Schema>();

interface CompanyManagementProps {
  onClose: () => void;
  onUpdate: () => void;
}

function CompanyManagement({ onClose, onUpdate }: CompanyManagementProps) {
  const { company, refreshCompany } = useCompany();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    logoUrl: '',
    subdomain: '',
    subscriptionTier: 'premium' as 'free' | 'basic' | 'premium',
    subscriptionStatus: 'active' as 'active' | 'suspended' | 'cancelled',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        displayName: company.displayName || '',
        logoUrl: company.logoUrl || '',
        subdomain: company.subdomain || '',
        subscriptionTier: (company.subscriptionTier as 'free' | 'basic' | 'premium') || 'premium',
        subscriptionStatus: (company.subscriptionStatus as 'active' | 'suspended' | 'cancelled') || 'active',
      });
    }
  }, [company]);

  const handleSubdomainChange = (value: string) => {
    // Sanitize subdomain (lowercase, alphanumeric and hyphens only)
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
    setFormData({ ...formData, subdomain: sanitized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      showError('No company found. Please contact support.');
      return;
    }

    // Validate inputs
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.length > MAX_LENGTHS.NAME) {
      newErrors.name = `Company name must be no more than ${MAX_LENGTHS.NAME} characters`;
    }
    
    if (formData.displayName && formData.displayName.length > MAX_LENGTHS.NAME) {
      newErrors.displayName = `Display name must be no more than ${MAX_LENGTHS.NAME} characters`;
    }
    
    if (formData.logoUrl) {
      const urlValidation = validateUrl(formData.logoUrl);
      if (!urlValidation.isValid) {
        newErrors.logoUrl = urlValidation.error || 'Invalid URL';
      }
    }
    
    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'Subdomain must be at least 3 characters';
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
      const sanitizedName = sanitizeString(formData.name, MAX_LENGTHS.NAME);
      const sanitizedDisplayName = sanitizeString(formData.displayName, MAX_LENGTHS.NAME);
      const logoUrlValidation = validateUrl(formData.logoUrl);
      
      await client.models.Company.update({
        id: company.id,
        name: sanitizedName,
        displayName: sanitizedDisplayName || undefined,
        logoUrl: logoUrlValidation.isValid ? logoUrlValidation.sanitized : undefined,
        subdomain: formData.subdomain,
        subscriptionTier: formData.subscriptionTier,
        subscriptionStatus: formData.subscriptionStatus,
      });

      await refreshCompany();
      onUpdate();
      showSuccess('Company information updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      logger.error('Error updating company:', error);
      if (error.errors?.[0]?.message?.includes('unique')) {
        showError('This subdomain is already taken. Please choose another.');
        setErrors({ subdomain: 'This subdomain is already taken' });
      } else {
        showError('Failed to update company information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!company) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Company Management</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="error-message">
            <p>No company found. Please contact support.</p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content company-management">
        <div className="modal-header">
          <h3>Company Information</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-group">
            <label htmlFor="name">Company Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              required
              placeholder="Company Name"
              maxLength={MAX_LENGTHS.NAME}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => {
                setFormData({ ...formData, displayName: e.target.value });
                if (errors.displayName) setErrors({ ...errors, displayName: '' });
              }}
              placeholder="Name displayed in the app (defaults to Company Name)"
              maxLength={MAX_LENGTHS.NAME}
              aria-invalid={!!errors.displayName}
              aria-describedby={errors.displayName ? 'displayName-error' : undefined}
            />
            <small>This name will be displayed at the top of the app. Leave empty to use Company Name.</small>
            {errors.displayName && <span id="displayName-error" className="error-message" role="alert">{errors.displayName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="logoUrl">Logo URL</label>
            <input
              type="url"
              id="logoUrl"
              value={formData.logoUrl}
              onChange={(e) => {
                setFormData({ ...formData, logoUrl: e.target.value });
                if (errors.logoUrl) setErrors({ ...errors, logoUrl: '' });
              }}
              placeholder="https://example.com/logo.png"
              maxLength={2048}
              aria-invalid={!!errors.logoUrl}
              aria-describedby={errors.logoUrl ? 'logoUrl-error' : undefined}
            />
            <small>Enter a URL to your company logo. The logo will appear to the right of the display name.</small>
            {errors.logoUrl && <span id="logoUrl-error" className="error-message" role="alert">{errors.logoUrl}</span>}
            {formData.logoUrl && !errors.logoUrl && (
              <div className="logo-preview">
                <img 
                  src={formData.logoUrl} 
                  alt="Logo preview" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    showError('Failed to load logo image. Please check the URL.');
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="subdomain">Subdomain *</label>
            <div className="subdomain-input">
              <input
                type="text"
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                required
                placeholder="company"
                pattern="[a-z0-9-]+"
              />
              <span className="subdomain-suffix">.yourapp.com</span>
            </div>
            <small>Only lowercase letters, numbers, and hyphens allowed</small>
          </div>

          <div className="form-group">
            <label htmlFor="subscriptionTier">Subscription Tier</label>
            <select
              id="subscriptionTier"
              value={formData.subscriptionTier}
              onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as 'free' | 'basic' | 'premium' })}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subscriptionStatus">Subscription Status</label>
            <select
              id="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value as 'active' | 'suspended' | 'cancelled' })}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}
    </div>
  );
}

export default CompanyManagement;
