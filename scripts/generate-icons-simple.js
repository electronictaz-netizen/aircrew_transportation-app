/**
 * Simple script to create placeholder icons using Node.js
 * Run: node scripts/generate-icons-simple.js
 * 
 * Note: This requires sharp or canvas package. For a simpler solution,
 * use the create-icons.html file in the browser.
 */

const fs = require('fs');
const path = require('path');

console.log('⚠️  This script requires additional packages.');
console.log('📱 EASIER: Open public/create-icons.html in your browser instead!');
console.log('');
console.log('To use this script, install sharp:');
console.log('  npm install --save-dev sharp');
console.log('');
console.log('Or use the HTML generator: public/create-icons.html');

// If sharp is available, use it
try {
  const sharp = require('sharp');
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Create a simple blue square with "AT" text
  const createIcon = async (size, filename) => {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#3b82f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" 
              font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">AT</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(publicDir, filename));
    
    console.log(`✓ Created ${filename}`);
  };
  
  (async () => {
    await createIcon(192, 'icon-192x192.png');
    await createIcon(512, 'icon-512x512.png');
    await createIcon(180, 'apple-touch-icon.png');
    console.log('\n✅ All icons created!');
  })();
} catch (error) {
  console.log('Sharp not available. Use the HTML generator instead.');
  console.log('See: public/create-icons.html');
}
