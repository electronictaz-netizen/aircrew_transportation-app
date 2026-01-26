# Premium Tier: Automated SMS Notifications to Customers

## Overview

Add **Automated SMS Notifications to Customers** as a Premium tier feature. This provides clear value differentiation and is easy to implement since SMS infrastructure already exists.

## Feature Description

**Premium Tier Feature**: Automated SMS notifications sent to customers for:
- Booking confirmations (when trip is created via booking portal)
- Trip reminders (24 hours before, 1 hour before)
- Driver assignment notifications
- "Driver En Route" alerts
- "Driver Arrived" notifications
- Trip completion confirmations

**Basic Tier**: Email notifications only (current behavior)

## Why This is a Good Differentiator

1. **Clear Value**: Customers expect SMS updates - it's more immediate than email
2. **Easy Implementation**: SMS infrastructure already exists (`sendSms` function, Lambda)
3. **High Perceived Value**: SMS feels more premium/professional
4. **Low Cost**: SMS costs are minimal (~$0.006/message)
5. **Competitive**: Many competitors charge extra for SMS or include in premium tiers

## Implementation Steps

### 1. Update Feature Access Logic

**File**: `src/utils/stripe.ts`

Add `customer_sms_notifications` to premium tier features:

```typescript
premium: [
  'basic_trips', 
  'driver_management', 
  'basic_reports', 
  'unlimited_trips', 
  'custom_fields', 
  'location_management', 
  'flight_status_api', 
  'advanced_reports', 
  'custom_report_config',
  'customer_sms_notifications'  // NEW
],
```

### 2. Add Feature Check in Booking Portal

**File**: `amplify/functions/publicBooking/handler.ts`

When a booking is created, check if company has Premium tier and send SMS:

```typescript
// After booking is created
if (company.subscriptionTier === 'premium' && customerPhone) {
  // Send SMS confirmation
  await sendBookingSmsViaLambda({
    phoneNumber: customerPhone,
    bookingDetails: { ... }
  });
}
```

### 3. Add Feature Check in Trip Management

**File**: `src/components/ManagementDashboard.tsx`

When trip status changes, check tier and send SMS:

```typescript
import { hasFeatureAccess } from '../utils/stripe';

// When trip is assigned
if (hasFeatureAccess(company.subscriptionTier, 'customer_sms_notifications')) {
  const customer = customers.find(c => c.id === trip.customerId);
  if (customer?.phone) {
    await sendTripSmsViaLambda({
      phoneNumber: customer.phone,
      message: `Your driver ${driver.name} has been assigned. ETA: ${pickupTime}`
    });
  }
}
```

### 4. Create SMS Lambda Function (if needed)

**File**: `amplify/functions/sendCustomerSms/handler.ts`

Similar to existing `sendSms` function but specifically for customer notifications.

### 5. Update Marketing Materials

**Files to update**:
- `src/utils/stripe.ts` - Add to Premium features list
- `marketing-website/index.html` - Add to Premium tier features
- `docs/SUBSCRIPTION_AND_TRIAL_GUIDE.md` - Document the feature

Add to Premium features:
- "Automated SMS notifications to customers"
- "Real-time trip updates via SMS"
- "SMS booking confirmations and reminders"

## Alternative: Trip Templates (Even Easier)

If SMS seems too complex, **Trip Templates** is even easier:

### Trip Templates Feature

**Premium Tier Feature**: Save frequently used trips as templates for quick creation.

**Implementation**:
1. Add `TripTemplate` model to schema (similar to Trip)
2. Add "Save as Template" button in TripForm
3. Add "Create from Template" option when creating new trip
4. Gate template features behind Premium tier

**Why This Works**:
- Very easy to implement (just save/load trip data)
- Saves time for companies with repetitive routes
- Clear value for Premium tier
- No external dependencies

## Recommendation

**Start with Trip Templates** (easiest, immediate value), then add SMS notifications later as a second Premium feature.

Both are good differentiators, but Trip Templates can be implemented in ~1-2 hours, while SMS requires more testing and infrastructure setup.

---

*Created: January 25, 2026*
