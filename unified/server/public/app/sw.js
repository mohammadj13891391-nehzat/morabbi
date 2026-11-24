/* Morabbi Unified PWA service worker — app-shell cache.
   - navigation (same scope): network-first, fallback to cached shell
   - static assets: cache-first
   - /api/* is NOT intercepted (always live) */
var CACHE = 'morabbi-unified-v1';
var SHELL = [
  './index.html',
  './js/api.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.pathname.indexOf('/api/') === 0) return; /* live API */

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
  }
});

/* background sync from the v2.0.0 pattern */
self.addEventListener('sync', function (e) {
  if (e.tag === 'morabbi-sync') {
    e.waitUntil(self.clients.matchAll().then(function (clients) {
      clients.forEach(function (c) { c.postMessage({ type: 'TRIGGER_SYNC' }); });
    }));
  }
});

self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: 'نهضت تربیتی', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || 'نهضت تربیتی', {
    body: data.body || '', dir: 'rtl', lang: 'fa-IR', icon: 'icon-192.png', data: data
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (var i = 0; i < ws.length; i++) { ws[i].focus(); return; }
    return self.clients.openWindow('./index.html');
  }));
});
