const CACHE_NAME = 'ner-memory-assist-shell-v5';
const CULTURAL_IMAGE_CACHE = 'ner-memory-cultural-images-v2';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg', '/favicon.svg'];

const CULTURAL_IMAGE_URLS = [
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kamakhya%20Temple%20in%20Assam.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Umananda%20Mandir.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/NAVAGRAHA%20TEMPLE%20GUWAHATI.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hayagriva%20Madhav%20temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nartiang%20Durga%20temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tripura%20sundari%20temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/TawangMonastery.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Madan%20Kamdev%20Temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dirgheswari%20Temple.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loktak%20Lake%20View.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rhinoceros%20Kaziranga.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mawlynnong.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Great%20hornbills%20-%20pride%20of%20Nagaland.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bamboo%20basket.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Assamese%20pitha.jpg?width=900',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bihu%20in%20Assam.jpg?width=900',
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

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === self.location.origin && url.pathname === '/api/cultural-image') {
    event.respondWith(
      caches.open(CULTURAL_IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok) event.waitUntil(cache.put(request, response.clone()));
          return response;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) return;

  // Cultural images are cross-origin resources. Cache them so the same
  // real photos remain available after the device loses connectivity.
  if (url.origin !== self.location.origin && url.hostname === 'commons.wikimedia.org') {
    event.respondWith(
      caches.open(CULTURAL_IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.type === 'opaque' || response.ok) {
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
