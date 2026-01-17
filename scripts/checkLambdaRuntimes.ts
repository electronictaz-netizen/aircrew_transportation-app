#!/usr/bin/env node
/**
 * Script to check Lambda functions for Node.js 20.x runtime
 * and identify functions that need to be updated to Node.js 22.x
 * 
 * Usage: 
 *   npm run check-lambda
 *   npm run check-lambda:update
 * 
 * Or directly:
 *   npx ts-node --esm scripts/checkLambdaRuntimes.ts
 *   npx ts-node --esm scripts/checkLambdaRuntimes.ts --update
 * 
 * Prerequisites:
 * - AWS credentials configured (via AWS CLI, environment variables, or IAM role)
 * - @aws-sdk/client-lambda installed: npm install --save-dev @aws-sdk/client-lambda
 */

import { LambdaClient, ListFunctionsCommand, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';

interface FunctionInfo {
  functionName: string;
  runtime: string;
  lastModified: string;
  region: string;
  needsUpdate: boolean;
}

const TARGET_RUNTIME = 'nodejs22.x';
const DEPRECATED_RUNTIMES = ['nodejs18.x', 'nodejs18', 'nodejs20.x', 'nodejs20'];
const REGIONS = [
  'us-east-1',      // US East (N. Virginia)
  'us-east-2',      // US East (Ohio)
  'us-west-1',      // US West (N. California)
  'us-west-2',      // US West (Oregon)
  'eu-west-1',     // Europe (Ireland)
  'eu-central-1',  // Europe (Frankfurt)
  'ap-southeast-1', // Asia Pacific (Singapore)
  'ap-southeast-2', // Asia Pacific (Sydney)
];

async function checkRegion(region: string): Promise<FunctionInfo[]> {
  const client = new LambdaClient({ region });
  const functions: FunctionInfo[] = [];

  try {
    console.log(`\n🔍 Checking region: ${region}...`);
    
    const listCommand = new ListFunctionsCommand({});
    const response = await client.send(listCommand);
    
    if (!response.Functions || response.Functions.length === 0) {
      console.log(`   No functions found in ${region}`);
      return functions;
    }

    console.log(`   Found ${response.Functions.length} function(s)`);

    for (const func of response.Functions) {
      if (!func.FunctionName || !func.Runtime) continue;

      const runtime = func.Runtime;
      const needsUpdate = DEPRECATED_RUNTIMES.some(deprecated => 
        runtime.includes(deprecated) || runtime === deprecated
      );

      functions.push({
        functionName: func.FunctionName,
        runtime: runtime,
        lastModified: func.LastModified?.toISOString() || 'Unknown',
        region: region,
        needsUpdate: needsUpdate,
      });

      if (needsUpdate) {
        console.log(`   ⚠️  ${func.FunctionName}: ${runtime} (NEEDS UPDATE)`);
      } else if (runtime.startsWith('nodejs')) {
        console.log(`   ✓  ${func.FunctionName}: ${runtime}`);
      }
    }
  } catch (error: any) {
    if (error.name === 'UnrecognizedClientException' || error.name === 'AccessDeniedException') {
      console.log(`   ⚠️  Cannot access ${region}: ${error.message}`);
    } else {
      console.error(`   ❌ Error checking ${region}:`, error.message);
    }
  }

  return functions;
}

async function checkAllRegions(): Promise<FunctionInfo[]> {
  const allFunctions: FunctionInfo[] = [];
  
  console.log('🚀 Starting Lambda function runtime check...\n');
  console.log(`⚠️  Looking for functions using deprecated runtimes: ${DEPRECATED_RUNTIMES.join(', ')}`);
  console.log(`✅ Target runtime: ${TARGET_RUNTIME}\n`);
  console.log('📋 This check covers:');
  console.log('   - Node.js 18.x (end of support)');
  console.log('   - Node.js 20.x (end of life)\n');

  // Check all regions in parallel
  const regionChecks = REGIONS.map(region => checkRegion(region));
  const results = await Promise.all(regionChecks);
  
  results.forEach(functions => {
    allFunctions.push(...functions);
  });

  return allFunctions;
}

async function updateFunction(functionName: string, region: string): Promise<boolean> {
  const client = new LambdaClient({ region });
  
  try {
    const updateCommand = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Runtime: TARGET_RUNTIME,
    });
    
    await client.send(updateCommand);
    console.log(`   ✅ Updated ${functionName} to ${TARGET_RUNTIME}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Failed to update ${functionName}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldUpdate = args.includes('--update') || args.includes('-u');
  const specificRegion = args.find(arg => arg.startsWith('--region='))?.split('=')[1];

  const regionsToCheck = specificRegion ? [specificRegion] : REGIONS;

  let allFunctions: FunctionInfo[] = [];

  if (specificRegion) {
    allFunctions = await checkRegion(specificRegion);
  } else {
    allFunctions = await checkAllRegions();
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  const totalFunctions = allFunctions.length;
  const nodejsFunctions = allFunctions.filter(f => f.runtime.startsWith('nodejs'));
  const needsUpdate = allFunctions.filter(f => f.needsUpdate);
  const amplifyFunctions = allFunctions.filter(f => 
    f.functionName.includes('amplify') || 
    f.functionName.includes('Amplify') ||
    f.functionName.includes('auth') ||
    f.functionName.includes('data')
  );

  console.log(`\nTotal functions found: ${totalFunctions}`);
  console.log(`Node.js functions: ${nodejsFunctions.length}`);
  console.log(`Functions needing update: ${needsUpdate.length}`);
  console.log(`Amplify-related functions: ${amplifyFunctions.length}`);

  if (needsUpdate.length > 0) {
    console.log('\n⚠️  FUNCTIONS REQUIRING UPDATE:');
    console.log('-'.repeat(80));
    
    // Group by runtime for better visibility
    const byRuntime = needsUpdate.reduce((acc, func) => {
      const runtime = func.runtime;
      if (!acc[runtime]) acc[runtime] = [];
      acc[runtime].push(func);
      return acc;
    }, {} as Record<string, typeof needsUpdate>);
    
    Object.entries(byRuntime).forEach(([runtime, functions]) => {
      const isEOL = runtime.includes('20') ? ' (END OF LIFE)' : runtime.includes('18') ? ' (END OF SUPPORT)' : '';
      console.log(`\n  ${runtime}${isEOL}: ${functions.length} function(s)`);
      functions.forEach(func => {
        console.log(`    - ${func.functionName} (${func.region})`);
        console.log(`      Modified: ${func.lastModified}`);
      });
    });
    
    console.log(`\n  All functions should be updated to: ${TARGET_RUNTIME}`);

    if (shouldUpdate) {
      console.log('\n🔄 Updating functions...');
      console.log('-'.repeat(80));
      
      for (const func of needsUpdate) {
        await updateFunction(func.functionName, func.region);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('\n✅ Update process completed!');
    } else {
      console.log('\n💡 To update these functions automatically, run:');
      console.log('   npx ts-node scripts/checkLambdaRuntimes.ts --update');
      console.log('\n⚠️  Note: Updating Lambda runtimes may require code changes.');
      console.log('   Please test your functions after updating.');
    }
  } else {
    console.log('\n✅ No functions found using deprecated Node.js 18.x or 20.x runtimes!');
  }

  if (amplifyFunctions.length > 0 && needsUpdate.length === 0) {
    console.log('\n📝 Amplify-related functions found:');
    amplifyFunctions.forEach(func => {
      console.log(`   - ${func.functionName} (${func.region}): ${func.runtime}`);
    });
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
