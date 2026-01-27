/**
 * Push Notification Setup Component
 * Handles push notification registration and permission requests
 */

import { useState, useEffect } from 'react';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  registerServiceWorkerForPush,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  setupPushNotificationListener,
} from '../utils/pushNotifications';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import './PushNotificationSetup.css';

interface PushNotificationSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribed?: (subscription: PushSubscription) => void;
}

export default function PushNotificationSetup({
  open,
  onOpenChange,
  onSubscribed,
}: PushNotificationSetupProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      checkSupport();
    }
  }, [open]);

  const checkSupport = async () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      try {
        const registration = await registerServiceWorkerForPush();
        const subscription = await getPushSubscription(registration);
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    }
  };

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        await handleSubscribe();
      } else if (newPermission === 'denied') {
        setError('Notification permission was denied. Please enable it in your browser settings.');
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to request permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const registration = await registerServiceWorkerForPush();
      const subscription = await subscribeToPushNotifications(registration);

      if (subscription) {
        setIsSubscribed(true);

        // Setup listener for push events
        setupPushNotificationListener(registration, (payload) => {
          console.log('[PushNotifications] Notification received:', payload);
        });

        if (onSubscribed) {
          onSubscribed(subscription);
        }
      }
    } catch (err) {
      console.error('Error subscribing to push:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe to push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const registration = await registerServiceWorkerForPush();
      await unsubscribeFromPushNotifications(registration);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push Notifications Not Supported</DialogTitle>
            <DialogDescription>
              Push notifications are not supported in this browser or require HTTPS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push Notifications</DialogTitle>
          <DialogDescription>
            Enable push notifications to receive real-time updates about trips, assignments, and important events.
          </DialogDescription>
        </DialogHeader>

        <div className="push-notification-setup">
          {error && (
            <div className="push-notification-error">
              <p>{error}</p>
            </div>
          )}

          <div className="push-notification-status">
            <div className="status-item">
              <strong>Permission:</strong>
              <span className={`status-badge ${permission}`}>
                {permission === 'granted' ? '✓ Granted' : permission === 'denied' ? '✗ Denied' : '? Not Set'}
              </span>
            </div>
            <div className="status-item">
              <strong>Subscription:</strong>
              <span className={`status-badge ${isSubscribed ? 'subscribed' : 'not-subscribed'}`}>
                {isSubscribed ? '✓ Subscribed' : '✗ Not Subscribed'}
              </span>
            </div>
          </div>

          <div className="push-notification-actions">
            {permission !== 'granted' ? (
              <Button onClick={handleRequestPermission} disabled={isLoading}>
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </Button>
            ) : isSubscribed ? (
              <Button onClick={handleUnsubscribe} variant="outline" disabled={isLoading}>
                {isLoading ? 'Unsubscribing...' : 'Disable Notifications'}
              </Button>
            ) : (
              <Button onClick={handleSubscribe} disabled={isLoading}>
                {isLoading ? 'Subscribing...' : 'Subscribe to Notifications'}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
