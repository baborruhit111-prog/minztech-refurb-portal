// MiNZTECH Portal Service Worker - Mobile Background & Push Notifications
const CACHE_NAME = "minztech-portal-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from web app to display native mobile system notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        badge: "/brand/logo-white.png",
        icon: "/brand/logo-white.png",
        vibrate: [200, 100, 200, 100, 200],
        renotify: true,
        requireInteraction: true,
        ...options
      })
    );
  }
});

// Handle clicking on mobile system tray notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and post a message
      for (const client of clientList) {
        if ("focus" in client) {
          if (event.notification.data) {
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              data: event.notification.data
            });
          }
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
