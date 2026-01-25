/**
 * PWA Update Prompt Component
 * Notifies users when a new version of the app is available
 */

import { useState, useEffect, useRef } from 'react';
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
  const expectingReloadRef = useRef(false);

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

    // Only reload on controllerchange when we explicitly requested an update (user clicked Update).
    // Unconditional reload on every controllerchange caused a reload loop: reload -> load -> 
    // controllerchange (or checkForUpdates/ SW edge case) -> reload -> ...
    const onControllerChange = () => {
      if (expectingReloadRef.current) {
        expectingReloadRef.current = false;
        console.log('[PWA] Service worker controller changed - reloading page');
        window.location.reload();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

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
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        clearInterval(updateInterval);
      };
    }
  }, []);

  const handleUpdate = async () => {
    if (!updateHandler) return;

    setIsUpdating(true);
    expectingReloadRef.current = true;
    try {
      await updateHandler();
      showInfo('App updated! Reloading...');
      // controllerchange will reload when the new SW takes over; fallback if it doesn't fire
      setTimeout(() => {
        if (expectingReloadRef.current) {
          expectingReloadRef.current = false;
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('[PWA] Error updating app:', error);
      expectingReloadRef.current = false;
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
