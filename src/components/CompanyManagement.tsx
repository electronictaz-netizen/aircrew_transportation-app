import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { validateUrl, sanitizeString, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { sendInvitationEmailViaLambda } from '../utils/sendInvitationEmail';
import { sendInvitationEmail } from '../utils/invitationEmail';
import { getBookingUrl } from '../utils/bookingUrl';
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
    bookingCode: '',
    bookingEnabled: false,
    subscriptionTier: 'premium' as 'free' | 'basic' | 'premium',
    subscriptionStatus: 'active' as 'active' | 'suspended' | 'cancelled',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<Schema['CompanyUser']['type'][]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'driver' as 'admin' | 'manager' | 'driver',
  });
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        displayName: company.displayName || '',
        logoUrl: company.logoUrl || '',
        subdomain: company.subdomain || '',
        bookingCode: company.bookingCode || '',
        bookingEnabled: company.bookingEnabled || false,
        subscriptionTier: (company.subscriptionTier as 'free' | 'basic' | 'premium') || 'premium',
        subscriptionStatus: (company.subscriptionStatus as 'active' | 'suspended' | 'cancelled') || 'active',
      });
      if (showUserManagement) {
        loadCompanyUsers();
      }
    }
  }, [company, showUserManagement]);

  const loadCompanyUsers = async () => {
    if (!company) return;
    
    try {
      setLoadingUsers(true);
      const { data } = await client.models.CompanyUser.list({
        filter: { companyId: { eq: company.id } },
      });
      setCompanyUsers(data || []);
    } catch (error) {
      logger.error('Error loading company users:', error);
      showError('Failed to load company users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      showError('No company found');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      // Check if user already exists for this company
      const { data: existing } = await client.models.CompanyUser.list({
        filter: {
          companyId: { eq: company.id },
          email: { eq: inviteData.email.toLowerCase().trim() },
        },
      });

      if (existing && existing.length > 0) {
        showError('User with this email is already associated with this company');
        return;
      }

      // Create CompanyUser record (user will be linked when they sign up)
      const { errors: createErrors } = await client.models.CompanyUser.create({
        companyId: company.id,
        userId: 'pending', // Placeholder until user signs up
        email: inviteData.email.toLowerCase().trim(),
        role: inviteData.role,
        isActive: false, // Inactive until user signs up and confirms
      } as any); // Type assertion needed because userId is required but we're using 'pending'

      if (createErrors && createErrors.length > 0) {
        showError('Error inviting user: ' + createErrors[0].message);
        return;
      }

      // Try to send invitation email via Lambda function, fall back to mailto if not configured
      try {
        const emailResult = await sendInvitationEmailViaLambda({
          email: inviteData.email.toLowerCase().trim(),
          companyName: company.name,
          role: inviteData.role,
        });
        
        // If Lambda is not configured (null), fall back to mailto
        if (emailResult === null) {
          // Lambda not configured - use mailto fallback
          sendInvitationEmail({
            email: inviteData.email.toLowerCase().trim(),
            companyName: company.name,
            role: inviteData.role,
          });
          showSuccess(
            `Invitation created for ${inviteData.email}!\n\n` +
            `An email has been opened in your email client. Please review and send it to complete the invitation.\n\n` +
            `They will be linked to the company when they sign up.`
          );
        } else if (emailResult.success) {
          // Lambda succeeded
          showSuccess(`Invitation sent successfully to ${inviteData.email}! They will receive an email with signup instructions.`);
        } else {
          // Lambda failed - fall back to mailto
          throw new Error(emailResult.error || 'Failed to send email');
        }
      } catch (emailError: any) {
        logger.error('Error sending invitation email via Lambda, falling back to mailto:', emailError);
        // Fall back to mailto if Lambda fails
        try {
          sendInvitationEmail({
            email: inviteData.email.toLowerCase().trim(),
            companyName: company.name,
            role: inviteData.role,
          });
          showSuccess(
            `Invitation created for ${inviteData.email}!\n\n` +
            `Automatic email sending failed, but an email has been opened in your email client as a fallback.\n\n` +
            `Please review and send it to complete the invitation. They will be linked to the company when they sign up.`
          );
        } catch (mailtoError) {
          // Even mailto failed - just show the invitation was created
          logger.error('Error opening mailto link:', mailtoError);
          showSuccess(
            `Invitation created for ${inviteData.email}!\n\n` +
            `However, we couldn't open your email client automatically. Please send them an invitation manually with this signup link:\n\n` +
            `${window.location.origin}/?signup=true&email=${encodeURIComponent(inviteData.email.toLowerCase().trim())}\n\n` +
            `They will be linked to the company when they sign up.`
          );
        }
      }
      
      setShowInviteForm(false);
      setInviteData({ email: '', role: 'driver' });
      await loadCompanyUsers(); // Reload users list
    } catch (error: any) {
      logger.error('Error inviting user:', error);
      showError('Failed to invite user. Please try again.');
    }
  };

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

    if (formData.bookingEnabled) {
      if (!formData.bookingCode.trim()) {
        newErrors.bookingCode = 'Booking code is required when booking portal is enabled';
      } else if (formData.bookingCode.length < 3) {
        newErrors.bookingCode = 'Booking code must be at least 3 characters';
      } else if (!/^[A-Z0-9]{3,20}$/.test(formData.bookingCode)) {
        newErrors.bookingCode = 'Booking code must contain only letters and numbers';
      }
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
        bookingCode: formData.bookingCode || undefined,
        bookingEnabled: formData.bookingEnabled,
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

        {/* Tabs */}
        <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <button
            type="button"
            className={!showUserManagement ? 'tab-active' : 'tab-inactive'}
            onClick={() => setShowUserManagement(false)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: !showUserManagement ? '2px solid #3b82f6' : '2px solid transparent',
              color: !showUserManagement ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontWeight: !showUserManagement ? '600' : '400',
            }}
          >
            Company Settings
          </button>
          <button
            type="button"
            className={showUserManagement ? 'tab-active' : 'tab-inactive'}
            onClick={() => {
              setShowUserManagement(true);
              loadCompanyUsers();
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: showUserManagement ? '2px solid #3b82f6' : '2px solid transparent',
              color: showUserManagement ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontWeight: showUserManagement ? '600' : '400',
            }}
          >
            User Management
          </button>
        </div>

        {!showUserManagement ? (
          /* Company Settings Form */

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
              placeholder="https://onyxdispatch.us/logo.png"
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
              <span className="subdomain-suffix">.onyxdispatch.us</span>
            </div>
            <small>Only lowercase letters, numbers, and hyphens allowed</small>
          </div>

          {/* Booking Portal Settings */}
          <div className="form-section-divider" style={{ margin: '2rem 0', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#333' }}>Booking Portal Settings</h4>
            
            {/* Display current booking code if it exists */}
            {formData.bookingCode && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: formData.bookingEnabled ? '#f0f9ff' : '#f9fafb', 
                borderRadius: '8px', 
                border: `1px solid ${formData.bookingEnabled ? '#bae6fd' : '#e5e7eb'}` 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: formData.bookingEnabled ? '#0369a1' : '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                      Your Unique Booking Code:
                    </strong>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '1.25rem', 
                      fontWeight: '600',
                      color: formData.bookingEnabled ? '#0c4a6e' : '#374151',
                      letterSpacing: '0.05em'
                    }}>
                      {formData.bookingCode}
                    </div>
                  </div>
                  {formData.bookingEnabled && (
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: '#10b981', 
                      color: 'white', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${formData.bookingEnabled ? '#bae6fd' : '#e5e7eb'}` }}>
                  <strong style={{ fontSize: '0.875rem', color: formData.bookingEnabled ? '#0369a1' : '#6b7280', display: 'block', marginBottom: '0.5rem' }}>
                    Your Booking URL:
                  </strong>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem', 
                    color: formData.bookingEnabled ? '#0c4a6e' : '#6b7280', 
                    wordBreak: 'break-all',
                    marginBottom: '0.5rem'
                  }}>
                    {getBookingUrl(formData.bookingCode)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getBookingUrl(formData.bookingCode));
                      showSuccess('Booking URL copied to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: formData.bookingEnabled ? '#0369a1' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    📋 Copy Booking URL
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.bookingEnabled}
                  onChange={(e) => setFormData({ ...formData, bookingEnabled: e.target.checked })}
                />
                <span>Enable Public Booking Portal</span>
              </label>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                Allow customers to book trips through a public booking portal
              </small>
            </div>

            {formData.bookingEnabled && (
              <div className="form-group">
                <label htmlFor="bookingCode">Booking Code *</label>
                <input
                  type="text"
                  id="bookingCode"
                  value={formData.bookingCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, bookingCode: value });
                    if (errors.bookingCode) setErrors({ ...errors, bookingCode: '' });
                  }}
                  required={formData.bookingEnabled}
                  placeholder="ACME123"
                  pattern="[A-Z0-9]{3,20}"
                  maxLength={20}
                  style={{ textTransform: 'uppercase' }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                  3-20 characters, letters and numbers only. This code will be used in your booking URL.
                </small>
                {errors.bookingCode && (
                  <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
                    {errors.bookingCode}
                  </div>
                )}
              </div>
            )}

            {!formData.bookingCode && !formData.bookingEnabled && (
              <div style={{ 
                padding: '1rem', 
                background: '#fef3c7', 
                borderRadius: '6px', 
                border: '1px solid #fbbf24',
                marginTop: '1rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                  <strong>💡 Tip:</strong> Enable the booking portal and set a booking code to allow customers to book trips directly through a public booking page.
                </p>
              </div>
            )}
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
        ) : (
          /* User Management Section */
          <div className="user-management">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4>Company Users</h4>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowInviteForm(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                + Invite User
              </button>
            </div>

            {showInviteForm && (
              <div className="invite-form" style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1.5rem', 
                marginBottom: '1.5rem',
                backgroundColor: '#f9fafb'
              }}>
                <h5 style={{ marginTop: 0, marginBottom: '1rem' }}>Invite New User</h5>
                <form onSubmit={handleInviteUser}>
                  <div className="form-group">
                    <label htmlFor="invite-email">Email Address *</label>
                    <input
                      type="email"
                      id="invite-email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      required
                      placeholder="user@onyxdispatch.us"
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="invite-role">Role *</label>
                    <select
                      id="invite-role"
                      value={inviteData.role}
                      onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'admin' | 'manager' | 'driver' })}
                      required
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    >
                      <option value="driver">Driver</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                      Managers can perform all actions except system admin capabilities. Drivers can only view their assigned trips.
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteData({ email: '', role: 'driver' });
                      }}
                      style={{ fontSize: '0.875rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem' }}
                    >
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div>
            ) : companyUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>No users found. Invite users to get started.</p>
              </div>
            ) : (
              <div className="users-list" style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Role</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            backgroundColor: user.role === 'admin' ? '#dbeafe' : user.role === 'manager' ? '#d1fae5' : '#f3f4f6',
                            color: user.role === 'admin' ? '#1e40af' : user.role === 'manager' ? '#065f46' : '#374151',
                            textTransform: 'capitalize'
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            backgroundColor: user.isActive ? '#d1fae5' : '#fef3c7',
                            color: user.isActive ? '#065f46' : '#92400e'
                          }}>
                            {user.isActive ? 'Active' : user.userId === 'pending' ? 'Pending Invitation' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}
    </div>
  );
}

export default CompanyManagement;
