/**
 * Skip Links for keyboard navigation accessibility
 * Allows users to skip to main content areas using keyboard
 */

import './SkipLinks.css';

export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
    </div>
  );
}
