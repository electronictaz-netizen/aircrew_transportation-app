import { useState } from 'react';
import { getFlightAPIConfig, testFlightAPI } from '../utils/flightStatusConfig';
import './APIConfigTest.css';

/**
 * Component to test and verify Flight API configuration
 * This can be added to the Management Dashboard for testing
 */
function APIConfigTest() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const config = getFlightAPIConfig();

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    const result = await testFlightAPI();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="api-config-test">
      <h3>Flight Status API Configuration</h3>
      
      <div className="config-status">
        <div className="status-item">
          <span className="label">Provider:</span>
          <span className="value">{config.provider}</span>
        </div>
        <div className="status-item">
          <span className="label">API Key Configured:</span>
          <span className={`value ${config.isConfigured ? 'configured' : 'not-configured'}`}>
            {config.isConfigured ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        {config.apiKey && (
          <div className="status-item">
            <span className="label">API Key Preview:</span>
            <span className="value">{config.apiKey.substring(0, 8)}...</span>
          </div>
        )}
      </div>

      {!config.isConfigured && (
        <div className="config-warning">
          <p><strong>⚠️ API Key Not Configured</strong></p>
          <p>To enable flight status tracking:</p>
          <ol>
            <li>Get an API key from <a href="https://aviationstack.com/" target="_blank" rel="noopener noreferrer">AviationStack</a></li>
            <li>Add <code>VITE_FLIGHT_API_KEY=your_key</code> to your <code>.env</code> file</li>
            <li>Restart your development server</li>
            <li>For production, add it in AWS Amplify Console → Environment Variables</li>
          </ol>
          <p>See <code>AVIATIONSTACK_SETUP.md</code> for detailed instructions.</p>
        </div>
      )}

      <button 
        className="btn btn-primary" 
        onClick={handleTest}
        disabled={testing || !config.isConfigured}
      >
        {testing ? 'Testing...' : 'Test API Connection'}
      </button>

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          <p><strong>{testResult.success ? '✅ Success' : '❌ Error'}</strong></p>
          <p>{testResult.message}</p>
          {testResult.data && (
            <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default APIConfigTest;
