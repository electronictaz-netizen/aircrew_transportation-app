import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import './CompanyManagement.css';

const client = generateClient<Schema>();

interface CompanyManagementProps {
  onClose: () => void;
  onUpdate: () => void;
}

function CompanyManagement({ onClose, onUpdate }: CompanyManagementProps) {
  const { company, refreshCompany } = useCompany();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    subscriptionTier: 'premium' as 'free' | 'basic' | 'premium',
    subscriptionStatus: 'active' as 'active' | 'suspended' | 'cancelled',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
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
      alert('No company found. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      await client.models.Company.update({
        id: company.id,
        name: formData.name,
        subdomain: formData.subdomain,
        subscriptionTier: formData.subscriptionTier,
        subscriptionStatus: formData.subscriptionStatus,
      });

      await refreshCompany();
      onUpdate();
      alert('Company information updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error updating company:', error);
      if (error.errors?.[0]?.message?.includes('unique')) {
        alert('This subdomain is already taken. Please choose another.');
      } else {
        alert('Failed to update company information. Please try again.');
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Company Name"
            />
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyManagement;
