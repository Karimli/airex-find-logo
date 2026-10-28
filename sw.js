/**
 * Offline keş (bölmə 6.2). İlk açılışda (internet lazımdır) bütün fayllar keşə yazılır,
 * sonra sayt internetsiz də açılır. Strategiya: cache-first. Google Sheets sorğularına toxunulmur.
 *
 * PRECACHE və VERSION əl ilə yazılmır: `node tools/update-sw.mjs` faylları tapıb bu bloku yeniləyir.
 * Fayllardan biri dəyişəndə VERSION da dəyişir → kiosk yeni versiyanı yükləyir, köhnə keş silinir.
 */

// <precache> — tools/update-sw.mjs tərəfindən yaradılır, əl ilə dəyişməyin
const VERSION = 'e72ab2c9f29c';
const PRECACHE = [
  './assets/brand/airex-logo.svg',
  './assets/brand/logo-icon.svg',
  './assets/fonts/Inter-Bold.woff2',
  './assets/fonts/Inter-ExtraBold.woff2',
  './assets/fonts/Inter-Medium.woff2',
  './assets/fonts/Inter-Regular.woff2',
  './assets/fonts/Inter-SemiBold.woff2',
  './assets/icons/rule-search.svg',
  './assets/icons/rule-tap.svg',
  './assets/icons/rule-timer.svg',
  './assets/maps/baku/map.webp',
  './css/fonts.css',
  './css/game.css',
  './css/layout.css',
  './css/reset.css',
  './css/tokens.css',
  './',
  './js/app/FindLogoApp.js',
  './js/config.js',
  './js/core/Emitter.js',
  './js/core/Timer.js',
  './js/core/assets.js',
  './js/core/env.js',
  './js/core/storage.js',
  './js/core/sw-register.js',
  './js/core/sync.js',
  './js/core/tap.js',
  './js/game/DevPanel.js',
  './js/game/GameEngine.js',
  './js/game/HudView.js',
  './js/game/MapView.js',
  './js/game/animations.js',
  './js/game/hitTest.js',
  './js/main.js',
  './js/maps/baku/logos.js',
  './vendor/modern-normalize.css',
];
// </precache>

const CACHE_PREFIX = 'find-logo-';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // HTTP keşini keç: hər versiyada faylların ən təzəsi yazılsın
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Google Sheets və s. — həmişə şəbəkə

  event.respondWith(fromCache(request));
});

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function fromCache(request) {
  const cache = await caches.open(CACHE_NAME);

  // Səhifə açılışı: ?dev kimi parametrlər də keşdəki səhifəyə düşsün
  if (request.mode === 'navigate') {
    const cached = await cache.match(new URL('./', self.registration.scope));
    if (cached) return cached;
  }

  const cached = await cache.match(request, { ignoreSearch: true });
  return cached ?? fetch(request);
}
