import { Link, useLocation } from 'react-router-dom';
import { signOutWithCacheClear } from '../utils/cacheClear';
import { useCompany } from '../contexts/CompanyContext';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react';
import './Navigation.css';

const client = generateClient<Schema>();

interface NavigationProps {
  signOut: () => void;
  user: any;
}

function Navigation({ signOut, user }: NavigationProps) {
  const location = useLocation();
  const { company } = useCompany();
  const { user: authUser } = useAuthenticator();
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'driver' | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!authUser?.userId || !company) return;

      try {
        const { data: companyUsers } = await client.models.CompanyUser.list({
          filter: {
            userId: { eq: authUser.userId },
            companyId: { eq: company.id },
          },
        });

        if (companyUsers && companyUsers.length > 0) {
          setUserRole(companyUsers[0].role || 'driver');
        }

        // Check if user is a super admin (has admin role in any company)
        const { data: allCompanyUsers } = await client.models.CompanyUser.list({
          filter: {
            userId: { eq: authUser.userId },
            role: { eq: 'admin' },
          },
        });

        if (allCompanyUsers && allCompanyUsers.length > 0) {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, [authUser, company]);

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
          {(isSuperAdmin || userRole === 'admin') && (
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
