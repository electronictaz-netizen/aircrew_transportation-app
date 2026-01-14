import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider } from './contexts/CompanyContext';
import ManagementDashboard from './components/ManagementDashboard';
import DriverDashboard from './components/DriverDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <CompanyProvider>
          <div className="app">
            <Navigation signOut={signOut || (() => {})} user={user} />
            <Routes>
              <Route path="/" element={<Navigate to="/management" replace />} />
              <Route path="/management" element={<ManagementDashboard />} />
              <Route path="/driver" element={<DriverDashboard />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                } 
              />
            </Routes>
            <InstallPrompt />
          </div>
        </CompanyProvider>
      )}
    </Authenticator>
  );
}

export default App;
