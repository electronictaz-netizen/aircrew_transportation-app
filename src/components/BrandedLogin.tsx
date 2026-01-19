import './BrandedLogin.css';

export function BrandedLoginHeader() {
  return (
    <div className="branded-login-header">
      <h1 className="branded-login-title">Onyx Transportation App</h1>
      <p className="branded-login-tagline">Manage your transportation operations with ease</p>
    </div>
  );
}

export function BrandedLoginFooter() {
  const serviceProviderName = import.meta.env.VITE_SERVICE_PROVIDER_NAME || 'Taz Software, LLC';
  const serviceProviderTagline = import.meta.env.VITE_SERVICE_PROVIDER_TAGLINE;
  const serviceProviderLogo = import.meta.env.VITE_SERVICE_PROVIDER_LOGO;

  return (
    <div className="branded-login-footer">
      {serviceProviderLogo && (
        <img 
          src={serviceProviderLogo} 
          alt={`${serviceProviderName} logo`}
          className="branded-login-footer-logo"
        />
      )}
      <div className="branded-login-footer-content">
        <p className="branded-login-footer-provider">{serviceProviderName}</p>
        {serviceProviderTagline && (
          <p className="branded-login-footer-tagline">{serviceProviderTagline}</p>
        )}
        <p className="branded-login-footer-text">
          Secure login powered by AWS Amplify
        </p>
        <div className="branded-login-footer-legal">
          <a 
            href="https://tazsoftware.biz/terms-of-service.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="branded-login-footer-link"
          >
            Terms of Service
          </a>
          <span className="branded-login-footer-separator">•</span>
          <a 
            href="https://tazsoftware.biz/privacy-policy.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="branded-login-footer-link"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

