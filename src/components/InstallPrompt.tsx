/**
 * Install Prompt Component
 * Shows a banner to prompt users to install the PWA on mobile devices
 */

import { useState, useEffect } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is already installed (standalone mode)');
      setIsInstalled(true);
      return;
    }

    // Check if app was previously installed
    if (localStorage.getItem('pwa-installed') === 'true') {
      console.log('[PWA] App was previously installed');
      setIsInstalled(true);
      return;
    }

    // Check if prompt was recently dismissed
    const dismissedUntil = localStorage.getItem('pwa-dismissed-until');
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        console.log('[PWA] Install prompt was dismissed, not showing again');
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom install prompt
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      console.log('[PWA] Service Worker is supported');
    } else {
      console.warn('[PWA] Service Worker is not supported');
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      console.log('[PWA] iOS detected, showing install instructions');
      // Show iOS install instructions after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Log PWA readiness
    console.log('[PWA] Install prompt component initialized');
    console.log('[PWA] User agent:', navigator.userAgent);
    console.log('[PWA] Standalone mode:', window.matchMedia('(display-mode: standalone)').matches);

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // Show iOS install instructions
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS or other browsers - show instructions
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    } else {
      console.log('User dismissed the install prompt');
      // Don't show again for this session
      setShowPrompt(false);
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem('pwa-dismissed-until', dismissUntil.toISOString());
  };

  // Check if prompt was recently dismissed
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('pwa-dismissed-until');
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Don't show if already installed
  if (isInstalled || !showPrompt) {
    return null;
  }

  // Check if iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

  if (isIOS && !isInStandaloneMode) {
    return (
      <div className="install-prompt ios-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">📱</div>
          <div className="install-prompt-text">
            <strong>Install App</strong>
            <p>Tap the share button <span className="ios-icon">⎋</span> and select "Add to Home Screen"</p>
          </div>
          <button
            className="install-prompt-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Standard PWA install prompt
  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <strong>Install App</strong>
          <p>Install this app on your device for a better experience</p>
        </div>
        <div className="install-prompt-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={handleInstallClick}
          >
            Install
          </button>
          <button
            className="install-prompt-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
