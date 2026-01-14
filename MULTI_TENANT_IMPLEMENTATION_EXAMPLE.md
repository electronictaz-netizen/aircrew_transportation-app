# Multi-Tenant Implementation Code Examples

This document provides concrete code examples for implementing multi-tenancy in the Aircrew Transportation app.

## 1. Updated Schema Example

```typescript
// amplify/data/resource.ts

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // NEW: Company Model
  Company: a
    .model({
      name: a.string().required(),
      subdomain: a.string().unique(),
      isActive: a.boolean().default(true),
      subscriptionTier: a.string().default('free'),
      subscriptionStatus: a.string().default('active'),
      users: a.hasMany('CompanyUser', 'companyId'),
      trips: a.hasMany('Trip', 'companyId'),
      drivers: a.hasMany('Driver', 'companyId'),
      locations: a.hasMany('Location', 'companyId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('Admins').to(['create', 'read', 'update', 'delete']),
    ]),

  // NEW: CompanyUser Model (links Cognito users to companies)
  CompanyUser: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      userId: a.string().required(), // Cognito User ID
      email: a.string().required(),
      role: a.enum(['admin', 'manager', 'driver']).default('manager'),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'update']),
      allow.group('Admins').to(['create', 'read', 'update', 'delete']),
    ]),

  // UPDATED: Driver with companyId
  Driver: a
    .model({
      companyId: a.id().required(), // ADDED
      company: a.belongsTo('Company', 'companyId'), // ADDED
      name: a.string().required(),
      email: a.string(),
      phone: a.string(),
      licenseNumber: a.string(),
      isActive: a.boolean().default(true),
      notificationPreference: a.string(),
      trips: a.hasMany('Trip', 'driverId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
        .where((companyId) => companyId.eq(a.context.custom.companyId)),
    ]),

  // UPDATED: Trip with companyId
  Trip: a
    .model({
      companyId: a.id().required(), // ADDED
      company: a.belongsTo('Company', 'companyId'), // ADDED
      airport: a.string(),
      pickupDate: a.datetime().required(),
      flightNumber: a.string().required(),
      pickupLocation: a.string().required(),
      dropoffLocation: a.string().required(),
      numberOfPassengers: a.integer().default(1),
      status: a.enum(['Unassigned', 'Assigned', 'InProgress', 'Completed']),
      driverId: a.id(),
      driver: a.belongsTo('Driver', 'driverId'),
      // ... rest of fields
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
        .where((companyId) => companyId.eq(a.context.custom.companyId)),
    ]),

  // UPDATED: Location with companyId
  Location: a
    .model({
      companyId: a.id().required(), // ADDED
      company: a.belongsTo('Company', 'companyId'), // ADDED
      name: a.string().required(),
      address: a.string(),
      description: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
        .where((companyId) => companyId.eq(a.context.custom.companyId)),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

## 2. Company Context Provider

```typescript
// src/contexts/CompanyContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

interface CompanyContextType {
  company: Schema['Company']['type'] | null;
  companyId: string | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  companyId: null,
  loading: true,
  refreshCompany: async () => {},
});

const client = generateClient<Schema>();

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthenticator();
  const [company, setCompany] = useState<Schema['Company']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserCompany = async () => {
    if (!user?.userId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Find CompanyUser record for this user
      const { data: companyUsers } = await client.models.CompanyUser.list({
        filter: { 
          userId: { eq: user.userId },
          isActive: { eq: true }
        }
      });

      if (companyUsers && companyUsers.length > 0) {
        const companyUser = companyUsers[0];
        
        // Load the company
        const { data: companyData } = await client.models.Company.get({
          id: companyUser.companyId
        });

        if (companyData && companyData.isActive) {
          setCompany(companyData);
        } else {
          setCompany(null);
        }
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error loading company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserCompany();
  }, [user?.userId]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id || null,
        loading,
        refreshCompany: loadUserCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};
```

## 3. Updated App.tsx with Company Provider

```typescript
// src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider } from './contexts/CompanyContext';
import ManagementDashboard from './components/ManagementDashboard';
import DriverDashboard from './components/DriverDashboard';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <CompanyProvider>
          <div className="app">
            <Navigation signOut={signOut || (() => {})} user={user} />
            <Routes>
              <Route path="/" element={<Navigate to="/management" replace />} />
              <Route path="/management" element={<ManagementDashboard />} />
              <Route path="/driver" element={<DriverDashboard />} />
            </Routes>
            <InstallPrompt />
          </div>
        </CompanyProvider>
      )}
    </Authenticator>
  );
}

export default App;
```

## 4. Updated ManagementDashboard with Company Filtering

```typescript
// src/components/ManagementDashboard.tsx

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
// ... other imports

const client = generateClient<Schema>();

function ManagementDashboard() {
  const { companyId, loading: companyLoading } = useCompany();
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [drivers, setDrivers] = useState<Array<Schema['Driver']['type']>>([]);
  const [locations, setLocations] = useState<Array<Schema['Location']['type']>>([]);
  // ... other state

  useEffect(() => {
    if (companyId) {
      loadTrips();
      loadDrivers();
      loadLocations();
    }
  }, [companyId]);

  const loadTrips = async () => {
    if (!companyId) return;
    
    try {
      const { data: tripsData } = await client.models.Trip.list({
        filter: { companyId: { eq: companyId } }
      });
      setTrips(tripsData as Array<Schema['Trip']['type']>);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadDrivers = async () => {
    if (!companyId) return;
    
    try {
      const { data: driversData } = await client.models.Driver.list({
        filter: { companyId: { eq: companyId } }
      });
      setDrivers(driversData as Array<Schema['Driver']['type']>);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadLocations = async () => {
    if (!companyId) return;
    
    try {
      const { data: locationsData } = await client.models.Location.list({
        filter: { companyId: { eq: companyId } }
      });
      setLocations(locationsData as Array<Schema['Location']['type']>);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleCreateTrip = async (tripData: any) => {
    if (!companyId) {
      alert('Company not found. Please contact support.');
      return;
    }

    try {
      await client.models.Trip.create({
        ...tripData,
        companyId: companyId, // ADD THIS
      });
      await loadTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip.');
    }
  };

  // ... rest of component

  if (companyLoading) {
    return <div className="loading">Loading company data...</div>;
  }

  if (!companyId) {
    return (
      <div className="error-state">
        <h2>No Company Assigned</h2>
        <p>Your account is not associated with a company. Please contact your administrator.</p>
      </div>
    );
  }

  // ... rest of component JSX
}
```

## 5. Company Onboarding Component

```typescript
// src/components/CompanyOnboarding.tsx

import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import './CompanyOnboarding.css';

const client = generateClient<Schema>();

function CompanyOnboarding() {
  const { user } = useAuthenticator();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    adminEmail: user?.signInDetails?.loginId || '',
  });

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
    
    try {
      // Create company
      const { data: company } = await client.models.Company.create({
        name: formData.companyName,
        subdomain: formData.subdomain,
        isActive: true,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
      });

      if (!company || !user?.userId) {
        throw new Error('Failed to create company');
      }

      // Create CompanyUser record
      await client.models.CompanyUser.create({
        companyId: company.id,
        userId: user.userId,
        email: formData.adminEmail,
        role: 'admin',
        isActive: true,
      });

      alert('Company created successfully! Redirecting...');
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating company:', error);
      if (error.errors?.[0]?.message?.includes('unique')) {
        alert('This subdomain is already taken. Please choose another.');
      } else {
        alert('Failed to create company. Please try again.');
      }
    }
  };

  return (
    <div className="company-onboarding">
      <div className="onboarding-container">
        <h2>Set Up Your Company</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
              placeholder="Acme Corporation"
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
                placeholder="acme"
                pattern="[a-z0-9-]+"
              />
              <span className="subdomain-suffix">.yourapp.com</span>
            </div>
            <small>Only lowercase letters, numbers, and hyphens allowed</small>
          </div>

          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email *</label>
            <input
              type="email"
              id="adminEmail"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyOnboarding;
```

## 6. Subdomain Routing Utility

```typescript
// src/utils/companyRouting.ts

/**
 * Get company subdomain from current hostname
 */
export function getCompanySubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Skip common subdomains
  const skipSubdomains = ['www', 'app', 'admin', 'api', 'staging', 'dev'];
  
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!skipSubdomains.includes(subdomain)) {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Redirect to company-specific subdomain
 */
export function redirectToCompanySubdomain(subdomain: string) {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  const pathname = window.location.pathname;
  
  // Extract base domain (e.g., 'yourapp.com' from 'app.yourapp.com')
  const baseDomain = hostname.split('.').slice(-2).join('.');
  
  const newUrl = `${protocol}//${subdomain}.${baseDomain}${port ? `:${port}` : ''}${pathname}`;
  window.location.href = newUrl;
}
```

## 7. Updated App.tsx with Subdomain Detection

```typescript
// src/App.tsx (updated)

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { getCompanySubdomain } from './utils/companyRouting';
import ManagementDashboard from './components/ManagementDashboard';
import DriverDashboard from './components/DriverDashboard';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';
import CompanyOnboarding from './components/CompanyOnboarding';

function AppContent() {
  const { company, companyId, loading } = useCompany();
  const subdomain = getCompanySubdomain();

  // If user has no company, show onboarding
  if (!loading && !companyId && subdomain) {
    return <CompanyOnboarding />;
  }

  return (
    <div className="app">
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/management" replace />} />
        <Route path="/management" element={<ManagementDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
      </Routes>
      <InstallPrompt />
    </div>
  );
}

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <CompanyProvider>
          <AppContent />
        </CompanyProvider>
      )}
    </Authenticator>
  );
}

export default App;
```

## 8. Migration Script Example

```typescript
// scripts/migrateToMultiTenant.ts

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function migrateToMultiTenant() {
  console.log('Starting migration to multi-tenant...');

  try {
    // Step 1: Create default company
    console.log('Creating default company...');
    const { data: defaultCompany } = await client.models.Company.create({
      name: 'Default Company',
      subdomain: 'default',
      isActive: true,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
    });

    if (!defaultCompany) {
      throw new Error('Failed to create default company');
    }

    console.log(`Default company created: ${defaultCompany.id}`);

    // Step 2: Migrate all trips
    console.log('Migrating trips...');
    const { data: allTrips } = await client.models.Trip.list();
    let tripCount = 0;
    
    for (const trip of allTrips || []) {
      if (!trip.companyId) {
        await client.models.Trip.update({
          id: trip.id,
          companyId: defaultCompany.id,
        });
        tripCount++;
      }
    }
    console.log(`Migrated ${tripCount} trips`);

    // Step 3: Migrate all drivers
    console.log('Migrating drivers...');
    const { data: allDrivers } = await client.models.Driver.list();
    let driverCount = 0;
    
    for (const driver of allDrivers || []) {
      if (!driver.companyId) {
        await client.models.Driver.update({
          id: driver.id,
          companyId: defaultCompany.id,
        });
        driverCount++;
      }
    }
    console.log(`Migrated ${driverCount} drivers`);

    // Step 4: Migrate all locations
    console.log('Migrating locations...');
    const { data: allLocations } = await client.models.Location.list();
    let locationCount = 0;
    
    for (const location of allLocations || []) {
      if (!location.companyId) {
        await client.models.Location.update({
          id: location.id,
          companyId: defaultCompany.id,
        });
        locationCount++;
      }
    }
    console.log(`Migrated ${locationCount} locations`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToMultiTenant();
```

## Key Points

1. **Always filter by companyId**: Every query must include company filtering
2. **Always include companyId in mutations**: Every create/update must set companyId
3. **Use CompanyContext**: Centralize company data access
4. **Validate company access**: Check companyId matches user's company before operations
5. **Subdomain routing**: Use subdomains to identify companies
6. **Migration**: Create default company and associate existing data

## Testing Multi-Tenancy

```typescript
// Test that Company A cannot access Company B's data

// As Company A user
const { data: trips } = await client.models.Trip.list({
  filter: { companyId: { eq: companyAId } }
});
// Should only return Company A trips

// Try to access Company B trip (should fail or return empty)
const { data: companyBTrip } = await client.models.Trip.get({
  id: companyBTripId
});
// Should return null or error if authorization is working
```
