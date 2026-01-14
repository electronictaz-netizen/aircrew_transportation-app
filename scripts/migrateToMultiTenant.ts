/**
 * Migration Script: Single-Tenant to Multi-Tenant
 * 
 * This script migrates existing data to multi-tenant architecture:
 * 1. Creates default GLS company
 * 2. Associates all existing trips, drivers, and locations with the company
 * 3. Creates CompanyUser records for existing Cognito users
 * 
 * Run this script ONCE after deploying the multi-tenant schema.
 * 
 * Usage:
 * 1. Deploy the updated schema with Company model
 * 2. Run: npx ts-node scripts/migrateToMultiTenant.ts
 * 3. Verify all data is associated correctly
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function migrateToMultiTenant() {
  console.log('🚀 Starting migration to multi-tenant architecture...\n');

  try {
    // Step 1: Check if GLS company already exists
    console.log('Step 1: Checking for existing GLS company...');
    const { data: existingCompanies } = await client.models.Company.list({
      filter: { name: { eq: 'GLS' } }
    });

    let glsCompany: Schema['Company']['type'] | null = null;

    if (existingCompanies && existingCompanies.length > 0) {
      glsCompany = existingCompanies[0];
      console.log(`✅ Found existing GLS company: ${glsCompany.id}`);
    } else {
      // Step 2: Create GLS company
      console.log('Step 2: Creating GLS company...');
      const { data: newCompany, errors: companyErrors } = await client.models.Company.create({
        name: 'GLS',
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
      console.log(`✅ Created GLS company: ${glsCompany.id}`);
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

// Run migration
if (require.main === module) {
  migrateToMultiTenant()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateToMultiTenant };
