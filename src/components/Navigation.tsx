import { Link, useLocation } from 'react-router-dom';
import { signOutWithCacheClear } from '../utils/cacheClear';
import { useAdminAccess } from '../utils/adminAccess';
import { useCompany } from '../contexts/CompanyContext';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
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
    <nav className="navigation" id="navigation" aria-label="Main navigation">
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
        <div className="nav-links" role="menubar">
          <Link
            to="/management"
            className={location.pathname === '/management' ? 'active' : ''}
            role="menuitem"
            aria-current={location.pathname === '/management' ? 'page' : undefined}
          >
            Management
          </Link>
          <Link
            to="/driver"
            className={location.pathname === '/driver' ? 'active' : ''}
            role="menuitem"
            aria-current={location.pathname === '/driver' ? 'page' : undefined}
          >
            Driver View
          </Link>
          {hasAdminAccess && (
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'active' : ''}
              role="menuitem"
              aria-current={location.pathname === '/admin' ? 'page' : undefined}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="nav-user" aria-label="User menu">
          <span aria-label="Current user">{user?.signInDetails?.loginId || user?.username}</span>
          <ThemeToggle />
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm" 
            className="sign-out-btn"
            aria-label="Sign out"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
