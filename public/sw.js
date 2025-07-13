// Service Worker for Online Tutoring Platform
// Version: 1.0.0

const CACHE_NAME = 'tutor-platform-v1';
const STATIC_CACHE = 'tutor-static-v1';
const DYNAMIC_CACHE = 'tutor-dynamic-v1';
const API_CACHE = 'tutor-api-v1';
const OFFLINE_PAGE = '/offline';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/_next/static/css/app/globals.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/tutors',
  '/api/sessions',
  '/api/subjects'
];

// Maximum cache size limits
const CACHE_LIMITS = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 100,
  [API_CACHE]: 200
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 5 * 60 * 1000               // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-booking':
      event.waitUntil(syncBookings());
      break;
    case 'sync-messages':
      event.waitUntil(syncMessages());
      break;
    case 'sync-assignments':
      event.waitUntil(syncAssignments());
      break;
    case 'sync-progress':
      event.waitUntil(syncProgress());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Tutor Platform',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'general',
    requireInteraction: false,
    actions: []
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
      
      // Add actions based on notification type
      switch (data.type) {
        case 'session_reminder':
          notificationData.actions = [
            { action: 'join', title: 'Join Session' },
            { action: 'dismiss', title: 'Dismiss' }
          ];
          break;
        case 'new_message':
          notificationData.actions = [
            { action: 'reply', title: 'Reply' },
            { action: 'view', title: 'View' }
          ];
          break;
        case 'assignment_due':
          notificationData.actions = [
            { action: 'submit', title: 'Submit' },
            { action: 'remind_later', title: 'Remind Later' }
          ];
          break;
      }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let url = '/dashboard';
  
  // Determine URL based on notification type and action
  if (data.type === 'session_reminder' && action === 'join') {
    url = `/classroom/${data.sessionId}`;
  } else if (data.type === 'new_message') {
    url = action === 'reply' ? `/messages/${data.conversationId}` : '/messages';
  } else if (data.type === 'assignment_due') {
    url = `/assignments/${data.assignmentId}`;
  } else if (data.url) {
    url = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'SYNC_DATA':
      registerBackgroundSync(payload.tag);
      break;
  }
});

// Caching strategy functions

// Cache First - for static assets
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRY.STATIC)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(STATIC_CACHE, CACHE_LIMITS[STATIC_CACHE]);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    const cache = await caches.open(STATIC_CACHE);
    return cache.match(request) || new Response('Asset not available offline');
  }
}

// Network First with fallback - for API requests
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();
      
      // Add timestamp for expiry checking
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      await limitCacheSize(API_CACHE, CACHE_LIMITS[API_CACHE]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API request');
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRY.API)) {
      // Add offline indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-offline', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'This data is not available offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - for navigation requests
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]);
      }
      return response;
    }).catch(() => null);
    
    // Return cached version immediately if available
    if (cachedResponse) {
      networkPromise; // Update cache in background
      return cachedResponse;
    }
    
    // Wait for network if no cache
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
    
    // Fallback to offline page
    return caches.match(OFFLINE_PAGE) || new Response('Offline');
  } catch (error) {
    console.error('[SW] Navigation request failed:', error);
    return caches.match(OFFLINE_PAGE) || new Response('Offline');
  }
}

// Stale While Revalidate - for dynamic content
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]);
      }
      return response;
    });
    
    return cachedResponse || await networkPromise;
  } catch (error) {
    console.error('[SW] Dynamic request failed:', error);
    const cache = await caches.open(DYNAMIC_CACHE);
    return cache.match(request) || new Response('Content not available offline');
  }
}

// Background sync functions
async function syncBookings() {
  try {
    console.log('[SW] Syncing offline bookings...');
    
    // Get offline bookings from IndexedDB
    const offlineBookings = await getOfflineData('bookings');
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await removeOfflineData('bookings', booking.id);
          console.log('[SW] Booking synced successfully:', booking.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Booking sync failed:', error);
    throw error;
  }
}

async function syncMessages() {
  try {
    console.log('[SW] Syncing offline messages...');
    
    const offlineMessages = await getOfflineData('messages');
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await removeOfflineData('messages', message.id);
          console.log('[SW] Message synced successfully:', message.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', message.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Message sync failed:', error);
    throw error;
  }
}

async function syncAssignments() {
  try {
    console.log('[SW] Syncing offline assignments...');
    
    const offlineAssignments = await getOfflineData('assignments');
    
    for (const assignment of offlineAssignments) {
      try {
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignment.data)
        });
        
        if (response.ok) {
          await removeOfflineData('assignments', assignment.id);
          console.log('[SW] Assignment synced successfully:', assignment.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync assignment:', assignment.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Assignment sync failed:', error);
    throw error;
  }
}

async function syncProgress() {
  try {
    console.log('[SW] Syncing offline progress...');
    
    const offlineProgress = await getOfflineData('progress');
    
    for (const progress of offlineProgress) {
      try {
        const response = await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress.data)
        });
        
        if (response.ok) {
          await removeOfflineData('progress', progress.id);
          console.log('[SW] Progress synced successfully:', progress.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync progress:', progress.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Progress sync failed:', error);
    throw error;
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/_next/static/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isExpired(response, maxAge) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  return age > maxAge;
}

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`[SW] Cleaned ${keysToDelete.length} items from ${cacheName}`);
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

function registerBackgroundSync(tag) {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register(tag);
    }).catch(error => {
      console.error('[SW] Background sync registration failed:', error);
    });
  }
}

// IndexedDB operations for offline data (simplified interface)
async function getOfflineData(storeName) {
  // This would integrate with the IndexedDB wrapper
  // For now, return empty array as placeholder
  return [];
}

async function removeOfflineData(storeName, id) {
  // This would integrate with the IndexedDB wrapper
  // For now, just log the operation
  console.log(`[SW] Would remove ${id} from ${storeName}`);
}

// Periodic cache cleanup
setInterval(() => {
  console.log('[SW] Running periodic cache cleanup...');
  
  Promise.all([
    limitCacheSize(STATIC_CACHE, CACHE_LIMITS[STATIC_CACHE]),
    limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]),
    limitCacheSize(API_CACHE, CACHE_LIMITS[API_CACHE])
  ]).catch(error => {
    console.error('[SW] Cache cleanup failed:', error);
  });
}, 60 * 60 * 1000); // Run every hour

console.log('[SW] Service worker script loaded');