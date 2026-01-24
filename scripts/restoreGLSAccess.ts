/**
 * Restore GLS Company Access
 * 
 * This script:
 * 1. Finds or creates the GLS Transportation company
 * 2. Creates a CompanyUser record for the current user
 * 3. Associates existing data with the company if needed
 * 
 * Usage:
 * npx ts-node scripts/restoreGLSAccess.ts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
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

async function restoreGLSAccess() {
  console.log('🔍 Restoring GLS Company Access...\n');

  try {
    // Get current user
    console.log('Step 1: Getting current user...');
    const user = await getCurrentUser();
    const userId = user.userId;
    const userEmail = user.signInDetails?.loginId || user.username || '';
    
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userEmail}`);

    if (!userId) {
      throw new Error('No user ID found. Please make sure you are authenticated.');
    }

    // Step 2: Find or create GLS company
    console.log('\nStep 2: Finding GLS Transportation company...');
    const { data: companiesGLS } = await client.models.Company.list({
      filter: { name: { eq: 'GLS' } }
    });
    const { data: companiesGLSTransport } = await client.models.Company.list({
      filter: { name: { eq: 'GLS Transportation' } }
    });

    let glsCompany: Schema['Company']['type'] | null = null;

    if (companiesGLSTransport && companiesGLSTransport.length > 0) {
      glsCompany = companiesGLSTransport[0];
      console.log(`✅ Found existing GLS Transportation company: ${glsCompany.id}`);
      console.log(`   Name: ${glsCompany.name}`);
      console.log(`   Subdomain: ${glsCompany.subdomain}`);
    } else if (companiesGLS && companiesGLS.length > 0) {
      glsCompany = companiesGLS[0];
      console.log(`✅ Found existing GLS company: ${glsCompany.id}`);
      // Update name to GLS Transportation
      console.log('📝 Updating company name to "GLS Transportation"...');
      const { data: updated } = await client.models.Company.update({
        id: glsCompany.id,
        name: 'GLS Transportation',
      });
      if (updated) {
        glsCompany = updated;
        console.log('✅ Updated company name');
      }
    } else {
      // Create GLS company if it doesn't exist
      console.log('📝 Creating new GLS Transportation company...');
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

    // Step 3: Check if CompanyUser already exists
    console.log('\nStep 3: Checking for existing CompanyUser record...');
    const { data: existingUsers } = await client.models.CompanyUser.list({
      filter: { 
        companyId: { eq: glsCompany.id },
        userId: { eq: userId }
      }
    });

    if (existingUsers && existingUsers.length > 0) {
      const companyUser = existingUsers[0];
      console.log(`✅ CompanyUser record already exists: ${companyUser.id}`);
      console.log(`   Role: ${companyUser.role || 'driver'}`);
      console.log(`   Active: ${companyUser.isActive ? 'Yes' : 'No'}`);
      
      // Activate if inactive
      if (!companyUser.isActive) {
        console.log('📝 Activating CompanyUser record...');
        await client.models.CompanyUser.update({
          id: companyUser.id,
          isActive: true,
        });
        console.log('✅ Activated CompanyUser record');
      }
    } else {
      // Create CompanyUser record
      console.log('📝 Creating CompanyUser record...');
      const { data: newUser, errors: userErrors } = await client.models.CompanyUser.create({
        companyId: glsCompany.id,
        userId: userId,
        email: userEmail,
        role: 'admin',
        isActive: true,
      });

      if (userErrors && userErrors.length > 0) {
        throw new Error(`Failed to create CompanyUser: ${userErrors.map(e => e.message).join(', ')}`);
      }

      if (!newUser) {
        throw new Error('CompanyUser creation returned no data');
      }

      console.log(`✅ Created CompanyUser record: ${newUser.id}`);
      console.log(`   Role: admin`);
    }

    // Step 4: Check for orphaned data
    console.log('\nStep 4: Checking for orphaned data...');
    const { data: orphanedTrips } = await client.models.Trip.list({
      filter: { companyId: { eq: null } }
    });
    const { data: orphanedDrivers } = await client.models.Driver.list({
      filter: { companyId: { eq: null } }
    });
    const { data: orphanedLocations } = await client.models.Location.list({
      filter: { companyId: { eq: null } }
    });

    const orphanCount = (orphanedTrips?.length || 0) + (orphanedDrivers?.length || 0) + (orphanedLocations?.length || 0);
    
    if (orphanCount > 0) {
      console.log(`⚠️  Found ${orphanCount} items without companyId:`);
      console.log(`   - Trips: ${orphanedTrips?.length || 0}`);
      console.log(`   - Drivers: ${orphanedDrivers?.length || 0}`);
      console.log(`   - Locations: ${orphanedLocations?.length || 0}`);
      console.log('\n   Run the migration script to associate them:');
      console.log('   npx ts-node scripts/migrateToMultiTenant.ts');
    } else {
      console.log('✅ No orphaned data found');
    }

    // Step 5: Summary
    console.log('\n✅ GLS Company Access Restored!');
    console.log('\nSummary:');
    console.log(`   Company ID: ${glsCompany.id}`);
    console.log(`   Company Name: ${glsCompany.name}`);
    console.log(`   Your User ID: ${userId}`);
    console.log(`   Your Email: ${userEmail}`);
    console.log('\nNext steps:');
    console.log('1. Refresh the app in your browser');
    console.log('2. You should now see the GLS Transportation company');
    console.log('3. If you see orphaned data, run: npx ts-node scripts/migrateToMultiTenant.ts');

  } catch (error: any) {
    console.error('\n❌ Failed to restore GLS access:', error);
    console.error('Error details:', error.message || error);
    throw error;
  }
}

// Run if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('restoreGLSAccess.ts') ||
                     process.argv[1]?.endsWith('restoreGLSAccess.js');

if (isMainModule) {
  restoreGLSAccess()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { restoreGLSAccess };
