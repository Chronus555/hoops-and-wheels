// Offline support: serve from cache right away, refresh the cache in the background.
// Bump VERSION when files change so the iPad picks up the new version.

const VERSION = 'sg-v1';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'audio/voice/index.json',
  'js/main.js',
  'js/stage.js',
  'js/layout.js',
  'js/art.js',
  'js/lines.js',
  'js/car.js',
  'js/fx.js',
  'js/sound.js',
  'js/voice.js',
  'js/voicekey.js',
  'js/store.js',
  'js/tools.js',
  'js/stations.js',
  'js/garage.js',
  'js/lot.js',
];

async function cacheVoice(cache) {
  try {
    const index = await (await fetch('audio/voice/index.json')).json();
    const files = [...new Set(Object.values(index))].map(f => `audio/voice/${f}`);
    for (let i = 0; i < files.length; i += 24) {
      await Promise.all(files.slice(i, i + 24).map(f => cache.add(f).catch(() => {})));
    }
  } catch { /* offline during install: clips get cached as they play */ }
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(FILES);
    await cacheVoice(c);
  }));
  self.skipWaiting();
});

// Only this app's old caches are removed (Hoops & Wheels lives on the same site).
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sg-') && k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    if (cached && /\/audio\/voice\/[^/]+\.mp3$/.test(new URL(e.request.url).pathname)) return cached;
    const fresh = fetch(e.request)
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => cached);
    return cached || fresh;
  }));
});
