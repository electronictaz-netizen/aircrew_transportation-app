#!/usr/bin/env node
/**
 * Script to update all dependencies to their latest versions
 * 
 * Usage:
 *   npm run update-deps          # Show what would be updated (dry-run)
 *   npm run update-deps:apply    # Actually update package.json
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageUpdate {
  name: string;
  current: string;
  latest: string;
  type: 'dependencies' | 'devDependencies';
}

async function getLatestVersion(packageName: string): Promise<string> {
  try {
    const version = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
    return version;
  } catch (error) {
    console.warn(`⚠️  Could not fetch latest version for ${packageName}`);
    return '';
  }
}

async function checkAndUpdatePackages(apply: boolean = false) {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  const updates: PackageUpdate[] = [];
  
  console.log('🔍 Checking for package updates...\n');
  
  // Check dependencies
  console.log('📦 Checking dependencies...');
  for (const [pkgName, currentVersion] of Object.entries(packageJson.dependencies || {})) {
    const latest = await getLatestVersion(pkgName);
    if (latest && latest !== currentVersion.toString().replace(/[\^~]/, '')) {
      updates.push({
        name: pkgName,
        current: currentVersion.toString(),
        latest: latest,
        type: 'dependencies',
      });
    }
  }
  
  // Check devDependencies
  console.log('📦 Checking devDependencies...');
  for (const [pkgName, currentVersion] of Object.entries(packageJson.devDependencies || {})) {
    const latest = await getLatestVersion(pkgName);
    if (latest && latest !== currentVersion.toString().replace(/[\^~]/, '')) {
      updates.push({
        name: pkgName,
        current: currentVersion.toString(),
        latest: latest,
        type: 'devDependencies',
      });
    }
  }
  
  if (updates.length === 0) {
    console.log('\n✅ All packages are already at their latest versions!');
    return;
  }
  
  console.log(`\n📊 Found ${updates.length} package(s) that can be updated:\n`);
  console.log('='.repeat(80));
  
  updates.forEach(update => {
    console.log(`\n📦 ${update.name}`);
    console.log(`   Current: ${update.current}`);
    console.log(`   Latest:  ${update.latest}`);
    console.log(`   Type:    ${update.type}`);
  });
  
  if (apply) {
    console.log('\n🔄 Updating package.json...');
    
    updates.forEach(update => {
      // Preserve the version prefix (^ or ~) if it exists
      const prefix = update.current.match(/^[\^~]/)?.[0] || '^';
      packageJson[update.type][update.name] = `${prefix}${update.latest}`;
    });
    
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ package.json updated!');
    console.log('\n📥 Next steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Test your application');
    console.log('   3. Commit the updated package.json and package-lock.json');
  } else {
    console.log('\n💡 This is a dry-run. To apply updates, run:');
    console.log('   npm run update-deps:apply');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || args.includes('-a');
  
  await checkAndUpdatePackages(apply);
}

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
