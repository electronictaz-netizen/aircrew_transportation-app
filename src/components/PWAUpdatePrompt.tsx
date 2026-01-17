/**
 * PWA Update Prompt Component
 * Notifies users when a new version of the app is available
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { showInfo } from '../utils/toast';
import './PWAUpdatePrompt.css';

interface UpdateSWEvent extends Event {
  detail: {
    update: () => Promise<void>;
    skipWaiting: () => Promise<void>;
  };
}

function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateHandler, setUpdateHandler] = useState<(() => Promise<void>) | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker update events from vite-plugin-pwa
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as UpdateSWEvent;
      if (customEvent.detail?.update) {
        console.log('[PWA] Update available');
        setUpdateAvailable(true);
        setUpdateHandler(() => customEvent.detail.update);
      }
    };

    // Listen for the update event (vite-plugin-pwa uses custom event)
    window.addEventListener('vite:pwa-update', handleUpdateAvailable as EventListener);

    // Also check for service worker updates manually
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed - reloading page');
        window.location.reload();
      });

      // Check for updates periodically
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        } catch (error) {
          console.error('[PWA] Error checking for updates:', error);
        }
      };

      // Check for updates on load
      checkForUpdates();

      // Check for updates every 30 minutes
      const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

      return () => {
        window.removeEventListener('vite:pwa-update', handleUpdateAvailable);
        clearInterval(updateInterval);
      };
    }
  }, []);

  const handleUpdate = async () => {
    if (!updateHandler) return;

    setIsUpdating(true);
    try {
      await updateHandler();
      showInfo('App updated! Reloading...');
      // The service worker controller change event will trigger a reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('[PWA] Error updating app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Show again after 1 hour
    setTimeout(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update();
          }
        });
      }
    }, 60 * 60 * 1000);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="pwa-update-prompt" role="alert" aria-live="polite">
      <div className="pwa-update-prompt-content">
        <div className="pwa-update-prompt-icon">🔄</div>
        <div className="pwa-update-prompt-text">
          <strong>Update Available</strong>
          <p>A new version of the app is available. Update now to get the latest features and improvements.</p>
        </div>
        <div className="pwa-update-prompt-actions">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            className="pwa-update-btn"
          >
            {isUpdating ? 'Updating...' : 'Update Now'}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="pwa-update-dismiss-btn"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PWAUpdatePrompt;
