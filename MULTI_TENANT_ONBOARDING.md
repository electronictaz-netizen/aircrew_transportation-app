# Multi-Tenant Onboarding Guide

## Current State

Currently, the app automatically creates a "GLS Transportation" company for the first user who logs in. This was set up for the initial deployment, but **new companies need a proper onboarding process**.

## How New Companies Can Start Using the App

There are several approaches for onboarding new companies. Choose the one that best fits your business model:

---

## Option 1: Admin-Managed Onboarding (Recommended for B2B)

**How it works:**
- An admin (from your organization) creates the company account
- Admin invites users to join the company
- Users sign up and are automatically linked to their company

**Implementation Steps:**

### Step 1: Create an Admin Dashboard Component

Create `src/components/AdminDashboard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function AdminDashboard() {
  const [companies, setCompanies] = useState<Schema['Company']['type'][]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    subscriptionTier: 'premium' as 'free' | 'basic' | 'premium',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data } = await client.models.Company.list();
    setCompanies(data || []);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, errors } = await client.models.Company.create({
        name: formData.name,
        subdomain: formData.subdomain,
        isActive: true,
        subscriptionTier: formData.subscriptionTier,
        subscriptionStatus: 'active',
      });

      if (errors) {
        alert('Error creating company: ' + errors[0].message);
        return;
      }

      alert('Company created successfully!');
      setShowCreateForm(false);
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Company Management</h1>
      <button onClick={() => setShowCreateForm(true)}>Create New Company</button>

      {showCreateForm && (
        <form onSubmit={handleCreateCompany}>
          <input
            type="text"
            placeholder="Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Subdomain (e.g., 'acme')"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            required
          />
          <select
            value={formData.subscriptionTier}
            onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          <button type="submit">Create Company</button>
          <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
        </form>
      )}

      <h2>Existing Companies</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Subdomain</th>
            <th>Tier</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.name}</td>
              <td>{company.subdomain}</td>
              <td>{company.subscriptionTier}</td>
              <td>{company.subscriptionStatus}</td>
              <td>
                <button>Edit</button>
                <button>Manage Users</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
```

### Step 2: Add Invitation System

When a company is created, generate invitation codes or send email invitations:

```typescript
// In AdminDashboard or separate component
const inviteUser = async (companyId: string, email: string) => {
  // Create a CompanyUser with a pending status
  // Send invitation email with signup link
  // User signs up and is automatically linked
};
```

### Step 3: Update CompanyContext

Modify `CompanyContext.tsx` to check for pending invitations:

```typescript
// In loadUserCompany function
const { data: invitations } = await client.models.CompanyUser.list({
  filter: { 
    email: { eq: user.signInDetails?.loginId },
    isActive: { eq: false } // Pending invitations
  }
});

if (invitations && invitations.length > 0) {
  // User has a pending invitation
  // Link them to the company
}
```

---

## Option 2: Self-Service Signup with Company Creation

**How it works:**
- New users sign up and create their company during registration
- First user becomes the company admin
- They can invite additional users

**Implementation Steps:**

### Step 1: Create Company Signup Component

Create `src/components/CompanySignup.tsx`:

```typescript
import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function CompanySignup() {
  const { user } = useAuthenticator();
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    subscriptionTier: 'basic' as 'free' | 'basic' | 'premium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create company
      const { data: company, errors: companyErrors } = await client.models.Company.create({
        name: formData.companyName,
        subdomain: formData.subdomain,
        isActive: true,
        subscriptionTier: formData.subscriptionTier,
        subscriptionStatus: 'active',
      });

      if (companyErrors || !company) {
        throw new Error('Failed to create company');
      }

      // Link user to company as admin
      const { errors: userErrors } = await client.models.CompanyUser.create({
        companyId: company.id,
        userId: user.userId,
        email: user.signInDetails?.loginId || '',
        role: 'admin',
        isActive: true,
      });

      if (userErrors) {
        throw new Error('Failed to link user to company');
      }

      // Refresh to load new company
      window.location.reload();
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company. Please try again.');
    }
  };

  return (
    <div className="company-signup">
      <h2>Create Your Company</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Company Name"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Subdomain (e.g., 'acme')"
          value={formData.subdomain}
          onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
          required
        />
        <select
          value={formData.subscriptionTier}
          onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
        >
          <option value="free">Free Trial</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
        <button type="submit">Create Company</button>
      </form>
    </div>
  );
}

export default CompanySignup;
```

### Step 2: Update CompanyContext

Modify `CompanyContext.tsx` to show signup form if no company is found:

```typescript
// In loadUserCompany
if (!companyUsers || companyUsers.length === 0) {
  // No company found - show signup form
  setShowCompanySignup(true);
  return;
}
```

---

## Option 3: Email-Based Company Assignment

**How it works:**
- Companies are pre-created with email domains (e.g., @acme.com)
- When users sign up with that email domain, they're automatically assigned
- Admin can manually assign users to companies

**Implementation Steps:**

### Update CompanyContext

```typescript
const assignCompanyByEmail = async (email: string) => {
  // Extract domain from email
  const domain = email.split('@')[1];
  
  // Find company by email domain or subdomain
  const { data: companies } = await client.models.Company.list();
  const company = companies?.find(c => 
    c.subdomain === domain.split('.')[0] || 
    c.name.toLowerCase().includes(domain.split('.')[0])
  );

  if (company) {
    // Link user to company
    await client.models.CompanyUser.create({
      companyId: company.id,
      userId: user.userId,
      email: email,
      role: 'driver', // Default role
      isActive: true,
    });
  }
};
```

---

## Recommended Approach

For a B2B SaaS application, **Option 1 (Admin-Managed)** is recommended because:

1. **Better Control**: You control who can create companies
2. **Billing Management**: Easier to manage subscriptions and billing
3. **Security**: Prevents unauthorized company creation
4. **Support**: You can provide onboarding assistance

## Implementation Checklist

- [ ] Create Admin Dashboard component
- [ ] Add company creation form
- [ ] Implement user invitation system
- [ ] Update CompanyContext to handle new company flow
- [ ] Add email notifications for invitations
- [ ] Create company selection UI (if user belongs to multiple companies)
- [ ] Add role-based access control
- [ ] Update routing to show appropriate views

## Next Steps

1. **Choose your onboarding approach** based on your business model
2. **Implement the chosen approach** using the code examples above
3. **Test the flow** with a test company
4. **Update documentation** for your team

## Security Considerations

- **Authorization**: Only admins should create companies (add role check)
- **Subdomain Validation**: Ensure subdomains are unique and valid
- **Email Verification**: Verify email addresses before linking users
- **Rate Limiting**: Prevent abuse of company creation

## Questions?

If you need help implementing any of these approaches, let me know which option you prefer and I can provide more detailed implementation code.
