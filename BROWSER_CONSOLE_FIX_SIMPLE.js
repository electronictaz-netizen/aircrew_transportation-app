/**
 * SIMPLE Browser Console Fix
 * 
 * Copy and paste this into your browser console (F12 → Console tab)
 * 
 * This uses the app's existing Amplify configuration
 */

// Wait for the page to fully load, then run
setTimeout(async () => {
  try {
    console.log('🔍 Checking Amplify configuration...');
    
    // The app already has Amplify configured
    // We can access it through the window object if exposed, or use a different approach
    
    // Method: Use the app's React context or access via global
    // Since we can't easily access the React context, let's check what's available
    
    console.log('Available window objects:', Object.keys(window).filter(k => 
      k.toLowerCase().includes('amplify') || 
      k.toLowerCase().includes('aws') ||
      k === '__REACT_DEVTOOLS_GLOBAL_HOOK__'
    ));
    
    // Check if we can access the client through the app
    // The app uses: import { generateClient } from 'aws-amplify/data'
    // But we can't import in console, so we need another way
    
    console.log('⚠️  Since we cannot import modules in the console,');
    console.log('   please check the browser console for errors from CompanyContext.');
    console.log('');
    console.log('Look for these messages:');
    console.log('  - "Error ensuring default company"');
    console.log('  - "Company creation errors"');
    console.log('  - "CompanyUser creation errors"');
    console.log('');
    console.log('Share those specific error messages and we can fix them.');
    
    // Alternative: Check if amplify_outputs.json has real values
    const outputsCheck = await fetch('/amplify_outputs.json')
      .then(r => r.json())
      .catch(e => null);
    
    if (outputsCheck) {
      console.log('amplify_outputs.json:', outputsCheck);
      if (outputsCheck.data?.url === 'PLACEHOLDER' || outputsCheck.data?.api_key === 'PLACEHOLDER') {
        console.error('❌ amplify_outputs.json still has PLACEHOLDER values!');
        console.error('   The backend may not be fully deployed.');
        console.error('   Wait for CI/CD to complete, or check your deployment.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}, 1000);
