// Offline support: serve from cache right away, refresh the cache in the background.
// Bump VERSION when files are added or removed.

const VERSION = 'hw-v4';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'audio/voice/index.json',
  'js/voicekey.js',
  'js/namevoice.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/main.js',
  'js/router.js',
  'js/store.js',
  'js/speech.js',
  'js/sound.js',
  'js/session.js',
  'js/util.js',
  'js/ui.js',
  'js/art.js',
  'js/data.js',
  'js/round.js',
  'js/cards.js',
  'js/screens/start.js',
  'js/screens/setup.js',
  'js/screens/home.js',
  'js/screens/world.js',
  'js/screens/race.js',
  'js/screens/parking.js',
  'js/screens/monster.js',
  'js/screens/hoop.js',
  'js/screens/trace.js',
  'js/screens/drum.js',
  'js/screens/blend.js',
  'js/screens/build.js',
  'js/screens/train.js',
  'js/screens/sort.js',
  'js/screens/size.js',
  'js/screens/band.js',
  'js/screens/listen.js',
  'js/screens/reward.js',
  'js/screens/garage.js',
  'js/screens/rest.js',
  'js/screens/parent.js',
];

// Voice clips are downloaded too, a few at a time; one failed clip doesn't stop the
// install (the app falls back to the device voice for anything missing).
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

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    // Clip names never change meaning, so a cached clip needs no refresh.
    if (cached && /\/audio\/voice\/[^/]+\.mp3$/.test(new URL(e.request.url).pathname)) return cached;
    const fresh = fetch(e.request)
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => cached);
    return cached || fresh;
  }));
});
