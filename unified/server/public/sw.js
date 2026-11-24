// Service Worker for morabbi-app PWA
// Provides offline support, caching, and background sync

const CACHE_VERSION = "morabbi-app-v8";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App shell - critical resources for offline use
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/logo-nehzat.jpg",
  "/icon-192.svg",
  "/icon-512.svg",
];

// Install - cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Ignore failed individual cache additions
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Don't intercept API calls - they should fail naturally to enable offline mode
  if (url.pathname.startsWith("/api/")) return;

  // Don't intercept cross-origin requests (except same-origin assets)
  if (url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests: Network-first, fall back to cached
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images, fonts): Cache-first
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      dir: "rtl",
      lang: "fa-IR",
      tag: data.tag || "morabbi-notification",
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "اعلان جدید", options)
    );
  } catch (err) {
    console.warn("[SW] Push notification error:", err);
  }
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If app is open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Background Sync - triggered when connectivity is restored
// Even if the browser is closed, this will fire when network is available
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-reports") {
    event.waitUntil(
      // Notify all open clients to trigger sync
      clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: "TRIGGER_SYNC", source: "background-sync" });
        });
        return Promise.resolve();
      }).catch(() => Promise.resolve())
    );
  }
});

// Periodic Background Sync (Chrome only, requires installation)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "periodic-sync-reports") {
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: "TRIGGER_SYNC", source: "periodic-sync" });
        });
        return Promise.resolve();
      }).catch(() => Promise.resolve())
    );
  }
});
