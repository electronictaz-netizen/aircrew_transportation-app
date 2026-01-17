#!/usr/bin/env node
/**
 * Script to check and update all dependencies to latest versions
 * 
 * Usage:
 *   npm run check-deps          # Check for outdated packages
 *   npm run update-deps         # Update to latest versions (dry-run)
 *   npm run update-deps:apply   # Actually update packages
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
  type: 'dependencies' | 'devDependencies';
}

interface OutdatedPackage {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'dependencies' | 'devDependencies';
}

function parseNpmOutdated(output: string): OutdatedPackage[] {
  const lines = output.split('\n').filter(line => line.trim() && !line.startsWith('Package'));
  const outdated: OutdatedPackage[] = [];
  
  // npm outdated format: Package Current Wanted Latest Location
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4) {
      outdated.push({
        package: parts[0],
        current: parts[1],
        wanted: parts[2],
        latest: parts[3],
        type: 'dependencies', // Will be determined from package.json
      });
    }
  }
  
  return outdated;
}

function getPackageJson(): any {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const content = readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(content);
}

function updatePackageJson(updates: Array<{ name: string; version: string; type: 'dependencies' | 'devDependencies' }>, dryRun: boolean = true) {
  const packageJson = getPackageJson();
  
  console.log('\n📦 Packages to update:');
  console.log('='.repeat(80));
  
  updates.forEach(update => {
    const current = packageJson[update.type]?.[update.name] || 'not found';
    console.log(`  ${update.name}:`);
    console.log(`    Current: ${current}`);
    console.log(`    Latest:  ${update.version}`);
    console.log(`    Type:    ${update.type}`);
    console.log('');
  });
  
  if (!dryRun) {
    console.log('🔄 Updating package.json...');
    updates.forEach(update => {
      if (!packageJson[update.type]) {
        packageJson[update.type] = {};
      }
      packageJson[update.type][update.name] = `^${update.version}`;
    });
    
    const packageJsonPath = join(process.cwd(), 'package.json');
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ package.json updated!');
    console.log('\n📥 Run "npm install" to install updated packages.');
  } else {
    console.log('ℹ️  This is a dry-run. Use --apply to actually update.');
  }
}

async function checkDependencies() {
  console.log('🔍 Checking for outdated packages...\n');
  
  try {
    // Run npm outdated
    const output = execSync('npm outdated --json', { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    const outdated = JSON.parse(output);
    const packageJson = getPackageJson();
    
    if (Object.keys(outdated).length === 0) {
      console.log('✅ All packages are up to date!');
      return [];
    }
    
    console.log(`⚠️  Found ${Object.keys(outdated).length} outdated package(s):\n`);
    console.log('='.repeat(80));
    
    const updates: Array<{ name: string; version: string; type: 'dependencies' | 'devDependencies' }> = [];
    
    Object.entries(outdated).forEach(([pkgName, info]: [string, any]) => {
      const isDev = packageJson.devDependencies?.[pkgName] !== undefined;
      const type = isDev ? 'devDependencies' : 'dependencies';
      const current = packageJson[type]?.[pkgName] || 'not found';
      const latest = info.latest || info.wanted;
      
      console.log(`\n📦 ${pkgName}`);
      console.log(`   Current: ${current}`);
      console.log(`   Wanted:  ${info.wanted || 'N/A'}`);
      console.log(`   Latest:  ${latest}`);
      console.log(`   Type:    ${type}`);
      
      updates.push({
        name: pkgName,
        version: latest,
        type: type,
      });
    });
    
    return updates;
  } catch (error: any) {
    if (error.status === 1) {
      // npm outdated exits with code 1 when packages are outdated (this is normal)
      const output = error.stdout || '';
      if (output.trim()) {
        try {
          const outdated = JSON.parse(output);
          const packageJson = getPackageJson();
          const updates: Array<{ name: string; version: string; type: 'dependencies' | 'devDependencies' }> = [];
          
          Object.entries(outdated).forEach(([pkgName, info]: [string, any]) => {
            const isDev = packageJson.devDependencies?.[pkgName] !== undefined;
            const type = isDev ? 'devDependencies' : 'dependencies';
            const latest = info.latest || info.wanted;
            
            updates.push({
              name: pkgName,
              version: latest,
              type: type,
            });
          });
          
          return updates;
        } catch {
          // Fall through to return empty array
        }
      }
    }
    console.error('Error checking dependencies:', error.message);
    return [];
  }
}

async function checkLatestVersions() {
  console.log('🔍 Checking latest versions of key packages...\n');
  
  const keyPackages = [
    '@aws-amplify/backend',
    '@aws-amplify/backend-cli',
    '@aws-amplify/ui-react',
    'aws-amplify',
    'react',
    'react-dom',
    'typescript',
    'vite',
    '@vitejs/plugin-react',
    'aws-cdk-lib',
  ];
  
  const packageJson = getPackageJson();
  const results: Array<{ name: string; current: string; latest: string; type: string }> = [];
  
  for (const pkg of keyPackages) {
    try {
      const latestVersion = execSync(`npm view ${pkg} version`, { 
        encoding: 'utf-8',
        stdio: 'pipe'
      }).trim();
      
      const isDev = packageJson.devDependencies?.[pkg] !== undefined;
      const type = isDev ? 'devDependencies' : 'dependencies';
      const current = packageJson[type]?.[pkg] || 'not installed';
      
      results.push({
        name: pkg,
        current: current,
        latest: latestVersion,
        type: type,
      });
    } catch (error) {
      console.warn(`⚠️  Could not check ${pkg}`);
    }
  }
  
  console.log('📊 Key Package Versions:');
  console.log('='.repeat(80));
  results.forEach(result => {
    const isOutdated = result.current !== 'not installed' && 
                      result.current.replace(/[\^~]/, '') !== result.latest;
    const status = isOutdated ? '⚠️ ' : '✅';
    console.log(`${status} ${result.name.padEnd(30)} Current: ${result.current.padEnd(15)} Latest: ${result.latest} (${result.type})`);
  });
  
  return results.filter(r => r.current !== 'not installed' && r.current.replace(/[\^~]/, '') !== r.latest);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldUpdate = args.includes('--apply') || args.includes('-a');
  const checkLatest = args.includes('--latest') || args.includes('-l');
  
  if (checkLatest) {
    const outdated = await checkLatestVersions();
    if (outdated.length > 0) {
      console.log(`\n⚠️  Found ${outdated.length} package(s) that can be updated.`);
    } else {
      console.log('\n✅ All key packages are up to date!');
    }
    return;
  }
  
  const updates = await checkDependencies();
  
  if (updates.length > 0) {
    updatePackageJson(updates, !shouldUpdate);
    
    if (!shouldUpdate) {
      console.log('\n💡 To apply updates, run:');
      console.log('   npm run update-deps:apply');
      console.log('\n   Or manually:');
      console.log('   npx ts-node --esm scripts/checkAndUpdateDependencies.ts --apply');
    }
  } else {
    console.log('\n✅ No outdated packages found!');
  }
}

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
