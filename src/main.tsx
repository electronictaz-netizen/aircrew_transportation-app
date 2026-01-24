import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import outputs from '../amplify_outputs.json';
// Import debug utilities (available in console)
import './utils/flightStatusDebug';
import './utils/recurringTripsDebug';
import './utils/deleteAllTrips';

// Explicitly configure Amplify with the correct GraphQL endpoint
// There are two AppSync APIs:
// 1. klp7rzjva5c2bef2zjaygpod44 - Cognito User Pools (for frontend) ✅
// 2. ucwy5mmmyrh2rjz6hhkolzwnke - API_KEY (for Lambda) ❌
// Force the frontend to use the correct API
const config = {
  ...outputs,
  data: {
    ...outputs.data,
    // Explicitly set the correct GraphQL endpoint
    url: 'https://klp7rzjva5c2bef2zjaygpod44.appsync-api.us-east-1.amazonaws.com/graphql',
    api_key: null, // Use Cognito User Pools, not API_KEY
  },
};

Amplify.configure(config);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
