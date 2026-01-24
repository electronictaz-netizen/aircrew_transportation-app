import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useAdminAccess, isSystemAdmin } from '../utils/adminAccess';
import { Navigate, Link } from 'react-router-dom';
import { sendInvitationEmailViaLambda } from '../utils/sendInvitationEmail';
import { sendInvitationEmail } from '../utils/invitationEmail';
import './AdminDashboard.css';

const client = generateClient<Schema>();

type CompanyWithUsers = Schema['Company']['type'] & {
  userCount?: number;
};

function AdminDashboard() {
  const { company: _currentCompany, setAdminSelectedCompany, isAdminOverride } = useCompany();
  const hasAdminAccess = useAdminAccess();
  const [companies, setCompanies] = useState<CompanyWithUsers[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Schema['Company']['type'] | null>(null);
  const [companyUsers, setCompanyUsers] = useState<Schema['CompanyUser']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    subscriptionTier: 'premium' as 'free' | 'basic' | 'premium',
    subscriptionStatus: 'active' as 'active' | 'suspended' | 'cancelled',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'driver' as 'admin' | 'manager' | 'driver',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyUsers((selectedCompany as Schema['Company']['type']).id);
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    // Additional security check before loading data
    if (!hasAdminAccess) {
      console.warn('[AdminDashboard] Access denied - preventing data load');
      return;
    }

    try {
      setLoading(true);
      console.log('[AdminDashboard] Loading companies...');
      const { data, errors } = await client.models.Company.list();
      
      if (errors && errors.length > 0) {
        console.error('[AdminDashboard] Errors loading companies:', errors);
        alert(`Failed to load companies: ${errors.map(e => e.message).join(', ')}`);
        return;
      }
      
      console.log('[AdminDashboard] Companies loaded:', data?.length || 0, 'companies');
      
      if (!data || data.length === 0) {
        console.warn('[AdminDashboard] No companies found in database');
        setCompanies([]);
        return;
      }
      
      // Get user count for each company
      const companiesWithCounts = await Promise.all(
        (data || []).map(async (company) => {
          try {
            const { data: users } = await client.models.CompanyUser.list({
              filter: { companyId: { eq: company.id } },
            });
            return {
              ...company,
              userCount: users?.length || 0,
            };
          } catch (userError) {
            console.error(`[AdminDashboard] Error loading users for company ${company.id}:`, userError);
            return {
              ...company,
              userCount: 0,
            };
          }
        })
      );
      
      console.log('[AdminDashboard] Companies with counts:', companiesWithCounts.length);
      setCompanies(companiesWithCounts);
    } catch (error: any) {
      console.error('[AdminDashboard] Error loading companies:', error);
      console.error('[AdminDashboard] Error details:', {
        message: error?.message,
        errors: error?.errors,
        stack: error?.stack,
      });
      alert(`Failed to load companies: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyUsers = async (companyId: string) => {
    try {
      const { data } = await client.models.CompanyUser.list({
        filter: { companyId: { eq: companyId } },
      });
      setCompanyUsers(data || []);
    } catch (error) {
      console.error('Error loading company users:', error);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate subdomain
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      alert('Subdomain can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // Check if subdomain already exists
    const { data: existing } = await client.models.Company.list({
      filter: { subdomain: { eq: formData.subdomain } },
    });

    if (existing && existing.length > 0) {
      alert('Subdomain already exists. Please choose a different one.');
      return;
    }

    try {
      const { data, errors } = await client.models.Company.create({
        name: formData.name,
        subdomain: formData.subdomain.toLowerCase(),
        isActive: true,
        subscriptionTier: formData.subscriptionTier,
        subscriptionStatus: formData.subscriptionStatus,
      });

      if (errors && errors.length > 0) {
        alert('Error creating company: ' + errors[0].message);
        return;
      }

      if (!data) {
        alert('Failed to create company');
        return;
      }

      alert('Company created successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        subdomain: '',
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });
      loadCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      alert('Failed to create company: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRestoreGLS = async () => {
    if (!confirm('This will find or create the GLS Transportation company and link your account to it. Continue?')) {
      return;
    }

    try {
      // Find or create GLS company
      const { data: companiesGLS } = await client.models.Company.list({
        filter: { name: { eq: 'GLS' } }
      });
      const { data: companiesGLSTransport } = await client.models.Company.list({
        filter: { name: { eq: 'GLS Transportation' } }
      });

      let glsCompany: Schema['Company']['type'] | null = null;

      if (companiesGLSTransport && companiesGLSTransport.length > 0) {
        glsCompany = companiesGLSTransport[0];
      } else if (companiesGLS && companiesGLS.length > 0) {
        glsCompany = companiesGLS[0];
        // Update name
        const { data: updated } = await client.models.Company.update({
          id: glsCompany.id,
          name: 'GLS Transportation',
        });
        if (updated) glsCompany = updated;
      } else {
        // Create GLS company
        const { data: newCompany, errors } = await client.models.Company.create({
          name: 'GLS Transportation',
          subdomain: 'gls',
          isActive: true,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
        });

        if (errors && errors.length > 0) {
          alert(`Failed to create company: ${errors.map(e => e.message).join(', ')}`);
          return;
        }

        if (!newCompany) {
          alert('Failed to create company');
          return;
        }

        glsCompany = newCompany;
      }

      if (!glsCompany) {
        alert('Failed to get or create GLS company');
        return;
      }

      // Get current user
      const { getCurrentUser } = await import('aws-amplify/auth');
      const user = await getCurrentUser();
      const userId = user.userId;
      const userEmail = user.signInDetails?.loginId || user.username || '';

      // Check if CompanyUser exists
      const { data: existingUsers } = await client.models.CompanyUser.list({
        filter: { 
          companyId: { eq: glsCompany.id },
          userId: { eq: userId }
        }
      });

      if (existingUsers && existingUsers.length > 0) {
        const companyUser = existingUsers[0];
        if (!companyUser.isActive) {
          await client.models.CompanyUser.update({
            id: companyUser.id,
            isActive: true,
          });
        }
        alert('GLS company access restored! Your account is already linked. Refreshing...');
      } else {
        // Create CompanyUser
        const { errors: userErrors } = await client.models.CompanyUser.create({
          companyId: glsCompany.id,
          userId: userId,
          email: userEmail,
          role: 'admin',
          isActive: true,
        });

        if (userErrors && userErrors.length > 0) {
          alert(`Failed to create CompanyUser: ${userErrors.map(e => e.message).join(', ')}`);
          return;
        }

        alert('GLS company access restored! Your account has been linked. Refreshing...');
      }

      // Refresh and reload
      loadCompanies();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error restoring GLS access:', error);
      alert(`Failed to restore GLS access: ${error?.message || 'Unknown error'}\n\nCheck the browser console for details.`);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      alert('No company selected');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // Check if user already exists for this company
      const { data: existing } = await client.models.CompanyUser.list({
        filter: {
          companyId: { eq: selectedCompany.id },
          email: { eq: inviteData.email },
        },
      });

      if (existing && existing.length > 0) {
        alert('User with this email is already associated with this company');
        return;
      }

      // Create CompanyUser record (user will be linked when they sign up)
      // Note: userId will be 'pending' until user signs up
      const { errors } = await client.models.CompanyUser.create({
        companyId: selectedCompany.id,
        userId: 'pending', // Placeholder until user signs up
        email: inviteData.email.toLowerCase().trim(),
        role: inviteData.role,
        isActive: false, // Inactive until user signs up and confirms
      } as any); // Type assertion needed because userId is required but we're using 'pending'

      if (errors && errors.length > 0) {
        alert('Error inviting user: ' + errors[0].message);
        return;
      }

      // Try to send invitation email via Lambda function, fall back to mailto if not configured
      try {
        const emailResult = await sendInvitationEmailViaLambda({
          email: inviteData.email.toLowerCase().trim(),
          companyName: selectedCompany.name,
          role: inviteData.role,
        });
        
        // If Lambda is not configured (null), fall back to mailto
        if (emailResult === null) {
          // Lambda not configured - use mailto fallback
          sendInvitationEmail({
            email: inviteData.email.toLowerCase().trim(),
            companyName: selectedCompany.name,
            role: inviteData.role,
          });
          alert(
            `Invitation created for ${inviteData.email}!\n\n` +
            `An email has been opened in your email client. Please review and send it to complete the invitation.\n\n` +
            `They will be linked to the company when they sign up.`
          );
        } else if (emailResult.success) {
          // Lambda succeeded
          alert(`Invitation sent successfully to ${inviteData.email}! They will receive an email with signup instructions.`);
        } else {
          // Lambda failed - fall back to mailto
          throw new Error(emailResult.error || 'Failed to send email');
        }
      } catch (emailError: any) {
        console.error('Error sending invitation email via Lambda, falling back to mailto:', emailError);
        // Fall back to mailto if Lambda fails
        try {
          sendInvitationEmail({
            email: inviteData.email.toLowerCase().trim(),
            companyName: selectedCompany.name,
            role: inviteData.role,
          });
          alert(
            `Invitation created for ${inviteData.email}!\n\n` +
            `Automatic email sending failed, but an email has been opened in your email client as a fallback.\n\n` +
            `Please review and send it to complete the invitation. They will be linked to the company when they sign up.\n\n` +
            `Error: ${emailError.message || 'Unknown error'}`
          );
        } catch (mailtoError) {
          // Even mailto failed - just show the invitation was created
          console.error('Error opening mailto link:', mailtoError);
          alert(
            `Invitation created for ${inviteData.email}!\n\n` +
            `However, we couldn't open your email client automatically. Please send them an invitation manually with this signup link:\n\n` +
            `${window.location.origin}/?signup=true&email=${encodeURIComponent(inviteData.email.toLowerCase().trim())}\n\n` +
            `They will be linked to the company when they sign up.`
          );
        }
      }
      
      setShowInviteForm(null);
      setInviteData({ email: '', role: 'driver' });
      loadCompanyUsers(selectedCompany.id);
    } catch (error: any) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateCompany = async (company: Schema['Company']['type'], updates: Partial<Schema['Company']['type']>) => {
    try {
      const { errors } = await client.models.Company.update({
        id: company.id,
        ...updates,
      });

      if (errors && errors.length > 0) {
        alert('Error updating company: ' + errors[0].message);
        return;
      }

      alert('Company updated successfully!');
      loadCompanies();
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ ...selectedCompany, ...updates });
      }
    } catch (error: any) {
      console.error('Error updating company:', error);
      alert('Failed to update company: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      // First, delete all CompanyUser records
      const { data: users } = await client.models.CompanyUser.list({
        filter: { companyId: { eq: companyId } },
      });

      if (users) {
        for (const user of users) {
          await client.models.CompanyUser.delete({ id: user.id });
        }
      }

      // Then delete the company
      const { errors } = await client.models.Company.delete({ id: companyId });

      if (errors && errors.length > 0) {
        alert('Error deleting company: ' + errors[0].message);
        return;
      }

      alert('Company deleted successfully!');
      loadCompanies();
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
        setCompanyUsers([]);
      }
    } catch (error: any) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateUserRole = async (user: Schema['CompanyUser']['type'], newRole: 'admin' | 'manager' | 'driver') => {
    try {
      const { errors } = await client.models.CompanyUser.update({
        id: user.id,
        role: newRole,
      });

      if (errors && errors.length > 0) {
        alert('Error updating user role: ' + errors[0].message);
        return;
      }

      alert('User role updated successfully!');
      if (selectedCompany) {
        loadCompanyUsers(selectedCompany.id);
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the company?')) {
      return;
    }

    try {
      const { errors } = await client.models.CompanyUser.delete({ id: userId });

      if (errors && errors.length > 0) {
        alert('Error removing user: ' + errors[0].message);
        return;
      }

      alert('User removed successfully!');
      if (selectedCompany) {
        loadCompanyUsers(selectedCompany.id);
      }
    } catch (error: any) {
      console.error('Error removing user:', error);
      alert('Failed to remove user: ' + (error.message || 'Unknown error'));
    }
  };

  // Double-check admin access (redundant protection)
  if (!hasAdminAccess) {
    console.warn('[AdminDashboard] Access denied - redirecting');
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the Admin Dashboard.</p>
          <p>Only authorized administrators can access this section.</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            If you believe this is an error, please contact your system administrator.
          </p>
          <Navigate to="/management" replace />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Company Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdminOverride && (
            <Link to="/management" className="btn btn-secondary">
              Manage Selected Company
            </Link>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + Create New Company
          </button>
        </div>
      </div>
      
      {isAdminOverride && (
        <div className="admin-notice" style={{ 
          padding: '1rem', 
          backgroundColor: '#dbeafe', 
          border: '1px solid #3b82f6', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <strong>Admin Mode:</strong> You are currently working as "{_currentCompany?.name}". 
          <button 
            onClick={() => setAdminSelectedCompany(null)}
            style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem' }}
            className="btn btn-sm"
          >
            Clear Selection
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Company</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Acme Transportation"
                />
              </div>

              <div className="form-group">
                <label>Subdomain *</label>
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  placeholder="e.g., acme"
                  pattern="[a-z0-9-]+"
                />
                <small>Lowercase letters, numbers, and hyphens only</small>
              </div>

              <div className="form-group">
                <label>Subscription Tier</label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create Company</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="companies-grid">
        <div className="companies-list">
          <h2>All Companies ({companies.length})</h2>
          <table className="companies-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subdomain</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className={selectedCompany?.id === company.id ? 'selected' : ''}
                  onClick={() => setSelectedCompany(company)}
                >
                  <td>{company.name}</td>
                  <td>{company.subdomain}</td>
                  <td>
                    <span className={`badge tier-${company.subscriptionTier}`}>
                      {company.subscriptionTier}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-${company.subscriptionStatus}`}>
                      {company.subscriptionStatus}
                    </span>
                  </td>
                  <td>{company.userCount || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(company as CompanyWithUsers);
                        }}
                      >
                        View Users
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdminSelectedCompany(company.id);
                        }}
                      >
                        Work As
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCompany && (
          <div className="company-details">
            <div className="company-details-header">
              <h2>{selectedCompany.name}</h2>
              <button className="btn btn-sm" onClick={() => setSelectedCompany(null)}>×</button>
            </div>

            <div className="company-info">
              <div className="info-item">
                <label>Subdomain:</label>
                <span>{selectedCompany.subdomain}</span>
              </div>
              <div className="info-item">
                <label>Tier:</label>
                <select
                  value={selectedCompany.subscriptionTier || 'premium'}
                  onChange={(e) => handleUpdateCompany(selectedCompany, { subscriptionTier: e.target.value as any })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <select
                  value={selectedCompany.subscriptionStatus || 'active'}
                  onChange={(e) => handleUpdateCompany(selectedCompany, { subscriptionStatus: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="info-item">
                <label>Active:</label>
                <input
                  type="checkbox"
                  checked={selectedCompany.isActive ?? true}
                  onChange={(e) => handleUpdateCompany(selectedCompany, { isActive: e.target.checked })}
                />
              </div>
            </div>

            <div className="company-users-section">
              <div className="section-header">
                <h3>Users ({companyUsers.filter(user => !isSystemAdmin(user.email, user.userId)).length})</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowInviteForm(selectedCompany.id)}
                >
                  + Invite User
                </button>
              </div>
              <div className="system-admin-note" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                Note: System admins are not shown in company user lists
              </div>

              {showInviteForm === selectedCompany.id && (
                <div className="invite-form">
                  <form onSubmit={handleInviteUser}>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                        required
                        placeholder="user@onyxdispatch.us"
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={inviteData.role}
                        onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                      >
                        <option value="driver">Driver</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">Send Invitation</button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowInviteForm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companyUsers
                    .filter((user) => !isSystemAdmin(user.email, user.userId))
                    .map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role || 'driver'}
                          onChange={(e) => handleUpdateUserRole(user, e.target.value as any)}
                        >
                          <option value="driver">Driver</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="company-actions">
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteCompany(selectedCompany.id)}
              >
                Delete Company
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
