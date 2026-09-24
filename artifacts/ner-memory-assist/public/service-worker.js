const CACHE_NAME = 'ner-memory-assist-shell-v7';
const CULTURAL_IMAGE_CACHE = 'ner-memory-cultural-images-v5';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg', '/favicon.svg'];

const CULTURAL_IMAGE_URLS = [
  '/cultural-images/kamakhya.jpg',
  '/cultural-images/umananda.jpg',
  '/cultural-images/navagraha.jpg',
  '/cultural-images/hayagriva.jpg',
  '/cultural-images/nartiang.jpg',
  '/cultural-images/tripurasundari.jpg',
  '/cultural-images/tawang.jpg',
  '/cultural-images/madan.jpg',
  '/cultural-images/dirgheswari.jpg',
  '/cultural-images/loktak.jpg',
  '/cultural-images/kaziranga.jpg',
  '/cultural-images/mawlynnong.jpg',
  '/cultural-images/hornbill.jpg',
  '/cultural-images/bamboo.jpg',
  '/cultural-images/pitha.jpg',
  '/cultural-images/bihu.jpg',
];

async function cacheCulturalImages() {
  const cache = await caches.open(CULTURAL_IMAGE_CACHE);
  await Promise.all(
    CULTURAL_IMAGE_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { mode: 'no-cors', cache: 'no-cache' });
        if (response.type === 'opaque' || response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // One unavailable image must not prevent the PWA from installing.
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
      cacheCulturalImages(),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== CULTURAL_IMAGE_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const data = event.notification?.data ?? {};
  event.notification.close();

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const target = clientsList[0];
    if (target) {
      target.postMessage({
        type: 'MEDICINE_NOTIFICATION_ACTION',
        action: action || 'open',
        medicineId: data.medicineId,
        scheduledFor: data.scheduledFor,
        time: data.time,
      });
      await target.focus();
      return;
    }
    await self.clients.openWindow('/medicine');
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (
    (url.origin === self.location.origin && url.pathname === '/api/cultural-image') ||
    (url.hostname === 'commons.wikimedia.org' && request.destination === 'image')
  ) {
    event.respondWith(
      caches.open(CULTURAL_IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request, { mode: 'no-cors', cache: 'no-cache' });
          if (response.ok || response.type === 'opaque') {
            event.waitUntil(cache.put(request, response.clone()));
          }
          return response;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) return;

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
