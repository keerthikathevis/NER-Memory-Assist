const CACHE_NAME = 'ner-memory-assist-shell-v7';
const CULTURAL_IMAGE_CACHE = 'ner-memory-cultural-images-v4';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg', '/favicon.svg'];

const CULTURAL_IMAGE_URLS = [
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kamakhya%20Temple%20Assam%20India.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Umananda%20Temple%2C%20Guwahati.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Navagraha%20Temple%2C%20Guwahati%2001.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hayagriva%20Madhav%20temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nartiang%20Durga%20Temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tripura%20sundari%20temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/TawangMonastery.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Madan%20Kamdev%20Temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dirgheswari%20Temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loktak%20Lake%20View.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rhinoceros%20Kaziranga.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mawlynnong.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Great%20Indian%20Hornbill.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/%22Duli%22%20-%20a%20large%20bamboo%20basket%20used%20for%20storing%20seeds%20of%20paddy%2C%20mustard%2C%20etc.%2C%20commonly%20used%20in%20Assam%2002.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Assamese%20pitha.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/The%20Bihu%20dance%20in%20Assam.jpg?width=900',
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
