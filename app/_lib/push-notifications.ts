'use client';

/**
 * Web Push notification helpers
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

export async function subscribeToPush(
  userId: string,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();

  if (!registration) {
    console.error('No service worker registration');
    return null;
  }

  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Convert VAPID key from base64 to Uint8Array
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    console.log('Push subscription:', subscription);

    // Send subscription to server
    const subscriptionJSON = subscription.toJSON();

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      }),
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return false;
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  try {
    await subscription.unsubscribe();
    console.log('Unsubscribed from push');
    return true;
  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return false;
  }
}

export async function checkPushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    return null;
  }

  return await registration.pushManager.getSubscription();
}

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Show local notification (for testing)
export async function showNotification(title: string, body: string) {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    console.error('No service worker registration');
    return;
  }

  await registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  });
}
