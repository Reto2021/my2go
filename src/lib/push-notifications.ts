import { supabase } from '@/integrations/supabase/client';

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
    if (error) throw error;
    return data?.publicKey || null;
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return null;
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  return await Notification.requestPermission();
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.error('Could not get VAPID public key');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    // Send subscription to server
    const { error } = await supabase.functions.invoke('push-subscribe', {
      body: {
        action: 'subscribe',
        subscription: subscription.toJSON(),
      },
    });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    console.log('Push subscription successful');
    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No subscription to unsubscribe');
      return true;
    }

    // Notify server
    await supabase.functions.invoke('push-subscribe', {
      body: {
        action: 'unsubscribe',
        subscription: subscription.toJSON(),
      },
    });

    // Unsubscribe locally
    await subscription.unsubscribe();

    console.log('Push unsubscription successful');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

export async function getPushSubscriptionStatus(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    console.error('Error checking push status:', error);
    return false;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}
