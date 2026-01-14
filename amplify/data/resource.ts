import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Driver: a
    .model({
      name: a.string().required(),
      email: a.string(),
      phone: a.string(),
      licenseNumber: a.string(),
      isActive: a.boolean().default(true),
      notificationPreference: a.string(), // 'email', 'sms', or 'both'
      trips: a.hasMany('Trip', 'driverId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Trip: a
    .model({
      airport: a.string(), // Airport code: BUF, ROC, or SYR
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
    .authorization((allow) => [allow.authenticated()]),

  Location: a
    .model({
      name: a.string().required(),
      address: a.string(),
      description: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
