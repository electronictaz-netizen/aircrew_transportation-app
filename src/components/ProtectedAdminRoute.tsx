import { Navigate } from 'react-router-dom';
import { useAdminAccess } from '../utils/adminAccess';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component that enforces admin access
 * Use this to wrap admin routes for additional security
 */
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const hasAccess = useAdminAccess();

  if (!hasAccess) {
    console.warn('[ProtectedAdminRoute] Unauthorized access attempt - redirecting');
    return <Navigate to="/management" replace />;
  }

  return <>{children}</>;
}
