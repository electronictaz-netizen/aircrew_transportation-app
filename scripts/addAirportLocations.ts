/**
 * Script to add old airport codes as saved locations for a company
 * 
 * Run with: npx ts-node scripts/addAirportLocations.ts
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

// Airport definitions
const AIRPORTS = [
  { code: 'BUF', name: 'Buffalo Niagara International Airport (BUF)', address: 'Buffalo, NY' },
  { code: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport (ROC)', address: 'Rochester, NY' },
  { code: 'SYR', name: 'Syracuse Hancock International Airport (SYR)', address: 'Syracuse, NY' },
  { code: 'ALB', name: 'Albany International Airport (ALB)', address: 'Albany, NY' },
];

async function addAirportLocations() {
  console.log('🚀 Starting airport locations migration...\n');

  // Check if models exist
  if (!client.models.Location || !client.models.Company) {
    console.error('❌ Location or Company model not found. Please deploy the schema first.');
    console.error('Run: npx ampx sandbox');
    process.exit(1);
  }

  try {
    // Find GLS Transportation company (or GLS as fallback)
    console.log('📋 Step 1: Finding GLS company...');
    const { data: companies } = await client.models.Company.list();
    const glsCompany = companies?.find(
      c => c.name === 'GLS Transportation' || c.name === 'GLS'
    );

    if (!glsCompany) {
      console.error('❌ GLS Transportation company not found.');
      console.error('Please create the company first or update the script to use a different company name.');
      process.exit(1);
    }

    console.log(`   ✅ Found company: ${glsCompany.name} (${glsCompany.id})\n`);

    // Check existing locations
    console.log('📋 Step 2: Checking existing locations...');
    const { data: existingLocations } = await client.models.Location.list({
      filter: { companyId: { eq: glsCompany.id } }
    });

    const existingLocationNames = new Set(
      (existingLocations || []).map(l => l.name)
    );

    console.log(`   Found ${existingLocations?.length || 0} existing location(s)\n`);

    // Add airports as locations
    console.log('📋 Step 3: Adding airport locations...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const airport of AIRPORTS) {
      // Check if location already exists
      if (existingLocationNames.has(airport.name)) {
        console.log(`   ⏭️  Skipping ${airport.code}: Already exists`);
        skippedCount++;
        continue;
      }

      try {
        await client.models.Location.create({
          name: airport.name,
          address: airport.address,
          category: 'Airport',
          description: `Airport code: ${airport.code}`,
          isActive: true,
          companyId: glsCompany.id,
        });
        console.log(`   ✅ Created: ${airport.name} (${airport.code})`);
        createdCount++;
      } catch (error) {
        console.error(`   ❌ Error creating ${airport.code}:`, error);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Created: ${createdCount} location(s)`);
    console.log(`   Skipped: ${skippedCount} location(s) (already exist)`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Verify locations in Management Dashboard > Manage Locations`);
    console.log(`   2. Create a filter category for "Airport" if needed`);
    console.log(`   3. Use "Auto-fill" when creating filter categories to include these airports`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1])) {
  addAirportLocations()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { addAirportLocations };
