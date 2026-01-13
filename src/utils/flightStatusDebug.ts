/**
 * Debug utility for flight status API issues
 * Use this in browser console to diagnose API problems
 * Supports both single and multiple provider configurations
 */

export function debugFlightAPI() {
  console.group('🔍 Flight API Debug Information');
  
  // Check for multiple providers configuration
  const providersEnv = import.meta.env.VITE_FLIGHT_API_PROVIDERS;
  const singleProvider = import.meta.env.VITE_FLIGHT_API_PROVIDER;
  
  if (providersEnv) {
    // Multiple providers configuration
    console.log('📋 Configuration Mode: Multiple Providers');
    const providerList = providersEnv.split(',').map(p => p.trim().toLowerCase());
    console.log('Providers (in order):', providerList.join(', '));
    console.log('\n📝 Provider Status:');
    
    const providers: Array<{ name: string; key: string | undefined; configured: boolean }> = [
      { name: 'aviationstack', key: import.meta.env.VITE_FLIGHT_API_KEY_AVIATIONSTACK, configured: false },
      { name: 'flightaware', key: import.meta.env.VITE_FLIGHT_API_KEY_FLIGHTAWARE, configured: false },
      { name: 'flightradar24', key: import.meta.env.VITE_FLIGHT_API_KEY_FLIGHTRADAR24, configured: false },
    ];
    
    providers.forEach(provider => {
      const isInList = providerList.includes(provider.name);
      const hasKey = !!provider.key && provider.key !== 'YOUR_API_KEY' && provider.key.trim().length > 0;
      provider.configured = isInList && hasKey;
      
      if (isInList) {
        console.log(`  ${provider.name}:`, hasKey ? '✅ Configured' : '❌ Missing API Key');
        if (hasKey) {
          console.log(`    Key Preview: ${provider.key!.substring(0, 8)}...`);
        } else {
          console.log(`    Set VITE_FLIGHT_API_KEY_${provider.name.toUpperCase()}`);
        }
      } else {
        console.log(`  ${provider.name}: ⚪ Not in provider list`);
      }
    });
    
    const configuredCount = providers.filter(p => p.configured).length;
    console.log(`\n✅ ${configuredCount} of ${providerList.length} provider(s) configured`);
    
    if (configuredCount === 0) {
      console.warn('\n⚠️ No providers are fully configured!');
      console.log('To fix: Set the appropriate VITE_FLIGHT_API_KEY_* environment variables');
    }
    
  } else {
    // Single provider configuration (legacy)
    console.log('📋 Configuration Mode: Single Provider (Legacy)');
    const provider = singleProvider || 'aviationstack';
    console.log('Provider:', provider);
    
    const apiKey = import.meta.env.VITE_FLIGHT_API_KEY;
    console.log('API Key Configured:', apiKey ? '✅ Yes' : '❌ No');
    
    if (apiKey) {
      console.log('API Key Preview:', apiKey.substring(0, 8) + '...');
      console.log('API Key Length:', apiKey.length);
      console.log('API Key Contains Spaces:', apiKey.includes(' '));
      console.log('API Key is Default Value:', apiKey === 'YOUR_API_KEY');
    } else {
      console.warn('⚠️ API key is not set!');
      console.log('To fix: Add VITE_FLIGHT_API_KEY to your .env file or AWS Amplify environment variables');
    }
    
    // Test API call for single provider
    if (apiKey && apiKey !== 'YOUR_API_KEY' && provider === 'aviationstack') {
      console.log('\n🧪 Testing AviationStack API connection...');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const testUrl = `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=AA100&flight_date=${today}&limit=1`;
      
      fetch(testUrl)
        .then(async (response) => {
          console.log('Response Status:', response.status, response.statusText);
          
          if (response.status === 401) {
            console.error('❌ 401 Unauthorized - API key is invalid or expired');
            console.log('Check:');
            console.log('1. API key is correct in AviationStack dashboard');
            console.log('2. API key has not expired');
            console.log('3. API key has proper permissions');
          } else if (response.status === 429) {
            console.warn('⚠️ 429 Too Many Requests - API quota exceeded');
          } else if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
          } else {
            const data = await response.json();
            if (data.error) {
              console.error('❌ API Error Response:', data.error);
            } else {
              console.log('✅ API connection successful!');
              console.log('Response:', data);
            }
          }
        })
        .catch((error) => {
          console.error('❌ Network Error:', error);
        });
    } else if (apiKey && apiKey !== 'YOUR_API_KEY') {
      console.log(`\n⚠️ API testing not available for provider: ${provider}`);
      console.log('Manual testing recommended');
    } else {
      console.warn('\n⚠️ Cannot test API - API key not configured');
    }
  }
  
  console.log('\n💡 Tip: To use multiple providers, set:');
  console.log('  VITE_FLIGHT_API_PROVIDERS=aviationstack,flightaware,flightradar24');
  console.log('  VITE_FLIGHT_API_KEY_AVIATIONSTACK=your_key_here');
  console.log('  VITE_FLIGHT_API_KEY_FLIGHTAWARE=your_key_here');
  console.log('  VITE_FLIGHT_API_KEY_FLIGHTRADAR24=your_key_here');
  
  console.groupEnd();
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugFlightAPI = debugFlightAPI;
}
