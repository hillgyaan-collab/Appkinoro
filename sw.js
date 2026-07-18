// Service Worker for Appkinoro PWA
const CACHE_NAME = 'appkinoro-v1';
const urlsToCache = [
  'https://hillgyaan-collab.github.io/Appkinoro/',
  'https://hillgyaan-collab.github.io/Appkinoro/index.html',
  'https://hillgyaan-collab.github.io/Appkinoro/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Cache failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page or fallback
        console.log('Fetch failed; returning offline page');
        return new Response('Offline - cached content not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Background sync (optional - for future features)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

// Push notifications (optional - for future notifications)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Appkinoro - नई प्रश्नोत्तरी उपलब्ध है!',
    icon: 'https://via.placeholder.com/192x192/0a0e27/4a90e2?text=Appkinoro',
    badge: 'https://via.placeholder.com/72x72/0a0e27/4a90e2?text=A'
  };

  event.waitUntil(
    self.registration.showNotification('Appkinoro', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === 'https://hillgyaan-collab.github.io/Appkinoro/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://hillgyaan-collab.github.io/Appkinoro/');
      }
    })
  );
});

// Sync scores helper function (optional)
async function syncScores() {
  try {
    console.log('Syncing scores...');
    // Add your sync logic here
  } catch (error) {
    console.error('Sync failed:', error);
  }
}