/**
 * Create PWA Icons - Simple Node.js script
 * Run: node scripts/create-icons.js
 * 
 * This creates simple placeholder icons using the 'sharp' package
 * If sharp is not installed, it will provide instructions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (error) {
  console.log('⚠️  Sharp package not found.');
  console.log('');
  console.log('📦 Installing sharp...');
  console.log('   Run: npm install --save-dev sharp');
  console.log('');
  console.log('📱 OR use the browser-based generator:');
  console.log('   1. Open: public/create-icons.html');
  console.log('   2. Click "Download All Icons"');
  console.log('   3. Place files in public/ folder');
  console.log('');
  process.exit(1);
}

// Create icon function
async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <rect x="0" y="0" width="${size}" height="${size}" fill="none" stroke="#1e40af" stroke-width="${Math.max(2, size * 0.02)}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.35)}" 
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">AT</text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(publicDir, filename));
    
    console.log(`✅ Created ${filename} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🎨 Creating PWA icons...\n');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 Created public directory\n');
  }

  const icons = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' }
  ];

  let successCount = 0;
  for (const icon of icons) {
    const success = await createIcon(icon.size, icon.name);
    if (success) successCount++;
  }

  console.log('');
  if (successCount === icons.length) {
    console.log('🎉 All icons created successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. git add public/*.png');
    console.log('   2. git commit -m "Add PWA icons"');
    console.log('   3. git push origin main');
  } else {
    console.log(`⚠️  Created ${successCount} of ${icons.length} icons`);
  }
}

main().catch(console.error);
