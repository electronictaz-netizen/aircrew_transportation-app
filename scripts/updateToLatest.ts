#!/usr/bin/env node
/**
 * Comprehensive dependency update script
 * Updates all packages to their latest versions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface PackageInfo {
  name: string;
  current: string;
  latest: string;
  type: 'dependencies' | 'devDependencies';
}

async function fetchLatestVersion(packageName: string): Promise<string | null> {
  try {
    const result = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 10000
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

async function updateAllDependencies(dryRun: boolean = true) {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  const allPackages: PackageInfo[] = [];
  
  // Collect all packages
  Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
    allPackages.push({
      name,
      current: version.toString(),
      latest: '',
      type: 'dependencies',
    });
  });
  
  Object.entries(packageJson.devDependencies || {}).forEach(([name, version]) => {
    allPackages.push({
      name,
      current: version.toString(),
      latest: '',
      type: 'devDependencies',
    });
  });
  
  console.log(`🔍 Checking ${allPackages.length} packages for updates...\n`);
  
  // Fetch latest versions
  let checked = 0;
  for (const pkg of allPackages) {
    process.stdout.write(`\r   Checking ${++checked}/${allPackages.length}: ${pkg.name}...`);
    const latest = await fetchLatestVersion(pkg.name);
    if (latest) {
      pkg.latest = latest;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('\n');
  
  // Filter packages that need updates
  const updates = allPackages.filter(pkg => {
    if (!pkg.latest) return false;
    const currentClean = pkg.current.replace(/[\^~]/, '');
    return currentClean !== pkg.latest;
  });
  
  if (updates.length === 0) {
    console.log('✅ All packages are at their latest versions!');
    return;
  }
  
  console.log(`\n📊 Found ${updates.length} package(s) to update:\n`);
  console.log('='.repeat(100));
  
  // Group by type
  const deps = updates.filter(u => u.type === 'dependencies');
  const devDeps = updates.filter(u => u.type === 'devDependencies');
  
  if (deps.length > 0) {
    console.log('\n📦 Dependencies:');
    deps.forEach(update => {
      const prefix = update.current.match(/^[\^~]/)?.[0] || '^';
      console.log(`   ${update.name.padEnd(40)} ${update.current.padEnd(15)} → ${prefix}${update.latest}`);
    });
  }
  
  if (devDeps.length > 0) {
    console.log('\n🔧 DevDependencies:');
    devDeps.forEach(update => {
      const prefix = update.current.match(/^[\^~]/)?.[0] || '^';
      console.log(`   ${update.name.padEnd(40)} ${update.current.padEnd(15)} → ${prefix}${update.latest}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 This is a dry-run. To apply updates, run:');
    console.log('   npm run update-all:apply');
  } else {
    console.log('\n🔄 Updating package.json...');
    
    updates.forEach(update => {
      const prefix = update.current.match(/^[\^~]/)?.[0] || '^';
      packageJson[update.type][update.name] = `${prefix}${update.latest}`;
    });
    
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ package.json updated!');
    console.log('\n📥 Next steps:');
    console.log('   1. Review the changes in package.json');
    console.log('   2. Run: npm install');
    console.log('   3. Test your application thoroughly');
    console.log('   4. Commit: git add package.json package-lock.json && git commit -m "Update dependencies to latest versions"');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || args.includes('-a');
  
  await updateAllDependencies(!apply);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
