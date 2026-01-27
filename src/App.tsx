import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import Navigation from './components/Navigation';
import { getDefaultRoute } from './utils/rolePermissions';
import InstallPrompt from './components/InstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from './components/ui/toaster';
import { BrandedLoginHeader, BrandedLoginFooter } from './components/BrandedLogin';
import { AppFooter } from './components/AppFooter';

// Lazy load route components for code splitting
const ManagementDashboard = lazy(() => import('./components/ManagementDashboard'));
const DriverDashboard = lazy(() => import('./components/DriverDashboard'));
const DriverManagement = lazy(() => import('./components/DriverManagement'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const BookingPortal = lazy(() => import('./components/BookingPortal'));
const CustomerPortalWrapper = lazy(() => import('./components/CustomerPortalWrapper'));

import { PageSkeleton } from './components/ui/skeleton-loaders';
import { SkipLinks } from './components/SkipLinks';
import { ThemeProvider } from './contexts/ThemeContext';

// Loading component for Suspense fallback
const LoadingFallback = () => <PageSkeleton />;

// Default redirect component that uses role to determine route
function DefaultRedirect() {
  const { userRole, loading } = useCompany();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  const defaultRoute = getDefaultRoute(userRole);
  return <Navigate to={defaultRoute} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public booking portal routes - no authentication required */}
          <Route path="/booking/:code" element={<BookingPortal />} />
          <Route path="/booking" element={<BookingPortal />} />
          
          {/* Public customer portal routes - no authentication required */}
          <Route path="/portal/:code" element={<CustomerPortalWrapper />} />
          <Route path="/portal" element={<CustomerPortalWrapper />} />
          
          {/* Authenticated routes */}
          <Route
            path="/*"
            element={
              <Authenticator
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
                          <Route path="/" element={<DefaultRedirect />} />
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
                      <AppFooter />
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
