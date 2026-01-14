/**
 * Quick Auth Check Script
 * Run this in your browser console to check if you're logged in
 */

(function checkAuth() {
  console.log('🔍 Checking authentication status...\n');
  
  // Check localStorage access
  try {
    const allKeys = Object.keys(localStorage);
    console.log('✅ localStorage is accessible');
    console.log(`   Total keys in localStorage: ${allKeys.length}`);
    
    // Find Cognito keys
    const cognitoKeys = allKeys.filter(k => k.includes('Cognito'));
    console.log(`\n📋 Cognito-related keys: ${cognitoKeys.length}`);
    
    if (cognitoKeys.length > 0) {
      console.log('   Keys found:');
      cognitoKeys.forEach(key => {
        const value = localStorage.getItem(key);
        const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
        console.log(`   - ${key}: ${preview}`);
      });
      
      // Try to find idToken
      const idTokenKeys = cognitoKeys.filter(k => k.includes('idToken'));
      if (idTokenKeys.length > 0) {
        console.log(`\n✅ Found ${idTokenKeys.length} idToken key(s)`);
        idTokenKeys.forEach(key => {
          const token = localStorage.getItem(key);
          if (token) {
            try {
              const parsed = JSON.parse(token);
              console.log(`   - ${key}: Token found (${typeof parsed === 'string' ? parsed.length : JSON.stringify(parsed).length} chars)`);
            } catch (e) {
              console.log(`   - ${key}: Token found (${token.length} chars, raw string)`);
            }
          }
        });
      } else {
        console.log('\n⚠️  No idToken keys found');
      }
    } else {
      console.log('❌ No Cognito keys found in localStorage');
      console.log('   This means you are NOT logged in.');
      console.log('   Please log in to the app first, then run the migration script.');
    }
    
    // Check sessionStorage too
    const sessionKeys = Object.keys(sessionStorage);
    console.log(`\n📋 sessionStorage keys: ${sessionKeys.length}`);
    if (sessionKeys.length > 0) {
      const sessionCognito = sessionKeys.filter(k => k.includes('Cognito'));
      if (sessionCognito.length > 0) {
        console.log(`   Found ${sessionCognito.length} Cognito keys in sessionStorage`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error accessing localStorage:', error);
    console.error('   This might mean localStorage is blocked or unavailable.');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log('If you see Cognito keys above, you are logged in.');
  console.log('If you see 0 Cognito keys, please log in first.');
  console.log('='.repeat(50));
})();
