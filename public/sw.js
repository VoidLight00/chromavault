const CACHE_NAME = 'chromavault-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/editor',
  '/explore',
  '/auth/login',
  '/auth/signup',
  '/manifest.json',
  // Add critical CSS and JS files here
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // Cache first strategy for static assets
  if (event.request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return response;
            });
        })
    );
    return;
  }

  // Network first strategy for API calls and dynamic content
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline fallback page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'palette-sync') {
    event.waitUntil(syncPalettes());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'ChromaVault 알림',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '탐색하기',
        icon: '/icons/explore-action.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icons/dismiss-action.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ChromaVault', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/explore')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync palettes when back online
async function syncPalettes() {
  try {
    // Get pending palettes from IndexedDB or localStorage
    const pendingPalettes = JSON.parse(localStorage.getItem('pendingPalettes') || '[]');
    
    for (const palette of pendingPalettes) {
      try {
        const response = await fetch('/api/palettes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(palette)
        });
        
        if (response.ok) {
          // Remove from pending list
          const index = pendingPalettes.indexOf(palette);
          if (index > -1) {
            pendingPalettes.splice(index, 1);
          }
        }
      } catch (error) {
        console.error('Failed to sync palette:', error);
      }
    }
    
    localStorage.setItem('pendingPalettes', JSON.stringify(pendingPalettes));
  } catch (error) {
    console.error('Sync failed:', error);
  }
}