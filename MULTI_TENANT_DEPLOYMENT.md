# Multi-Tenant Deployment Guide

This document outlines the changes required to transform the Onyx Transportation App from a single-company application to a multi-tenant SaaS application that can serve multiple companies.

## Current Architecture

- **Authentication**: AWS Cognito User Pool (email-based)
- **Authorization**: All authenticated users can access all data
- **Data Model**: No company/organization isolation
- **Deployment**: Single instance, shared database

## Data Isolation in Multi-Tenant Deployment

**CRITICAL**: In a single-instance, multi-tenant deployment, data isolation is achieved through:

1. **Row-Level Security (RLS)**: Authorization rules at the API/database level ensure users can ONLY access data where `companyId` matches their company
2. **Application-Level Filtering**: All queries explicitly filter by `companyId` as a secondary defense
3. **Authorization Context**: AWS AppSync automatically filters queries based on the authenticated user's company

**Data WILL NOT leak between companies** when properly implemented. See `DATA_ISOLATION_SECURITY.md` for detailed security mechanisms and testing procedures.

## Required Changes

### 1. Data Model Changes

#### Add Company/Organization Model

```typescript
// amplify/data/resource.ts

Company: a
  .model({
    name: a.string().required(),
    subdomain: a.string().unique(), // e.g., "acme" for acme.app.com
    domain: a.string(), // Optional: custom domain
    isActive: a.boolean().default(true),
    subscriptionTier: a.string(), // 'free', 'basic', 'premium'
    subscriptionStatus: a.string(), // 'active', 'suspended', 'cancelled'
    subscriptionExpiresAt: a.datetime(),
    settings: a.json(), // Company-specific settings (branding, etc.)
    users: a.hasMany('CompanyUser', 'companyId'),
    trips: a.hasMany('Trip', 'companyId'),
    drivers: a.hasMany('Driver', 'companyId'),
    locations: a.hasMany('Location', 'companyId'),
  })
  .authorization((allow) => [
    allow.authenticated().to(['read']), // Users can read their company
    allow.group('Admins').to(['create', 'read', 'update', 'delete']),
  ]),

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
    allow.owner().to(['read', 'update']), // Users can read/update their own record
    allow.group('Admins').to(['create', 'read', 'update', 'delete']),
  ]),
```

#### Update Existing Models to Include Company Association

```typescript
Driver: a
  .model({
    companyId: a.id().required(), // ADD THIS
    company: a.belongsTo('Company', 'companyId'), // ADD THIS
    name: a.string().required(),
    // ... rest of fields
  })
  .authorization((allow) => [
    allow.authenticated().to(['read', 'create', 'update', 'delete'])
      .where((companyId) => companyId.eq(a.context.custom.companyId)), // Row-level security
  ]),

Trip: a
  .model({
    companyId: a.id().required(), // ADD THIS
    company: a.belongsTo('Company', 'companyId'), // ADD THIS
    // ... rest of fields
  })
  .authorization((allow) => [
    allow.authenticated().to(['read', 'create', 'update', 'delete'])
      .where((companyId) => companyId.eq(a.context.custom.companyId)),
  ]),

Location: a
  .model({
    companyId: a.id().required(), // ADD THIS
    company: a.belongsTo('Company', 'companyId'), // ADD THIS
    // ... rest of fields
  })
  .authorization((allow) => [
    allow.authenticated().to(['read', 'create', 'update', 'delete'])
      .where((companyId) => companyId.eq(a.context.custom.companyId)),
  ]),
```

### 2. Authentication Changes

#### Update Auth Configuration

```typescript
// amplify/auth/resource.ts

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
    },
    // Add custom attributes
    'custom:companyId': {
      dataType: 'String',
      mutable: true,
    },
  },
  groups: ['Admins', 'Managers', 'Drivers'], // Role-based groups
});
```

#### Add Company Context to User Registration

When a user signs up, they need to be associated with a company. Options:

1. **Invitation-based**: Admin invites users via email, they sign up and are auto-assigned
2. **Company code**: Users enter a company code during signup
3. **Domain-based**: Auto-detect company from email domain (e.g., @acme.com → Acme Corp)

### 3. Authorization Strategy

#### Row-Level Security (RLS)

All queries must be filtered by `companyId`. This can be done via:

**Option A: Custom Authorization Rules (Recommended)**
```typescript
.authorization((allow) => [
  allow.authenticated().to(['read', 'create', 'update', 'delete'])
    .where((companyId) => companyId.eq(a.context.custom.companyId)),
])
```

**Option B: Application-Level Filtering**
```typescript
// In components, always filter by companyId
const { data: trips } = await client.models.Trip.list({
  filter: { companyId: { eq: currentUserCompanyId } }
});
```

### 4. Frontend Code Changes

#### Add Company Context Provider

```typescript
// src/contexts/CompanyContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const CompanyContext = createContext<{
  company: Schema['Company']['type'] | null;
  companyId: string | null;
  loading: boolean;
}>({ company: null, companyId: null, loading: true });

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthenticator();
  const [company, setCompany] = useState<Schema['Company']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const client = generateClient<Schema>();

  useEffect(() => {
    if (user) {
      // Get user's company from CompanyUser table
      loadUserCompany();
    } else {
      setCompany(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserCompany = async () => {
    try {
      const { data: companyUsers } = await client.models.CompanyUser.list({
        filter: { userId: { eq: user?.userId } }
      });
      
      if (companyUsers && companyUsers.length > 0) {
        const companyUser = companyUsers[0];
        const { data: companyData } = await client.models.Company.get({
          id: companyUser.companyId
        });
        setCompany(companyData || null);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyContext.Provider value={{
      company,
      companyId: company?.id || null,
      loading
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
```

#### Update All Data Queries

Every component that queries data must include `companyId`:

```typescript
// Before
const { data: trips } = await client.models.Trip.list();

// After
const { companyId } = useCompany();
const { data: trips } = await client.models.Trip.list({
  filter: { companyId: { eq: companyId } }
});
```

#### Update All Data Mutations

```typescript
// Before
await client.models.Trip.create(tripData);

// After
const { companyId } = useCompany();
await client.models.Trip.create({
  ...tripData,
  companyId: companyId!
});
```

### 5. Deployment Architecture Options

#### Option A: Single Instance with Multi-Tenancy (Recommended for Start)

**Pros:**
- Lower infrastructure costs
- Easier to maintain
- Single codebase
- Shared resources

**Cons:**
- Requires careful data isolation
- All companies share same database
- Scaling affects all tenants

**Implementation:**
- Single Amplify app
- Subdomain routing (company1.app.com, company2.app.com)
- Row-level security in database
- Shared Cognito User Pool with company attributes

#### Option B: Separate Instances Per Company

**Pros:**
- Complete data isolation
- Independent scaling
- Custom configurations per company
- Easier compliance (HIPAA, GDPR)

**Cons:**
- Higher infrastructure costs
- More complex deployment
- Harder to maintain updates

**Implementation:**
- Multiple Amplify apps (one per company)
- Separate databases
- Separate Cognito User Pools (or single pool with app client per company)
- CI/CD pipeline to deploy to all instances

#### Option C: Hybrid Approach

**Pros:**
- Balance between isolation and cost
- Can move large companies to dedicated instances

**Cons:**
- More complex architecture
- Requires routing logic

**Implementation:**
- Most companies on shared instance
- Large/premium companies on dedicated instances
- Routing layer to direct to correct instance

### 6. Subdomain/Domain Routing

#### Option A: Subdomain-Based (Recommended)

```
acme.yourapp.com → Company: Acme Corp
contoso.yourapp.com → Company: Contoso Inc
```

**Implementation:**
```typescript
// src/utils/companyRouting.ts

export function getCompanyFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // Skip 'www' and 'app' subdomains
  if (subdomain === 'www' || subdomain === 'app' || subdomain === 'admin') {
    return null;
  }
  
  return subdomain;
}
```

#### Option B: Custom Domain

```
acme.com → Company: Acme Corp
contoso.com → Company: Contoso Inc
```

**Implementation:**
- Requires DNS configuration per company
- More complex but better branding

### 7. Company Onboarding Flow

#### New Company Registration

1. **Company Admin Signs Up**
   - Creates company account
   - Provides company details
   - Chooses subdomain
   - Selects subscription tier

2. **Company Setup**
   - Admin invites team members
   - Configures company settings
   - Sets up initial data (drivers, locations)

3. **User Invitations**
   - Admin sends invitation emails
   - Users click link, sign up
   - Auto-assigned to company

### 8. Subscription Management

#### Add Subscription Fields to Company Model

```typescript
Company: a.model({
  // ... existing fields
  subscriptionTier: a.enum(['free', 'basic', 'premium']).default('free'),
  subscriptionStatus: a.enum(['active', 'suspended', 'cancelled']).default('active'),
  subscriptionExpiresAt: a.datetime(),
  maxDrivers: a.integer().default(5), // Based on tier
  maxTripsPerMonth: a.integer().default(100),
  features: a.json(), // Feature flags based on tier
})
```

#### Feature Gating

```typescript
// src/utils/featureFlags.ts

export function canUseFeature(
  company: Schema['Company']['type'],
  feature: string
): boolean {
  const features = company.features || {};
  return features[feature] === true;
}

// Usage
if (canUseFeature(company, 'recurringTrips')) {
  // Show recurring trips feature
}
```

### 9. Migration Strategy

#### For Existing Single-Tenant Deployment

1. **Create Default Company**
   ```typescript
   // Migration script
   const defaultCompany = await client.models.Company.create({
     name: 'Default Company',
     subdomain: 'default',
     isActive: true,
   });
   ```

2. **Associate Existing Data**
   ```typescript
   // Update all existing records
   const { data: trips } = await client.models.Trip.list();
   for (const trip of trips) {
     await client.models.Trip.update({
       id: trip.id,
       companyId: defaultCompany.id,
     });
   }
   ```

3. **Associate Existing Users**
   ```typescript
   // Create CompanyUser records for existing users
   const { data: users } = await client.models.User.list();
   for (const user of users) {
     await client.models.CompanyUser.create({
       companyId: defaultCompany.id,
       userId: user.id,
       email: user.email,
       role: 'admin',
     });
   }
   ```

### 10. Security Considerations

#### Data Isolation

- **Critical**: Ensure row-level security is properly configured
- **Testing**: Verify users from Company A cannot access Company B's data
- **Audit**: Log all data access attempts

#### API Security

- Validate `companyId` on all API calls
- Use AWS AppSync with proper authorization rules
- Implement rate limiting per company

#### Compliance

- GDPR: Data export/deletion per company
- HIPAA: If handling medical data, ensure proper isolation
- SOC 2: Audit trails, access controls

### 11. Monitoring & Analytics

#### Per-Company Metrics

- Number of trips per company
- Active users per company
- API usage per company
- Storage usage per company

#### Billing Integration

- Track usage per company
- Generate invoices
- Handle subscription renewals
- Payment processing (Stripe, etc.)

### 12. Code Changes Summary

#### Files to Modify

1. **Schema** (`amplify/data/resource.ts`)
   - Add Company and CompanyUser models
   - Add `companyId` to all existing models
   - Update authorization rules

2. **Auth** (`amplify/auth/resource.ts`)
   - Add custom user attributes
   - Add user groups

3. **Components** (All data-fetching components)
   - Add `useCompany()` hook
   - Filter queries by `companyId`
   - Include `companyId` in mutations

4. **New Files**
   - `src/contexts/CompanyContext.tsx`
   - `src/utils/companyRouting.ts`
   - `src/utils/featureFlags.ts`
   - `src/components/CompanyOnboarding.tsx`
   - `src/components/CompanySettings.tsx`

### 13. Deployment Checklist

- [ ] Add Company and CompanyUser models
- [ ] Update all existing models with `companyId`
- [ ] Implement row-level security rules
- [ ] Create CompanyContext provider
- [ ] Update all components to use company context
- [ ] Implement subdomain routing
- [ ] Create company onboarding flow
- [ ] Add subscription management
- [ ] Implement feature gating
- [ ] Set up company-specific settings
- [ ] Create migration script for existing data
- [ ] Add monitoring and analytics
- [ ] Set up billing integration
- [ ] Security audit and testing
- [ ] Load testing with multiple tenants
- [ ] Documentation for company admins

### 14. Estimated Effort

- **Data Model Changes**: 2-3 days
- **Authorization Updates**: 3-5 days
- **Frontend Code Updates**: 5-7 days
- **Company Onboarding**: 3-4 days
- **Subscription Management**: 4-5 days
- **Testing & Security**: 5-7 days
- **Migration Scripts**: 2-3 days

**Total**: ~4-6 weeks for a complete multi-tenant implementation

### 15. Alternative: AWS Amplify Multi-Environment

If using AWS Amplify, consider:

- **Separate Amplify Environments**: One per company (for Option B)
- **Amplify Hosting**: Supports subdomain routing
- **AppSync**: Built-in multi-tenancy support with custom resolvers

### 16. Recommended Approach for Research

For research purposes, start with **Option A (Single Instance with Multi-Tenancy)**:

1. Add Company model
2. Add `companyId` to all models
3. Implement basic row-level security
4. Create company onboarding UI
5. Test with 2-3 sample companies
6. Validate data isolation

This provides a working multi-tenant system without the complexity of separate deployments.

## Next Steps

1. Review this document
2. Choose deployment architecture (Option A recommended for research)
3. Implement data model changes
4. Update authorization rules
5. Create company context and routing
6. Update all components
7. Test thoroughly with multiple companies
8. Deploy and monitor

## Resources

- [AWS Amplify Multi-Tenancy](https://docs.amplify.aws/react/build-a-backend/data/multi-tenancy/)
- [AWS AppSync Authorization](https://docs.aws.amazon.com/appsync/latest/devguide/security.html)
- [Cognito User Pools Custom Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
