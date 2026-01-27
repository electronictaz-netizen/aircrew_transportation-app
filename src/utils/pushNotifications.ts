/**
 * Push Notifications Utility
 * Handles push notification registration and management
 * Note: Requires HTTPS and user permission
 */

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  console.log('[PushNotifications] Permission:', permission);
  return permission;
}

/**
 * Check notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorkerForPush(): Promise<ServiceWorkerRegistration> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[PushNotifications] Service worker ready');
    return registration;
  } catch (error) {
    console.error('[PushNotifications] Failed to get service worker:', error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[PushNotifications] VAPID_PUBLIC_KEY not configured');
    return null;
  }

  try {
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[PushNotifications] Already subscribed');
      return existingSubscription;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('[PushNotifications] Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[PushNotifications] Failed to subscribe:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PushNotifications] Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PushNotifications] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[PushNotifications] Failed to get subscription:', error);
    return null;
  }
}

/**
 * Show local notification (when app is open)
 */
export function showLocalNotification(payload: PushNotificationPayload): void {
  if (getNotificationPermission() !== 'granted') {
    console.warn('[PushNotifications] Permission not granted for local notifications');
    return;
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    image: payload.image,
    data: payload.data,
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false,
  };

  new Notification(payload.title, options);
}

/**
 * Listen for push notifications
 */
export function setupPushNotificationListener(
  registration: ServiceWorkerRegistration,
  onNotification: (payload: PushNotificationPayload) => void
): void {
  // Listen for push events
  registration.addEventListener('push', (event) => {
    console.log('[PushNotifications] Push event received');

    let payload: PushNotificationPayload = {
      title: 'New Notification',
      body: 'You have a new notification',
    };

    if (event.data) {
      try {
        payload = event.data.json();
      } catch (error) {
        payload.body = event.data.text();
      }
    }

    // Show notification
    event.waitUntil(
      registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
      })
    );

    // Call callback
    onNotification(payload);
  });

  // Listen for notification clicks
  registration.addEventListener('notificationclick', (event) => {
    console.log('[PushNotifications] Notification clicked');

    event.notification.close();

    // Handle notification click
    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    } else {
      event.waitUntil(
        clients.matchAll().then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return clients.openWindow('/');
        })
      );
    }
  });
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
