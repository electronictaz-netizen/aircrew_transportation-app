import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Company: a
    .model({
      name: a.string().required(),
      displayName: a.string(), // Custom name displayed in the app
      logoUrl: a.string(), // URL to company logo image
      subdomain: a.string(),
      isActive: a.boolean().default(true),
      subscriptionTier: a.string().default('free'), // 'free', 'basic', 'premium'
      subscriptionStatus: a.string().default('active'), // 'active', 'canceled', 'past_due', 'trialing'
      // Stripe subscription fields
      stripeCustomerId: a.string(), // Stripe customer ID
      stripeSubscriptionId: a.string(), // Stripe subscription ID
      stripePriceId: a.string(), // Current Stripe price ID
      subscriptionCurrentPeriodEnd: a.datetime(), // When current period ends
      subscriptionCancelAtPeriodEnd: a.boolean().default(false), // Whether subscription will cancel at period end
      subscriptionCanceledAt: a.datetime(), // When subscription was canceled
      users: a.hasMany('CompanyUser', 'companyId'),
      trips: a.hasMany('Trip', 'companyId'),
      drivers: a.hasMany('Driver', 'companyId'),
      locations: a.hasMany('Location', 'companyId'),
      filterCategories: a.hasMany('FilterCategory', 'companyId'),
      customFields: a.hasMany('CustomField', 'companyId'),
      customFieldValues: a.hasMany('CustomFieldValue', 'companyId'),
      reportConfigurations: a.hasMany('ReportConfiguration', 'companyId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ]),

  CompanyUser: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      userId: a.string().required(), // Cognito User ID
      email: a.string().required(),
      role: a.enum(['admin', 'manager', 'driver']),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Driver: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(),
      email: a.string(),
      phone: a.string(),
      licenseNumber: a.string(),
      isActive: a.boolean().default(true),
      notificationPreference: a.string(), // 'email', 'sms', or 'both'
      payRatePerTrip: a.float(), // Driver pay per completed trip (optional)
      payRatePerHour: a.float(), // Driver pay per hour (optional)
      trips: a.hasMany('Trip', 'driverId'),
      customFieldValues: a.hasMany('CustomFieldValue', 'driverId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Trip: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      airport: a.string(), // Deprecated: Use location categories instead. Kept for backward compatibility.
      primaryLocationCategory: a.string(), // Primary location category for filtering (e.g., airport code or category name)
      pickupDate: a.datetime().required(),
      flightNumber: a.string().required(),
      pickupLocation: a.string().required(),
      dropoffLocation: a.string().required(),
      numberOfPassengers: a.integer().default(1),
      status: a.enum(['Unassigned', 'Assigned', 'InProgress', 'Completed']),
      driverId: a.id(),
      driver: a.belongsTo('Driver', 'driverId'),
      actualPickupTime: a.datetime(),
      actualDropoffTime: a.datetime(),
      startLocationLat: a.float(), // GPS latitude when trip started
      startLocationLng: a.float(), // GPS longitude when trip started
      completeLocationLat: a.float(), // GPS latitude when trip completed
      completeLocationLng: a.float(), // GPS longitude when trip completed
      flightStatus: a.string(),
      flightStatusLastUpdated: a.datetime(),
      // Recurring job fields
      isRecurring: a.boolean().default(false),
      recurringPattern: a.string(), // 'daily', 'weekly', 'monthly'
      recurringEndDate: a.datetime(), // When to stop creating recurring jobs
      parentTripId: a.id(), // Reference to the original recurring trip
      childTrips: a.hasMany('Trip', 'parentTripId'),
      parentTrip: a.belongsTo('Trip', 'parentTripId'),
      // Financial fields for billing and payroll
      tripRate: a.float(), // Rate charged to customer/airline for this trip
      driverPayAmount: a.float(), // Amount paid to driver for this trip (calculated or fixed)
      notes: a.string(), // Additional notes for billing/payroll verification
      customFieldValues: a.hasMany('CustomFieldValue', 'tripId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Location: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(),
      address: a.string(),
      description: a.string(),
      category: a.string(), // Category for filtering (e.g., 'Airport', 'Hotel', 'Office')
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  FilterCategory: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(), // Category name (e.g., 'Airport', 'Service Type', 'Region')
      field: a.string().required(), // Field to filter on: 'locationCategory', 'pickupLocation', 'dropoffLocation', etc.
      values: a.string(), // JSON array of filter values/options
      displayOrder: a.integer().default(0), // Order for display
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  CustomField: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      entityType: a.enum(['Trip', 'Driver']), // Which entity this field applies to
      name: a.string().required(), // Field name (e.g., 'Vehicle Type', 'Special Instructions')
      label: a.string().required(), // Display label
      fieldType: a.enum(['text', 'number', 'date', 'datetime', 'boolean', 'select', 'textarea']),
      options: a.string(), // JSON array of options for 'select' type fields
      isRequired: a.boolean().default(false),
      displayOrder: a.integer().default(0), // Order for display in forms
      isActive: a.boolean().default(true),
      defaultValue: a.string(), // Default value as string (will be parsed based on fieldType)
      customFieldValues: a.hasMany('CustomFieldValue', 'customFieldId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  CustomFieldValue: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      customFieldId: a.id().required(),
      customField: a.belongsTo('CustomField', 'customFieldId'),
      entityType: a.enum(['Trip', 'Driver']),
      tripId: a.id(), // Reference to Trip if entityType is 'Trip'
      trip: a.belongsTo('Trip', 'tripId'),
      driverId: a.id(), // Reference to Driver if entityType is 'Driver'
      driver: a.belongsTo('Driver', 'driverId'),
      value: a.string().required(), // Stored as string, parsed based on field type
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  ReportConfiguration: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(), // Report name (e.g., 'Monthly Driver Summary', 'Customer Invoice Report')
      reportType: a.enum(['Driver', 'Trip']), // Which entity type this report is for
      fields: a.string().required(), // JSON array of field names to include
      grouping: a.string(), // JSON array of grouping fields
      filters: a.string(), // JSON array of filter configurations
      sortBy: a.string(), // Field to sort by
      sortOrder: a.string().default('asc'), // 'asc' or 'desc'
      displayOrder: a.integer().default(0),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
