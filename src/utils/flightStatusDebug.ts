/**
 * Debug utility for flight status API issues
 * Use this in browser console to diagnose API problems
 */

export function debugFlightAPI() {
  const apiKey = import.meta.env.VITE_FLIGHT_API_KEY;
  const provider = import.meta.env.VITE_FLIGHT_API_PROVIDER || 'aviationstack';

  console.group('🔍 Flight API Debug Information');
  
  console.log('Provider:', provider);
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

  // Test API call
  if (apiKey && apiKey !== 'YOUR_API_KEY') {
    console.log('\n🧪 Testing API connection...');
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
  } else {
    console.warn('⚠️ Cannot test API - API key not configured');
  }

  console.groupEnd();
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugFlightAPI = debugFlightAPI;
}
