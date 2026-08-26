/* eslint-disable no-restricted-globals */
const sw = (self as unknown) as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data,
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      sw.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new one
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(urlToOpen);
      }
    })
  );
});
