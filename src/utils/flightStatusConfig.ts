/**
 * Flight Status API Configuration
 * 
 * This file helps verify and test API configuration
 */

export interface FlightAPIConfig {
  provider: string;
  apiKey: string | undefined;
  isConfigured: boolean;
}

/**
 * Get current API configuration status
 */
export function getFlightAPIConfig(): FlightAPIConfig {
  const provider = import.meta.env.VITE_FLIGHT_API_PROVIDER || 'aviationstack';
  const apiKey = import.meta.env.VITE_FLIGHT_API_KEY;
  
  return {
    provider,
    apiKey,
    isConfigured: !!(apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.trim().length > 0),
  };
}

/**
 * Test API connection
 */
export async function testFlightAPI(): Promise<{ success: boolean; message: string; data?: any }> {
  const config = getFlightAPIConfig();
  
  if (!config.isConfigured) {
    return {
      success: false,
      message: 'API key not configured. Please set VITE_FLIGHT_API_KEY in your environment variables.',
    };
  }

  if (config.provider !== 'aviationstack') {
    return {
      success: false,
      message: `API testing currently only supported for AviationStack. Current provider: ${config.provider}`,
    };
  }

  try {
    const testFlightNumber = 'AA100'; // Test with a common flight
    const response = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${config.apiKey}&flight_iata=${testFlightNumber}&limit=1`
    );

    if (!response.ok) {
      return {
        success: false,
        message: `API request failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: `API Error: ${data.error.info || JSON.stringify(data.error)}`,
        data: data.error,
      };
    }

    return {
      success: true,
      message: 'API connection successful!',
      data: {
        flightsFound: data.data?.length || 0,
        pagination: data.pagination,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection error: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Get API usage information (if available)
 */
export function getAPIUsageInfo(): string {
  const config = getFlightAPIConfig();
  
  if (!config.isConfigured) {
    return 'API not configured';
  }

  return `Provider: ${config.provider}, API Key: ${config.apiKey?.substring(0, 8)}...`;
}
