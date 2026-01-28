import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Company: a
    .model({
      name: a.string().required(),
      displayName: a.string(), // Custom name displayed in the app
      logoUrl: a.string(), // URL to company logo image
      subdomain: a.string(),
      bookingCode: a.string(), // Unique code for booking portal (e.g., "ACME", "ABC123")
      bookingEnabled: a.boolean().default(false), // Whether booking portal is enabled
      bookingSettings: a.string(), // JSON string with booking configuration (pricing rules, etc.)
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
      // Trial period fields
      trialEndDate: a.datetime(), // When the free trial period ends (if applicable)
      isTrialActive: a.boolean().default(false), // Whether company is currently on a trial
      users: a.hasMany('CompanyUser', 'companyId'),
      trips: a.hasMany('Trip', 'companyId'),
      drivers: a.hasMany('Driver', 'companyId'),
      locations: a.hasMany('Location', 'companyId'),
      vehicles: a.hasMany('Vehicle', 'companyId'),
      customers: a.hasMany('Customer', 'companyId'),
      bookingRequests: a.hasMany('BookingRequest', 'companyId'),
      filterCategories: a.hasMany('FilterCategory', 'companyId'),
      customFields: a.hasMany('CustomField', 'companyId'),
      customFieldValues: a.hasMany('CustomFieldValue', 'companyId'),
      reportConfigurations: a.hasMany('ReportConfiguration', 'companyId'),
      tripVehicles: a.hasMany('TripVehicle', 'companyId'),
      vehicleLocations: a.hasMany('VehicleLocation', 'companyId'),
      tripTemplates: a.hasMany('TripTemplate', 'companyId'),
      tripNotes: a.hasMany('TripNote', 'companyId'),
      modificationRequests: a.hasMany('TripModificationRequest', 'companyId'),
      tripRatings: a.hasMany('TripRating', 'companyId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
      // allow.resource(publicBooking) is not a function in this @aws-amplify/backend version.
      // publicBooking Lambda uses IAM-signed listCompanies (Cognito may see more companies).
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
      vehicleLocations: a.hasMany('VehicleLocation', 'driverId'),
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
      customerId: a.id(),
      customer: a.belongsTo('Customer', 'customerId'),
      tripVehicles: a.hasMany('TripVehicle', 'tripId'),
      vehicleLocations: a.hasMany('VehicleLocation', 'tripId'),
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
      proofOfDeliveryPhoto: a.string(), // URL to proof of delivery photo
      proofOfDeliveryPhotoTimestamp: a.datetime(), // When photo was taken
      customFieldValues: a.hasMany('CustomFieldValue', 'tripId'),
      bookingRequests: a.hasMany('BookingRequest', 'tripId'),
      tripNotes: a.hasMany('TripNote', 'tripId'),
      modificationRequests: a.hasMany('TripModificationRequest', 'tripId'),
      ratings: a.hasMany('TripRating', 'tripId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  TripTemplate: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(), // Template name (e.g., "Airport to Downtown", "Standard Corporate Route")
      description: a.string(), // Optional description
      tripType: a.string(), // 'Airport Trip' | 'Standard Trip'
      primaryLocationCategory: a.string(), // Primary location category for filtering
      flightNumber: a.string(), // Flight number pattern or empty for standard trips
      jobNumber: a.string(), // Job number pattern for standard trips
      pickupLocation: a.string().required(),
      dropoffLocation: a.string().required(),
      numberOfPassengers: a.integer().default(1),
      vehicleType: a.string(), // Preferred vehicle type
      customerId: a.id(), // Default customer (optional)
      customer: a.belongsTo('Customer', 'customerId'),
      tripRate: a.float(), // Default trip rate
      driverPayAmount: a.float(), // Default driver pay amount
      notes: a.string(), // Default notes
      isActive: a.boolean().default(true),
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

  Vehicle: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(), // Vehicle name/identifier (e.g., "Van 1", "SUV-123", "Sedan A")
      make: a.string(), // Vehicle make (e.g., "Ford", "Chevrolet")
      model: a.string(), // Vehicle model (e.g., "Transit", "Suburban")
      year: a.integer(), // Vehicle year
      licensePlate: a.string(), // License plate number
      vin: a.string(), // Vehicle Identification Number
      description: a.string(), // Additional details or notes
      isActive: a.boolean().default(true),
      tripVehicles: a.hasMany('TripVehicle', 'vehicleId'),
      vehicleLocations: a.hasMany('VehicleLocation', 'vehicleId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Customer: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      name: a.string().required(), // Customer name
      email: a.string(), // Customer email
      phone: a.string(), // Customer phone number
      companyName: a.string(), // If customer is a company/organization
      notes: a.string(), // Additional notes about the customer
      isActive: a.boolean().default(true),
      // SMS preferences for TCPA compliance
      smsOptIn: a.boolean().default(false), // Whether customer has opted in to SMS
      smsOptInAt: a.datetime(), // When customer opted in
      smsOptOutAt: a.datetime(), // When customer opted out
      // Customer Portal fields
      portalEnabled: a.boolean().default(false), // Whether customer can access portal
      portalPasswordHash: a.string(), // Hashed password for portal access (optional, can use email verification instead)
      portalAccessCode: a.string(), // Unique access code for passwordless login
      lastPortalLogin: a.datetime(), // Last time customer logged into portal
      trips: a.hasMany('Trip', 'customerId'),
      bookingRequests: a.hasMany('BookingRequest', 'customerId'),
      tripTemplates: a.hasMany('TripTemplate', 'customerId'),
      tripModificationRequests: a.hasMany('TripModificationRequest', 'customerId'),
      tripRatings: a.hasMany('TripRating', 'customerId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  BookingRequest: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      status: a.enum(['Pending', 'Accepted', 'Rejected']),
      customerName: a.string().required(),
      customerEmail: a.string().required(),
      customerPhone: a.string().required(),
      customerCompany: a.string(),
      tripType: a.string(), // 'Airport Trip' | 'Standard Trip'
      pickupDate: a.datetime().required(),
      flightNumber: a.string(),
      jobNumber: a.string(),
      pickupLocation: a.string().required(),
      dropoffLocation: a.string().required(),
      numberOfPassengers: a.integer().default(1),
      vehicleType: a.string(),
      isRoundTrip: a.boolean().default(false),
      returnDate: a.datetime(),
      returnTime: a.string(),
      specialInstructions: a.string(),
      receivedAt: a.datetime(), // When the request was received (portal or API)
      tripId: a.id(), // Set when accepted; created Trip
      trip: a.belongsTo('Trip', 'tripId'),
      customerId: a.id(), // Set when accepted; created or matched Customer
      customer: a.belongsTo('Customer', 'customerId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
      // allow.resource(publicBooking) not available; Lambda createBookingRequest uses IAM.
    ]),

  // Custom query to work around missing model-generated listBookingRequests / ModelBookingRequestFilterInput in AppSync.
  // Named listBookingRequestsForCompany to avoid "Resource already exists" for listBookingRequestsByCompany.
  listBookingRequestsForCompany: a
    .query()
    .arguments({ companyId: a.id().required() })
    .returns(a.ref('BookingRequest').array())
    .handler(
      a.handler.custom({
        dataSource: a.ref('BookingRequest'),
        entry: './list-booking-requests-by-company.js',
      })
    )
    .authorization((allow) => [allow.authenticated()]),

  TripVehicle: a
    .model({
      tripId: a.id().required(),
      trip: a.belongsTo('Trip', 'tripId'),
      vehicleId: a.id().required(),
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
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

  VehicleLocation: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      tripId: a.id().required(), // Which trip this location is for
      trip: a.belongsTo('Trip', 'tripId'),
      driverId: a.id().required(), // Which driver
      driver: a.belongsTo('Driver', 'driverId'),
      vehicleId: a.id(), // Which vehicle (optional, may not always be assigned)
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
      latitude: a.float().required(), // GPS latitude
      longitude: a.float().required(), // GPS longitude
      accuracy: a.float(), // GPS accuracy in meters
      speed: a.float(), // Speed in meters per second (if available)
      heading: a.float(), // Heading/bearing in degrees (0-360, if available)
      timestamp: a.datetime().required(), // When this location was recorded
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  TripNote: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      tripId: a.id().required(),
      trip: a.belongsTo('Trip', 'tripId'),
      noteType: a.enum(['manager', 'driver', 'internal']), // Type of note
      content: a.string().required(), // Note content
      authorId: a.string().required(), // Cognito User ID of the author
      authorName: a.string().required(), // Display name of the author
      authorEmail: a.string(), // Email of the author (for @mentions)
      authorRole: a.string(), // Role of the author (admin, manager, driver)
      isInternal: a.boolean().default(false), // Internal comments (manager-to-manager)
      mentions: a.string(), // JSON array of mentioned user IDs/emails
      photoUrl: a.string(), // URL to photo attachment (if any)
      voiceNoteUrl: a.string(), // URL to voice note audio file (if any)
      voiceNoteDuration: a.float(), // Duration of voice note in seconds
      createdAt: a.datetime().required(), // When note was created
      updatedAt: a.datetime(), // When note was last updated
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  TripModificationRequest: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      tripId: a.id().required(),
      trip: a.belongsTo('Trip', 'tripId'),
      customerId: a.id().required(),
      customer: a.belongsTo('Customer', 'customerId'),
      requestType: a.enum(['date', 'time', 'location', 'passengers', 'other']), // Type of modification
      requestedChanges: a.string().required(), // JSON string with requested changes
      reason: a.string(), // Customer's reason for request
      status: a.enum(['pending', 'approved', 'rejected', 'completed']), // Default 'pending' handled in application code
      managerNotes: a.string(), // Manager's notes on the request
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
      respondedAt: a.datetime(), // When manager responded
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  TripRating: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      tripId: a.id().required(),
      trip: a.belongsTo('Trip', 'tripId'),
      customerId: a.id().required(),
      customer: a.belongsTo('Customer', 'customerId'),
      rating: a.integer().required(), // 1-5 stars
      review: a.string(), // Optional text review
      driverRating: a.integer(), // Separate rating for driver (1-5)
      vehicleRating: a.integer(), // Separate rating for vehicle (1-5)
      wouldRecommend: a.boolean(), // Would recommend to others
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  PushSubscription: a
    .model({
      companyId: a.id().required(),
      company: a.belongsTo('Company', 'companyId'),
      userId: a.string().required(), // Cognito User ID
      endpoint: a.string().required(), // Push subscription endpoint URL
      keys: a.string().required(), // JSON string with p256dh and auth keys
      userAgent: a.string(), // Browser user agent
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
      lastUsed: a.datetime(), // Last time this subscription was used
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
