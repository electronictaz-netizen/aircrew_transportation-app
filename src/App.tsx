import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider } from './contexts/CompanyContext';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';

// Lazy load route components for code splitting
const ManagementDashboard = lazy(() => import('./components/ManagementDashboard'));
const DriverDashboard = lazy(() => import('./components/DriverDashboard'));
const DriverManagement = lazy(() => import('./components/DriverManagement'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.125rem',
    color: '#6b7280'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <CompanyProvider>
          <div className="app">
            <Navigation signOut={signOut || (() => {})} user={user} />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/management" replace />} />
                <Route path="/management" element={<ManagementDashboard />} />
                <Route path="/drivers" element={<DriverManagement />} />
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
            </Suspense>
            <InstallPrompt />
          </div>
        </CompanyProvider>
      )}
    </Authenticator>
  );
}

export default App;
