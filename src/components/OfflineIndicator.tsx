/**
 * Offline Indicator Component
 * Shows when the app is offline and provides feedback to users
 */

import { useState, useEffect } from 'react';
import './OfflineIndicator.css';

function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] App is back online');
      setIsOffline(false);
      if (wasOffline) {
        // Show a brief message that we're back online
        setTimeout(() => {
          setWasOffline(false);
        }, 2000);
      }
    };

    const handleOffline = () => {
      console.log('[PWA] App is offline');
      setIsOffline(true);
      setWasOffline(true);
    };

    // Set initial state
    setIsOffline(!navigator.onLine);
    setWasOffline(!navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!isOffline && !wasOffline) {
    return null;
  }

  return (
    <div 
      className={`offline-indicator ${isOffline ? 'offline' : 'online'}`}
      role="status"
      aria-live="polite"
      aria-label={isOffline ? 'App is offline' : 'App is back online'}
    >
      <div className="offline-indicator-content">
        <span className="offline-indicator-icon">
          {isOffline ? '📡' : '✅'}
        </span>
        <span className="offline-indicator-text">
          {isOffline 
            ? 'You are offline. Some features may be limited.' 
            : 'Back online! All features are available.'}
        </span>
      </div>
    </div>
  );
}

export default OfflineIndicator;
