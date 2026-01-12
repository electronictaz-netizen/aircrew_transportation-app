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

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
