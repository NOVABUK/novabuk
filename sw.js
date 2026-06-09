const CACHE_NAME = "novabuk-v9"; // Updated version
const OFFLINE_PAGE = "./offline.html";
const CLINIC_OFFLINE_PAGE = "./clinic-offline.html";
const CLINIC_QUEUE_PAGE = "./clinic-queue.html";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./sign-in.html",
  "./app-home.html",
  "./app-clinics.html",
  "./complaints.html",
  "./app-visit-request.html",
  "./app-setting.html",
  "./styles.css",
  "./styles-app.css",
  "./styles-about.css",
  "./styles-blog.css",
  "./app-setting.css",
  "./db.js",
  "./app.js",
  "./script.js",
  "./app-history.html",
  "./app-tip-view.html",
  "./blog-dynamic.html",
  "./blog-single.html",
  "./send-email.html",
  "./forgot-password.html",
  "./reset-password.html",
  "./verify-otp.html",
  "./profile-health.html",
  "./images/logo.png",
  "./images/image 19.png",
  "./images/clinic.png",
  "./images/complain (1).png",
  "./images/history.png",
  "./images/banner1.png",
  "./images/banner2.png",
  "./images/banner3.png",
  "./images/mainframe1.png",
  "./images/mainframe2.png",
  "./images/mainframe3.png",
  "./images/image 40.png",
  "./images/Group 1000013935.png",
  "./images/image 38 (1).png",
  "./images/Group 1000013936.png",
  "./images/image 30.png",
  "./images/image 36.png",
  "./manifest.json",
  "./clinic-queue.html",
  "./clinic-login.html",
  "./clinic-search.html",
  "./clinic-patient.html",
  "./clinic-settings.html",
  "./clinic-notifications.html",
  "./clinic-consultation.html",
  "./clinic-register.html",
  "./clinic-forgot-password.html",
  "./clinic-reset-password.html",
  CLINIC_OFFLINE_PAGE,
  OFFLINE_PAGE,
  "./about.html",
  "./services.html",
  "./contact.html",
  "./data-privacy.html",
  "./terms.html",
  "./clinic.css",
  "./clinic-shared.js",
];

// 1. Install Event: Save files to cache
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force this worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching core assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

// 2. Activate Event: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  return self.clients.claim(); // Take control of all open tabs immediately
});

// 3. Fetch Event: Serve from cache if offline
self.addEventListener("fetch", (event) => {
  // 1. Skip non-GET requests
  if (event.request.method !== "GET") return;

  // 2. Skip API requests (db.js handles these with IndexedDB)
  if (event.request.url.includes("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        const reqUrl = new URL(event.request.url);
        const isClinicPage = reqUrl.pathname.includes("clinic-");

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
          throw new Error("Navigation fetch returned non-ok response");
        } catch (fetchError) {
          console.warn(
            "[Service Worker] Navigation fetch failed:",
            event.request.url,
            fetchError,
          );
          if (isClinicPage) {
            const clinicQueue = await caches.match(CLINIC_QUEUE_PAGE);
            if (clinicQueue) return clinicQueue;
            const clinicOffline = await caches.match(CLINIC_OFFLINE_PAGE);
            if (clinicOffline) return clinicOffline;
          }

          const offlineFallback = await caches.match(OFFLINE_PAGE);
          if (offlineFallback) return offlineFallback;
          return (
            (await caches.match("./index.html")) ||
            new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        }
      })(),
    );
    return;
  }

  // Non-navigation requests: try cache first, then network, and cache same-origin assets when online.
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const requestUrl = new URL(event.request.url);
          if (requestUrl.origin === self.location.origin) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
        }
        return networkResponse;
      } catch (err) {
        console.log(
          "[Service Worker] Asset not in cache & Network failed:",
          event.request.url,
        );
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
    })(),
  );
});
