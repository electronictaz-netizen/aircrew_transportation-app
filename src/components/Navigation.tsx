import { Link, useLocation } from 'react-router-dom';
import { signOutWithCacheClear } from '../utils/cacheClear';
import { useAdminAccess } from '../utils/adminAccess';
import './Navigation.css';

interface NavigationProps {
  signOut: () => void;
  user: any;
}

function Navigation({ signOut, user }: NavigationProps) {
  const location = useLocation();
  const hasAdminAccess = useAdminAccess();

  const handleSignOut = async () => {
    await signOutWithCacheClear(signOut);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">Aircrew Transportation</h1>
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
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
