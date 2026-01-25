/**
 * Snapshot GLS Company
 *
 * Exports the GLS Transportation company and all related data to a JSON file
 * for backup before making changes (e.g. passenger-facing booking portal).
 *
 * Usage:
 *   npx ts-node --esm scripts/snapshotGLSCompany.ts
 *
 * Auth:
 *   - Uses getCurrentUser(); you must have a valid Cognito session.
 *   - Optional: set COGNITO_USER and COGNITO_PASSWORD to sign in before running
 *     (useful when running from Node/CI without a browser session).
 *
 * Output:
 *   scripts/backups/gls-snapshot-YYYY-MM-DDTHHmmss.json
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, signIn } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputsPath = join(__dirname, '../amplify_outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
Amplify.configure(outputs);

const client = generateClient<Schema>();

type ListResult<T> = { data: T[] | null; nextToken?: string | null };

/** Paginate through a model list until all pages are fetched. */
async function listAll<T>(
  opts: { filter: Record<string, unknown> },
  list: (o: { filter: Record<string, unknown>; nextToken?: string }) => Promise<ListResult<T>>
): Promise<T[]> {
  const all: T[] = [];
  let next: string | undefined;
  do {
    const res = await list({ ...opts, nextToken: next });
    all.push(...(res.data ?? []));
    next = res.nextToken ?? undefined;
  } while (next);
  return all;
}

export interface GlsSnapshot {
  exportedAt: string;
  companyId: string;
  company: Schema['Company']['type'];
  companyUsers: Schema['CompanyUser']['type'][];
  locations: Schema['Location']['type'][];
  trips: Schema['Trip']['type'][];
  drivers: Schema['Driver']['type'][];
  vehicles: Schema['Vehicle']['type'][];
  customers: Schema['Customer']['type'][];
  filterCategories: Schema['FilterCategory']['type'][];
  customFields: Schema['CustomField']['type'][];
  customFieldValues: Schema['CustomFieldValue']['type'][];
  reportConfigurations: Schema['ReportConfiguration']['type'][];
  tripVehicles: Schema['TripVehicle']['type'][];
  vehicleLocations: Schema['VehicleLocation']['type'][];
}

async function snapshotGLSCompany(): Promise<GlsSnapshot> {
  console.log('🔍 Snapshot GLS Company...\n');

  // Optional: sign in if COGNITO_USER and COGNITO_PASSWORD are set
  const cognitoUser = process.env.COGNITO_USER;
  const cognitoPassword = process.env.COGNITO_PASSWORD;
  if (cognitoUser && cognitoPassword) {
    console.log('Signing in with COGNITO_USER...');
    await signIn({ username: cognitoUser, password: cognitoPassword });
    console.log('   Signed in.\n');
  }

  console.log('Step 1: Resolving current user...');
  const user = await getCurrentUser();
  if (!user?.userId) {
    throw new Error('No authenticated user. Sign in in the app or set COGNITO_USER and COGNITO_PASSWORD.');
  }
  console.log(`   User: ${user.signInDetails?.loginId || user.username || user.userId}\n`);

  console.log('Step 2: Finding GLS company...');
  if (typeof (client.models as Record<string, { list?: unknown }> | undefined)?.Company?.list !== 'function') {
    throw new Error(
      'amplify_outputs.json is missing data.model_introspection. ' +
      'Run "npx ampx sandbox" (or deploy) so it gets updated with model_introspection, then run the snapshot again.'
    );
  }
  const { data: byTransport } = await client.models.Company.list({
    filter: { name: { eq: 'GLS Transportation' } },
  });
  const { data: byGls } = await client.models.Company.list({
    filter: { name: { eq: 'GLS' } },
  });

  const glsCompany: Schema['Company']['type'] | null =
    (byTransport && byTransport.length > 0)
      ? byTransport[0]
      : (byGls && byGls.length > 0)
        ? byGls[0]
        : null;

  if (!glsCompany) {
    throw new Error('GLS company not found (searched for "GLS Transportation" and "GLS").');
  }
  console.log(`   Found: ${glsCompany.name} (${glsCompany.id})\n`);

  const filter = { companyId: { eq: glsCompany.id } };

  console.log('Step 3: Exporting related data (with pagination)...');

  const [
    companyUsers,
    locations,
    trips,
    drivers,
    vehicles,
    customers,
    filterCategories,
    customFields,
    customFieldValues,
    reportConfigurations,
    tripVehicles,
    vehicleLocations,
  ] = await Promise.all([
    listAll(filter, (o) => client.models.CompanyUser.list(o)),
    listAll(filter, (o) => client.models.Location.list(o)),
    listAll(filter, (o) => client.models.Trip.list(o)),
    listAll(filter, (o) => client.models.Driver.list(o)),
    listAll(filter, (o) => client.models.Vehicle.list(o)),
    listAll(filter, (o) => client.models.Customer.list(o)),
    listAll(filter, (o) => client.models.FilterCategory.list(o)),
    listAll(filter, (o) => client.models.CustomField.list(o)),
    listAll(filter, (o) => client.models.CustomFieldValue.list(o)),
    listAll(filter, (o) => client.models.ReportConfiguration.list(o)),
    listAll(filter, (o) => client.models.TripVehicle.list(o)),
    listAll(filter, (o) => client.models.VehicleLocation.list(o)),
  ]);

  const snapshot: GlsSnapshot = {
    exportedAt: new Date().toISOString(),
    companyId: glsCompany.id,
    company: glsCompany,
    companyUsers,
    locations,
    trips,
    drivers,
    vehicles,
    customers,
    filterCategories,
    customFields,
    customFieldValues,
    reportConfigurations,
    tripVehicles,
    vehicleLocations,
  };

  console.log('   CompanyUsers:      ' + companyUsers.length);
  console.log('   Locations:         ' + locations.length);
  console.log('   Trips:             ' + trips.length);
  console.log('   Drivers:           ' + drivers.length);
  console.log('   Vehicles:          ' + vehicles.length);
  console.log('   Customers:         ' + customers.length);
  console.log('   FilterCategories:  ' + filterCategories.length);
  console.log('   CustomFields:      ' + customFields.length);
  console.log('   CustomFieldValues: ' + customFieldValues.length);
  console.log('   ReportConfigs:     ' + reportConfigurations.length);
  console.log('   TripVehicles:      ' + tripVehicles.length);
  console.log('   VehicleLocations:  ' + vehicleLocations.length);

  return snapshot;
}

function writeSnapshot(snapshot: GlsSnapshot): string {
  const backupsDir = join(__dirname, 'backups');
  mkdirSync(backupsDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15); // YYYY-MM-DDTHHmmss
  const filename = `gls-snapshot-${ts}.json`;
  const filepath = join(backupsDir, filename);

  const json = JSON.stringify(snapshot, null, 2);
  writeFileSync(filepath, json, 'utf-8');
  return filepath;
}

const isMain = process.argv[1]?.includes('snapshotGLSCompany') ?? false;

if (isMain) {
  snapshotGLSCompany()
    .then((snapshot) => {
      const path = writeSnapshot(snapshot);
      console.log('\n✅ Snapshot written to: ' + path);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Snapshot failed:', err?.message ?? err);
      process.exit(1);
    });
}

export { snapshotGLSCompany, writeSnapshot, type GlsSnapshot };
