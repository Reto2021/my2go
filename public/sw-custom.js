// Custom Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.log('[SW] Push data is not JSON:', event.data.text());
    data = {
      title: 'Neue Benachrichtigung',
      body: event.data.text(),
    };
  }
  
  const title = data.title || '2Go Taler Hub';
  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if app is already open
      for (const client of clientList) {
        if ('focus' in client) {
          // Send message to the client to handle the notification action
          if (data.type === 'review-request' && data.redemptionId && data.partnerId) {
            client.postMessage({
              type: 'REVIEW_REQUEST_CLICKED',
              redemptionId: data.redemptionId,
              partnerId: data.partnerId,
            });
          }
          return client.focus();
        }
      }
      
      // If no window is open, open one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from the main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
});
