const CACHE_NAME = 'novabuk-v6'; // Updated version
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './sign-in.html',
  './app-home.html',
  './app-clinics.html',
  './complaints.html',
  './app-visit-request.html',
  './app-setting.html',
  './styles.css',
  './styles-app.css',
  './app-setting.css',
  './db.js',
  './app.js',
  './script.js',
  './app-history.html',
  './images/logo.png',
  './images/image 19.png',
  './images/clinic.png',
  './images/complain (1).png',
  './images/history.png',
  './manifest.json',
  './clinic-queue.html'
];

// 1. Install Event: Save files to cache
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force this worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Take control of all open tabs immediately
});

// 3. Fetch Event: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  // 1. Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // 2. Skip API requests (db.js handles these with IndexedDB)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return from cache if found
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise try the network
      return fetch(event.request).catch((err) => {
        console.log('[Service Worker] Asset not in cache & Network failed:', event.request.url);
        // Return a dummy offline response to prevent the SW from crashing with a TypeError
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      });
    })
  );
});
