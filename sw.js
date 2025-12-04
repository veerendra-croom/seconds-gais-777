
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
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
