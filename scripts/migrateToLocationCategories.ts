/**
 * Migration script to populate primaryLocationCategory from airport field
 * and create default filter categories for existing companies.
 * 
 * Run with: npx ts-node scripts/migrateToLocationCategories.ts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Amplify configuration
const outputsPath = join(__dirname, '../amplify_outputs.json');
let outputs: any;
try {
  const outputsContent = readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.error('❌ Error reading amplify_outputs.json:', error);
  console.error('Please ensure amplify_outputs.json exists and is valid JSON.');
  process.exit(1);
}

// Configure Amplify
try {
  Amplify.configure(outputs);
} catch (error) {
  console.error('❌ Error configuring Amplify:', error);
  process.exit(1);
}

const client = generateClient<Schema>();

async function migrateToLocationCategories() {
  console.log('🚀 Starting migration to location categories...\n');

  // Check if models exist
  if (!client.models.Trip || !client.models.Company) {
    console.error('❌ Trip or Company model not found. Please deploy the schema first.');
    console.error('Run: npx ampx sandbox');
    process.exit(1);
  }

  try {
    // Step 1: Get all companies
    console.log('📋 Step 1: Loading companies...');
    const { data: companies } = await client.models.Company.list();
    if (!companies || companies.length === 0) {
      console.log('⚠️  No companies found. Skipping migration.');
      return;
    }
    console.log(`   Found ${companies.length} company/companies\n`);

    // Step 2: For each company, migrate trips
    for (const company of companies) {
      console.log(`🏢 Processing company: ${company.name} (${company.id})`);
      
      // Get all trips for this company
      const { data: trips } = await client.models.Trip.list({
        filter: { companyId: { eq: company.id } }
      });

      if (!trips || trips.length === 0) {
        console.log(`   No trips found for ${company.name}\n`);
        continue;
      }

      console.log(`   Found ${trips.length} trip(s)`);

      // Migrate trips: populate primaryLocationCategory from airport
      let updatedCount = 0;
      let skippedCount = 0;

      for (const trip of trips) {
        // Only update if airport exists but primaryLocationCategory doesn't
        if (trip.airport && !trip.primaryLocationCategory) {
          try {
            await client.models.Trip.update({
              id: trip.id,
              primaryLocationCategory: trip.airport,
            });
            updatedCount++;
          } catch (error) {
            console.error(`   ❌ Error updating trip ${trip.id}:`, error);
          }
        } else {
          skippedCount++;
        }
      }

      console.log(`   ✅ Updated ${updatedCount} trip(s), skipped ${skippedCount} trip(s)`);

      // Step 3: Check if filter categories exist, create default if not
      const { data: existingCategories } = await client.models.FilterCategory.list({
        filter: { companyId: { eq: company.id } }
      });

      if (!existingCategories || existingCategories.length === 0) {
        console.log(`   📝 Creating default filter category for ${company.name}...`);
        
        // Get unique location categories from trips
        const locationCategories = new Set<string>();
        trips.forEach(trip => {
          const cat = trip.primaryLocationCategory || trip.airport;
          if (cat) locationCategories.add(cat);
        });

        if (locationCategories.size > 0) {
          try {
            await client.models.FilterCategory.create({
              name: 'Location Category',
              field: 'primaryLocationCategory',
              values: JSON.stringify(Array.from(locationCategories).sort()),
              displayOrder: 0,
              isActive: true,
              companyId: company.id,
            });
            console.log(`   ✅ Created default filter category with ${locationCategories.size} value(s)`);
          } catch (error) {
            console.error(`   ❌ Error creating filter category:`, error);
          }
        } else {
          console.log(`   ⚠️  No location categories found, skipping filter category creation`);
        }
      } else {
        console.log(`   ℹ️  Filter categories already exist (${existingCategories.length})`);
      }

      console.log('');
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review filter categories in the Management Dashboard');
    console.log('   2. Add locations with categories if needed');
    console.log('   3. Update filter category values as needed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1])) {
  migrateToLocationCategories()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateToLocationCategories };
