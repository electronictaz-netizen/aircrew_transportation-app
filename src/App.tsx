import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ManagementDashboard from './components/ManagementDashboard';
import DriverDashboard from './components/DriverDashboard';
import Navigation from './components/Navigation';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app">
          <Navigation signOut={signOut || (() => {})} user={user} />
          <Routes>
            <Route path="/" element={<Navigate to="/management" replace />} />
            <Route path="/management" element={<ManagementDashboard />} />
            <Route path="/driver" element={<DriverDashboard />} />
          </Routes>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
