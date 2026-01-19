import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider } from './contexts/CompanyContext';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from './components/ui/toaster';
import { BrandedLoginHeader, BrandedLoginFooter } from './components/BrandedLogin';

// Lazy load route components for code splitting
const ManagementDashboard = lazy(() => import('./components/ManagementDashboard'));
const DriverDashboard = lazy(() => import('./components/DriverDashboard'));
const DriverManagement = lazy(() => import('./components/DriverManagement'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

import { PageSkeleton } from './components/ui/skeleton-loaders';
import { SkipLinks } from './components/SkipLinks';
import { ThemeProvider } from './contexts/ThemeContext';

// Loading component for Suspense fallback
const LoadingFallback = () => <PageSkeleton />;

function App() {
  // Check for signup parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const isSignup = urlParams.get('signup') === 'true';

  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Authenticated routes */}
          <Route
            path="/*"
            element={
              <Authenticator
                initialSignIn={isSignup ? 'signUp' : 'signIn'}
                components={{
                  Header() {
                    return <BrandedLoginHeader />;
                  },
                  Footer() {
                    return <BrandedLoginFooter />;
                  },
                }}
              >
                {({ signOut, user }) => (
                  <CompanyProvider>
                    <div className="app">
                      <SkipLinks />
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
                      <PWAUpdatePrompt />
                      <OfflineIndicator />
                      <Toaster />
                    </div>
                  </CompanyProvider>
                )}
              </Authenticator>
            }
          />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
