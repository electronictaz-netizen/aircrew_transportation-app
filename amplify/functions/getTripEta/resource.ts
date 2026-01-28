import { defineFunction } from '@aws-amplify/backend';

export const getTripEta = defineFunction({
  name: 'getTripEta',
  entry: './handler.ts',
  timeoutSeconds: 10,
  // Returns driving ETA from origin to destination via OSRM. Call via Function URL from VehicleTrackingMap.
});
