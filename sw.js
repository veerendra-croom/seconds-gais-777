const CACHE_NAME = 'seconds-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate strategy for HTML/JS/CSS
  if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, responseToCache);
             });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Seconds-App Notification';
  const options = {
    body: data.message || 'You have a new update.',
    icon: 'https://ui-avatars.com/api/?name=S&background=0ea5e9&color=fff&size=192',
    badge: 'https://ui-avatars.com/api/?name=S&background=0ea5e9&color=fff&size=192',
    data: { url: data.link || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});