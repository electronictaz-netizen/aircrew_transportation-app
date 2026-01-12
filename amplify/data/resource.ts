import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Driver: a
    .model({
      name: a.string().required(),
      email: a.string(),
      phone: a.string(),
      licenseNumber: a.string(),
      isActive: a.boolean().default(true),
      trips: a.hasMany('Trip', 'driverId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Trip: a
    .model({
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
