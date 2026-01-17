import { Link, useLocation } from 'react-router-dom';
import { signOutWithCacheClear } from '../utils/cacheClear';
import { useAdminAccess } from '../utils/adminAccess';
import { useCompany } from '../contexts/CompanyContext';
import { Button } from './ui/button';
import './Navigation.css';

interface NavigationProps {
  signOut: () => void;
  user: any;
}

function Navigation({ signOut, user }: NavigationProps) {
  const location = useLocation();
  const hasAdminAccess = useAdminAccess();
  const { company } = useCompany();

  const handleSignOut = async () => {
    await signOutWithCacheClear(signOut);
  };

  // Get display name - use displayName if set, otherwise use name, otherwise default
  const displayName = company?.displayName || company?.name || 'Aircrew Transportation';

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1 className="nav-title">{displayName}</h1>
          {company?.logoUrl && (
            <img 
              src={company.logoUrl} 
              alt={`${displayName} logo`} 
              className="nav-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="nav-links">
          <Link
            to="/management"
            className={location.pathname === '/management' ? 'active' : ''}
          >
            Management
          </Link>
          <Link
            to="/driver"
            className={location.pathname === '/driver' ? 'active' : ''}
          >
            Driver View
          </Link>
          {hasAdminAccess && (
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'active' : ''}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="nav-user">
          <span>{user?.signInDetails?.loginId || user?.username}</span>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="sign-out-btn">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
