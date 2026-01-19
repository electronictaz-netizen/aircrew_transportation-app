import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useTheme } from '../contexts/ThemeContext';
import './BrandedLogin.css';

interface BrandedLoginProps {
  children: React.ReactNode;
}

export function BrandedLogin({ children }: BrandedLoginProps) {
  const { theme } = useTheme();
  const { authStatus } = useAuthenticator();
  const [showBranding, setShowBranding] = useState(false);
  
  const companyName = import.meta.env.VITE_SERVICE_PROVIDER_NAME || 'Aircrew Transportation';
  const companyLogo = import.meta.env.VITE_SERVICE_PROVIDER_LOGO;
  const tagline = import.meta.env.VITE_SERVICE_PROVIDER_TAGLINE || 'Manage your transportation operations with ease';

  // Only show branding on login screen (when not authenticated)
  useEffect(() => {
    setShowBranding(authStatus === 'unauthenticated');
  }, [authStatus]);

  // If authenticated, just render children without branding
  if (!showBranding) {
    return <>{children}</>;
  }

  // Show branded login screen
  return (
    <div className={`branded-login-container ${theme}`}>
      <div className="branded-login-content">
        <div className="branded-login-header">
          {companyLogo && (
            <img 
              src={companyLogo} 
              alt={`${companyName} logo`}
              className="branded-login-logo"
            />
          )}
          <h1 className="branded-login-title">{companyName}</h1>
          {tagline && (
            <p className="branded-login-tagline">{tagline}</p>
          )}
        </div>
        <div className="branded-login-form">
          {children}
        </div>
        <div className="branded-login-footer">
          <p className="branded-login-footer-text">
            Secure login powered by AWS Amplify
          </p>
        </div>
      </div>
    </div>
  );
}
