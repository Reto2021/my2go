// Custom Service Worker for Push Notifications and Offline Support

const OFFLINE_PAGE = '/offline.html';
const CACHE_NAME = 'my2go-offline-v2';
const API_CACHE_NAME = 'my2go-api-v1';

// API endpoints to cache for offline use
const CACHEABLE_API_PATTERNS = [
  /\/rest\/v1\/rpc\/get_public_partners/,
  /\/rest\/v1\/rpc\/get_public_partners_safe/,
  /\/rest\/v1\/rpc\/get_public_rewards_safe/,
  /\/rest\/v1\/rpc\/get_public_partner_by_slug/,
  /\/rest\/v1\/rpc\/get_public_partner_safe/,
  /\/rest\/v1\/rpc\/get_partner_public_info/,
];

// Max age for API cache (1 hour in milliseconds)
const API_CACHE_MAX_AGE = 60 * 60 * 1000;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  OFFLINE_PAGE,
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.png',
];

// Helper: Check if request matches cacheable API patterns
function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Helper: Get cache key for API requests (normalize URL)
function getAPICacheKey(request) {
  const url = new URL(request.url);
  // Remove auth headers from cache key by using just the URL
  return url.pathname + url.search;
}

// Helper: Check if cached response is still fresh
function isCacheFresh(response) {
  const cachedAt = response.headers.get('x-cached-at');
  if (!cachedAt) return false;
  const age = Date.now() - parseInt(cachedAt, 10);
  return age < API_CACHE_MAX_AGE;
}

// Helper: Clone response and add cache timestamp
function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('x-cached-at', Date.now().toString());
  headers.set('x-from-cache', 'false');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Helper: Mark response as from cache
function markAsFromCache(response) {
  const headers = new Headers(response.headers);
  headers.set('x-from-cache', 'true');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Install event - precache offline assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Precaching offline assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return (cacheName.startsWith('my2go-') && 
                  cacheName !== CACHE_NAME && 
                  cacheName !== API_CACHE_NAME);
        }).map(function(cacheName) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network with offline fallback
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  const isNavigationRequest = event.request.mode === 'navigate';
  const isSameOrigin = url.origin === location.origin;
  const isSupabaseRequest = url.hostname.includes('supabase');
  
  // Handle cacheable Supabase API requests with stale-while-revalidate
  if (isSupabaseRequest && isCacheableAPI(url)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(function(cache) {
        const cacheKey = getAPICacheKey(event.request);
        
        return cache.match(cacheKey).then(function(cachedResponse) {
          // Fetch fresh data in background
          const fetchPromise = fetch(event.request.clone())
            .then(function(networkResponse) {
              if (networkResponse.ok) {
                // Clone and add timestamp before caching
                const responseToCache = addCacheTimestamp(networkResponse.clone());
                cache.put(cacheKey, responseToCache);
                console.log('[SW] Cached API response:', cacheKey);
              }
              return networkResponse;
            })
            .catch(function(error) {
              console.log('[SW] Network failed for API:', cacheKey, error);
              // If we have cached data, we already returned it
              if (cachedResponse) {
                return cachedResponse;
              }
              throw error;
            });
          
          // Return cached response immediately if available, otherwise wait for network
          if (cachedResponse) {
            console.log('[SW] Serving from API cache:', cacheKey, 'Fresh:', isCacheFresh(cachedResponse));
            // Return cached but update in background (stale-while-revalidate)
            event.waitUntil(fetchPromise);
            return markAsFromCache(cachedResponse.clone());
          }
          
          return fetchPromise;
        });
      })
    );
    return;
  }
  
  // Skip other Supabase requests (auth, mutations, etc.)
  if (isSupabaseRequest) return;
  
  // Handle navigation requests (HTML pages)
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Clone and cache successful navigation responses
          if (response.ok && isSameOrigin) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          // Offline - try to serve from cache first
          return caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, serve offline page
            return caches.match(OFFLINE_PAGE);
          });
        })
    );
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (isSameOrigin && (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico')
  )) {
    event.respondWith(
      caches.match(event.request).then(function(cachedResponse) {
        if (cachedResponse) {
          // Return cached version but also fetch fresh version in background
          event.waitUntil(
            fetch(event.request).then(function(response) {
              if (response.ok) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, response);
                });
              }
            }).catch(function() {
              // Silently fail - we have cached version
            })
          );
          return cachedResponse;
        }
        
        // Not in cache - fetch and cache
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(function() {
          // Return a placeholder for images
          if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f1f5f9" width="100" height="100"/><text fill="#94a3b8" x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          throw new Error('Network error');
        });
      })
    );
    return;
  }
});

// Push notification handler
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

// Notification click handler
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
  
  // Handle skip waiting message
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache clear message
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Background sync for offline actions (if supported)
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(
      // Sync pending actions when back online
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SYNC_PENDING_ACTIONS' });
        });
      })
    );
  }
});
