import { useTheme } from '../contexts/ThemeContext';
import './BrandedLogin.css';

export function BrandedLoginHeader() {
  const { theme } = useTheme();
  const companyName = import.meta.env.VITE_SERVICE_PROVIDER_NAME || 'Aircrew Transportation';
  const companyLogo = import.meta.env.VITE_SERVICE_PROVIDER_LOGO;
  const tagline = import.meta.env.VITE_SERVICE_PROVIDER_TAGLINE || 'Manage your transportation operations with ease';

  return (
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
  );
}

export function BrandedLoginFooter() {
  return (
    <div className="branded-login-footer">
      <p className="branded-login-footer-text">
        Secure login powered by AWS Amplify
      </p>
    </div>
  );
}

interface BrandedLoginWrapperProps {
  children: React.ReactNode;
}

export function BrandedLoginWrapper({ children }: BrandedLoginWrapperProps) {
  const { theme } = useTheme();

  return (
    <div className={`branded-login-container ${theme}`}>
      <div className="branded-login-content">
        {children}
      </div>
    </div>
  );
}
