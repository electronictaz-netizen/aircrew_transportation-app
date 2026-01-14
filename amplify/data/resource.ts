import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Company: a
    .model({
      name: a.string().required(),
      displayName: a.string(), // Custom name displayed in the app
      logoUrl: a.string(), // URL to company logo image
      subdomain: a.string(),
      isActive: a.boolean().default(true),
      subscriptionTier: a.string().default('premium'),
      subscriptionStatus: a.string().default('active'),
      users: a.hasMany('CompanyUser', 'companyId'),
      trips: a.hasMany('Trip', 'companyId'),
      drivers: a.hasMany('Driver', 'companyId'),
      locations: a.hasMany('Location', 'companyId'),
      filterCategories: a.hasMany('FilterCategory', 'companyId'),
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
      trips: a.hasMany('Trip', 'driverId'),
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
      flightStatus: a.string(),
      flightStatusLastUpdated: a.datetime(),
      // Recurring job fields
      isRecurring: a.boolean().default(false),
      recurringPattern: a.string(), // 'daily', 'weekly', 'monthly'
      recurringEndDate: a.datetime(), // When to stop creating recurring jobs
      parentTripId: a.id(), // Reference to the original recurring trip
      childTrips: a.hasMany('Trip', 'parentTripId'),
      parentTrip: a.belongsTo('Trip', 'parentTripId'),
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
