/**
 * Migration Script: Single-Tenant to Multi-Tenant
 * 
 * This script migrates existing data to multi-tenant architecture:
 * 1. Creates default GLS Transportation company
 * 2. Associates all existing trips, drivers, and locations with the company
 * 3. Creates CompanyUser records for existing Cognito users
 * 
 * Run this script ONCE after deploying the multi-tenant schema.
 * 
 * Usage:
 * 1. Deploy the updated schema with Company model (npx ampx sandbox)
 * 2. Run: npx ts-node scripts/migrateToMultiTenant.ts
 * 3. Verify all data is associated correctly
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and configure Amplify
const outputsPath = join(__dirname, '../amplify_outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
Amplify.configure(outputs);

const client = generateClient<Schema>();

async function migrateToMultiTenant() {
  console.log('🚀 Starting migration to multi-tenant architecture...\n');

  try {
    // Check if Company model exists
    if (!client.models.Company) {
      throw new Error(
        'Company model not found. Please deploy the schema first:\n' +
        '  npx ampx sandbox\n' +
        'Then run this script again.'
      );
    }

    // Step 1: Check if GLS Transportation company already exists (try both names)
    console.log('Step 1: Checking for existing GLS Transportation company...');
    const { data: existingCompaniesGLS } = await client.models.Company.list({
      filter: { name: { eq: 'GLS' } }
    });
    const { data: existingCompaniesGLSTransport } = await client.models.Company.list({
      filter: { name: { eq: 'GLS Transportation' } }
    });

    let glsCompany: Schema['Company']['type'] | null = null;

    if (existingCompaniesGLSTransport && existingCompaniesGLSTransport.length > 0) {
      glsCompany = existingCompaniesGLSTransport[0];
      console.log(`✅ Found existing GLS Transportation company: ${glsCompany.id}`);
    } else if (existingCompaniesGLS && existingCompaniesGLS.length > 0) {
      glsCompany = existingCompaniesGLS[0];
      console.log(`✅ Found existing GLS company: ${glsCompany.id}`);
      // Update name to GLS Transportation
      console.log('📝 Updating company name to "GLS Transportation"...');
      await client.models.Company.update({
        id: glsCompany.id,
        name: 'GLS Transportation',
      });
      glsCompany = { ...glsCompany, name: 'GLS Transportation' };
    } else {
      // Step 2: Create GLS Transportation company
      console.log('Step 2: Creating GLS Transportation company...');
      const { data: newCompany, errors: companyErrors } = await client.models.Company.create({
        name: 'GLS Transportation',
        subdomain: 'gls',
        isActive: true,
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      if (companyErrors && companyErrors.length > 0) {
        throw new Error(`Failed to create company: ${companyErrors.map(e => e.message).join(', ')}`);
      }

      if (!newCompany) {
        throw new Error('Company creation returned no data');
      }

      glsCompany = newCompany;
      console.log(`✅ Created GLS Transportation company: ${glsCompany.id}`);
    }

    if (!glsCompany) {
      throw new Error('Failed to get or create GLS company');
    }

    // Step 3: Migrate trips
    console.log('\nStep 3: Migrating trips...');
    const { data: allTrips } = await client.models.Trip.list();
    let tripCount = 0;
    let tripErrors = 0;
    
    for (const trip of allTrips || []) {
      if (!trip.companyId) {
        try {
          await client.models.Trip.update({
            id: trip.id,
            companyId: glsCompany.id,
          });
          tripCount++;
          if (tripCount % 10 === 0) {
            console.log(`  Migrated ${tripCount} trips...`);
          }
        } catch (error) {
          console.error(`  ❌ Error migrating trip ${trip.id}:`, error);
          tripErrors++;
        }
      }
    }
    console.log(`✅ Migrated ${tripCount} trips${tripErrors > 0 ? ` (${tripErrors} errors)` : ''}`);

    // Step 4: Migrate drivers
    console.log('\nStep 4: Migrating drivers...');
    const { data: allDrivers } = await client.models.Driver.list();
    let driverCount = 0;
    let driverErrors = 0;
    
    for (const driver of allDrivers || []) {
      if (!driver.companyId) {
        try {
          await client.models.Driver.update({
            id: driver.id,
            companyId: glsCompany.id,
          });
          driverCount++;
        } catch (error) {
          console.error(`  ❌ Error migrating driver ${driver.id}:`, error);
          driverErrors++;
        }
      }
    }
    console.log(`✅ Migrated ${driverCount} drivers${driverErrors > 0 ? ` (${driverErrors} errors)` : ''}`);

    // Step 5: Migrate locations
    console.log('\nStep 5: Migrating locations...');
    const { data: allLocations } = await client.models.Location.list();
    let locationCount = 0;
    let locationErrors = 0;
    
    for (const location of allLocations || []) {
      if (!location.companyId) {
        try {
          await client.models.Location.update({
            id: location.id,
            companyId: glsCompany.id,
          });
          locationCount++;
        } catch (error) {
          console.error(`  ❌ Error migrating location ${location.id}:`, error);
          locationErrors++;
        }
      }
    }
    console.log(`✅ Migrated ${locationCount} locations${locationErrors > 0 ? ` (${locationErrors} errors)` : ''}`);

    // Step 6: Note about CompanyUser records
    console.log('\nStep 6: CompanyUser records...');
    console.log('ℹ️  CompanyUser records will be created automatically when users log in.');
    console.log('   The CompanyContext will create them if they don\'t exist.');

    // Step 7: Verification
    console.log('\nStep 7: Verifying migration...');
    const { data: verifyTrips } = await client.models.Trip.list({
      filter: { companyId: { eq: glsCompany.id } }
    });
    const { data: verifyDrivers } = await client.models.Driver.list({
      filter: { companyId: { eq: glsCompany.id } }
    });
    const { data: verifyLocations } = await client.models.Location.list({
      filter: { companyId: { eq: glsCompany.id } }
    });

    console.log(`✅ Verification:`);
    console.log(`   - Trips with companyId: ${verifyTrips?.length || 0}`);
    console.log(`   - Drivers with companyId: ${verifyDrivers?.length || 0}`);
    console.log(`   - Locations with companyId: ${verifyLocations?.length || 0}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Have users log in (CompanyUser records will be created automatically)');
    console.log('2. Verify all data is accessible');
    console.log('3. Test creating new trips, drivers, and locations');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message || error);
    throw error;
  }
}

// Run migration if this file is executed directly
// Check if running as main module (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('migrateToMultiTenant.ts') ||
                     process.argv[1]?.endsWith('migrateToMultiTenant.js');

if (isMainModule) {
  migrateToMultiTenant()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      console.error('\nTroubleshooting:');
      console.error('1. Ensure the schema is deployed: npx ampx sandbox');
      console.error('2. Check that amplify_outputs.json exists and is valid');
      console.error('3. Verify AWS credentials are configured');
      process.exit(1);
    });
}

export { migrateToMultiTenant };
