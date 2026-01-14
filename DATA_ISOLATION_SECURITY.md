# Data Isolation and Security in Multi-Tenant Deployment

## Overview

In a single-instance, multi-tenant deployment, **data isolation is CRITICAL**. This document explains how data is isolated between companies and how to ensure no data "leaks" between customers.

## How Data Isolation Works

### 1. Row-Level Security (RLS) - Primary Defense

Every data model includes a `companyId` field, and authorization rules ensure users can only access data from their own company.

#### Schema-Level Authorization

```typescript
// amplify/data/resource.ts

Trip: a
  .model({
    companyId: a.id().required(),
    // ... other fields
  })
  .authorization((allow) => [
    // ONLY allow access if companyId matches user's company
    allow.authenticated().to(['read', 'create', 'update', 'delete'])
      .where((companyId) => companyId.eq(a.context.custom.companyId)),
  ]),
```

**How it works:**
- AWS AppSync (Amplify's GraphQL API) automatically filters queries
- Users can ONLY see records where `companyId` matches their company
- This happens at the **database/API level**, not just in the frontend

### 2. Application-Level Filtering - Secondary Defense

Even with RLS, always filter by `companyId` in your application code as a backup:

```typescript
// src/components/ManagementDashboard.tsx

const { companyId } = useCompany();

// ALWAYS filter by companyId
const { data: trips } = await client.models.Trip.list({
  filter: { 
    companyId: { eq: companyId },
    // ... other filters
  }
});
```

**Why both?**
- **RLS**: Prevents unauthorized access even if code has bugs
- **Application filtering**: Explicit, visible, and provides better error messages

### 3. Mutation Validation - Prevent Cross-Company Writes

Always validate `companyId` when creating/updating records:

```typescript
const handleCreateTrip = async (tripData: any) => {
  const { companyId } = useCompany();
  
  if (!companyId) {
    throw new Error('No company assigned');
  }

  // ALWAYS include companyId from context, never from user input
  await client.models.Trip.create({
    ...tripData,
    companyId: companyId, // From authenticated user's context, NOT from form
  });
};
```

**Critical**: Never trust `companyId` from user input. Always get it from the authenticated user's context.

## Security Mechanisms

### 1. Authorization Rules at API Level

AWS AppSync enforces authorization rules **before** data is returned:

```typescript
.authorization((allow) => [
  allow.authenticated().to(['read'])
    .where((companyId) => companyId.eq(a.context.custom.companyId))
])
```

**What this means:**
- If Company A user tries to query Company B's data, AppSync returns **empty results**
- The query never reaches the database with Company B's `companyId`
- This is enforced by AWS, not your application code

### 2. Custom Context from Authentication

The `a.context.custom.companyId` comes from the authenticated user:

```typescript
// When user logs in, their CompanyUser record provides companyId
// This is set in the authorization context automatically

// In your CompanyContext:
const { data: companyUser } = await client.models.CompanyUser.list({
  filter: { userId: { eq: user.userId } }
});

// This companyId is then used in all authorization checks
```

### 3. Database-Level Constraints

At the database level (DynamoDB), you can add:

- **GSI (Global Secondary Index)** on `companyId` for efficient filtering
- **Partition key** strategy that includes `companyId`

```typescript
// DynamoDB automatically partitions data by companyId
// This provides both performance and isolation benefits
```

## Testing Data Isolation

### Test Suite for Isolation

```typescript
// tests/dataIsolation.test.ts

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

describe('Data Isolation Tests', () => {
  let companyAClient: ReturnType<typeof generateClient<Schema>>;
  let companyBClient: ReturnType<typeof generateClient<Schema>>;
  let companyATripId: string;
  let companyBTripId: string;

  beforeEach(async () => {
    // Setup: Create two companies and users
    // Authenticate as Company A user
    companyAClient = generateClient<Schema>({
      authMode: 'userPool',
      authToken: companyAUserToken,
    });

    // Authenticate as Company B user
    companyBClient = generateClient<Schema>({
      authMode: 'userPool',
      authToken: companyBUserToken,
    });
  });

  test('Company A cannot see Company B trips', async () => {
    // Company A queries trips
    const { data: trips } = await companyAClient.models.Trip.list();
    
    // Verify all trips belong to Company A
    trips?.forEach(trip => {
      expect(trip.companyId).toBe(companyAId);
      expect(trip.companyId).not.toBe(companyBId);
    });
  });

  test('Company A cannot access Company B trip by ID', async () => {
    // Try to get Company B's trip
    const { data: trip, errors } = await companyAClient.models.Trip.get({
      id: companyBTripId,
    });

    // Should return null or error
    expect(trip).toBeNull();
    expect(errors).toBeDefined();
  });

  test('Company A cannot create trip for Company B', async () => {
    // Try to create trip with Company B's ID
    const { data: trip, errors } = await companyAClient.models.Trip.create({
      companyId: companyBId, // Attempting to use wrong company
      // ... other fields
    });

    // Should fail
    expect(trip).toBeNull();
    expect(errors).toBeDefined();
  });

  test('Company A cannot update Company B trip', async () => {
    // Try to update Company B's trip
    const { data: trip, errors } = await companyAClient.models.Trip.update({
      id: companyBTripId,
      flightNumber: 'HACKED',
    });

    // Should fail
    expect(trip).toBeNull();
    expect(errors).toBeDefined();
  });

  test('Company A cannot delete Company B trip', async () => {
    // Try to delete Company B's trip
    const { data: trip, errors } = await companyAClient.models.Trip.delete({
      id: companyBTripId,
    });

    // Should fail
    expect(trip).toBeNull();
    expect(errors).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] Create trip as Company A user
- [ ] Verify Company B user cannot see it
- [ ] Try to access Company B trip by direct ID as Company A user
- [ ] Verify it returns null/error
- [ ] Try to update Company B trip as Company A user
- [ ] Verify it fails
- [ ] Check browser network tab - verify API calls only return Company A data
- [ ] Test with multiple companies simultaneously

## Potential Risks and Mitigations

### Risk 1: Code Bug Bypasses Filtering

**Risk**: Developer forgets to add `companyId` filter

**Mitigation**:
- ✅ Row-level security catches this automatically
- ✅ Code review checklist: "Does this query filter by companyId?"
- ✅ Linting rules to warn about missing companyId

### Risk 2: User Manipulates companyId in Request

**Risk**: Malicious user tries to set `companyId` to another company's ID

**Mitigation**:
```typescript
// NEVER trust companyId from user input
const handleCreateTrip = async (tripData: any) => {
  const { companyId } = useCompany(); // From authenticated context
  
  // IGNORE any companyId in tripData
  const { companyId: _, ...safeData } = tripData;
  
  await client.models.Trip.create({
    ...safeData,
    companyId: companyId, // Always use authenticated user's company
  });
};
```

### Risk 3: Authorization Rules Not Working

**Risk**: Bug in authorization rule syntax

**Mitigation**:
- ✅ Test authorization rules in development
- ✅ Use AWS AppSync console to test queries
- ✅ Automated tests for isolation
- ✅ Security audit before production

### Risk 4: Shared Resources (Cache, etc.)

**Risk**: Cached data might leak between companies

**Mitigation**:
```typescript
// Include companyId in cache keys
const cacheKey = `trips:${companyId}:${filters}`;

// Clear cache on company switch
useEffect(() => {
  if (companyId) {
    // Clear any cached data
    cache.clear();
  }
}, [companyId]);
```

## Best Practices

### 1. Always Use Company Context

```typescript
// ✅ GOOD
const { companyId } = useCompany();
const { data } = await client.models.Trip.list({
  filter: { companyId: { eq: companyId } }
});

// ❌ BAD - No company filtering
const { data } = await client.models.Trip.list();
```

### 2. Never Trust User Input for companyId

```typescript
// ✅ GOOD
const { companyId } = useCompany();
await client.models.Trip.create({ ...data, companyId });

// ❌ BAD - User could manipulate this
await client.models.Trip.create({ ...data, companyId: formData.companyId });
```

### 3. Validate Company Access in Mutations

```typescript
const handleUpdateTrip = async (tripId: string, data: any) => {
  const { companyId } = useCompany();
  
  // First, verify the trip belongs to user's company
  const { data: trip } = await client.models.Trip.get({ id: tripId });
  
  if (trip?.companyId !== companyId) {
    throw new Error('Unauthorized: Trip does not belong to your company');
  }
  
  // Then update
  await client.models.Trip.update({ id: tripId, ...data });
};
```

### 4. Use TypeScript to Prevent Mistakes

```typescript
// Create a type-safe wrapper
type CompanyScopedQuery<T> = T & { companyId: string };

function createTrip<T>(data: Omit<T, 'companyId'>): Promise<T> {
  const { companyId } = useCompany();
  return client.models.Trip.create({
    ...data,
    companyId, // TypeScript ensures companyId is always included
  } as CompanyScopedQuery<T>);
}
```

## Monitoring and Auditing

### Log All Data Access

```typescript
// Add logging to track data access
const { data: trips } = await client.models.Trip.list({
  filter: { companyId: { eq: companyId } }
});

// Log for audit
console.log(`[AUDIT] User ${userId} accessed ${trips.length} trips for company ${companyId}`);
```

### Set Up Alerts

- Alert if query returns data from multiple companies
- Alert if companyId mismatch detected
- Alert on authorization failures

### Regular Security Audits

- Monthly review of authorization rules
- Test data isolation with penetration testing
- Review access logs for anomalies

## Verification Steps

### Before Production Deployment

1. **Test with 3+ companies simultaneously**
   - Create data in each company
   - Verify no cross-company visibility

2. **Test edge cases**
   - User switches companies (should clear data)
   - User has no company (should show error)
   - User belongs to multiple companies (should show selector)

3. **Review all queries**
   - Every `.list()` includes `companyId` filter
   - Every `.create()` includes `companyId`
   - Every `.update()` validates `companyId` matches

4. **Test authorization rules**
   - Use AWS AppSync console to test queries
   - Verify rules work as expected

5. **Security audit**
   - Have security expert review authorization rules
   - Test for common vulnerabilities (OWASP Top 10)

## Conclusion

**Yes, data is fully isolated** in a single-instance, multi-tenant deployment when properly implemented:

1. ✅ **Row-level security** at the API/database level prevents unauthorized access
2. ✅ **Application-level filtering** provides explicit, visible protection
3. ✅ **Authorization rules** are enforced by AWS AppSync before data is returned
4. ✅ **Company context** ensures users can only access their company's data

**Data will NOT leak between companies** if:
- Authorization rules are correctly configured
- Application code always filters by `companyId`
- `companyId` is never trusted from user input
- Proper testing and auditing is in place

The key is implementing **defense in depth** - multiple layers of security that all must be bypassed for data to leak.
