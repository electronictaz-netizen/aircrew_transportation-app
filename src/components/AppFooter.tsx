import './AppFooter.css';

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-links">
          <a 
            href="https://tazsoftware.biz/terms-of-service.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="app-footer-link"
          >
            Terms of Service
          </a>
          <span className="app-footer-separator">•</span>
          <a 
            href="https://tazsoftware.biz/privacy-policy.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="app-footer-link"
          >
            Privacy Policy
          </a>
        </div>
        <p className="app-footer-text">
          &copy; {new Date().getFullYear()} Taz Software, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
