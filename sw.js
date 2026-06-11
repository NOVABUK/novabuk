const CACHE_NAME = "/novabuk-static-v1";
const OFFLINE_PAGE = "/offline.html";
const CLINIC_OFFLINE_PAGE = "/clinic-offline.html";
const CLINIC_QUEUE_PAGE = "/clinic-queue.html";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/sign-in.html",
  "/app-home.html",
  "/app-clinics.html",
  "/complaints.html",
  "/app-visit-request.html",
  "/app-setting.html",
  "/styles.css",
  "/styles-app.css",
  "/styles-about.css",
  "/styles-blog.css",
  "/app-setting.css",
  "/db.js",
  "/app.js",
  "/script.js",
  "/app-history.html",
  "/app-tip-view.html",
  "/blog-dynamic.html",
  "/blog-single.html",
  "/send-email.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/verify-otp.html",
  "/profile-health.html",
  "/images/logo.png",
  "/images/logo.png",
  "/images/clinic.png",
  "/images/complain (1).png",
  "/images/history.png",
  "/images/banner1.png",
  "/images/banner2.png",
  "/images/banner3.png",
  "/images/mainframe1.png",
  "/images/mainframe2.png",
  "/images/mainframe3.png",
  "/images/image 40.png",
  "/images/Group 1000013935.png",
  "/images/image 38 (1).png",
  "/images/Group 1000013936.png",
  "/images/image 30.png",
  "/images/image 36.png",
  "/manifest.json",
  "/clinic-queue.html",
  "/clinic-login.html",
  "/clinic-search.html",
  "/clinic-patient.html",
  "/clinic-settings.html",
  "/clinic-notifications.html",
  "/clinic-consultation.html",
  "/clinic-register.html",
  "/clinic-forgot-password.html",
  "/clinic-reset-password.html",
  "/about.html",
  "/services.html",
  "/contact.html",
  "/data-privacy.html",
  "/terms.html",
  "/clinic.css",
  "/clinic-shared.js",
  OFFLINE_PAGE,
  CLINIC_OFFLINE_PAGE,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[Service Worker] Caching core assets");
      await Promise.all(
        ASSETS_TO_CACHE.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn("[Service Worker] Failed to cache", asset, err);
          }),
        ),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
          return null;
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request, {
            cache: "no-store",
          });
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
          throw new Error("Navigation fetch returned non-ok response");
        } catch (error) {
          console.warn(
            "[Service Worker] Navigation failed:",
            event.request.url,
            error,
          );
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          const isClinicPage = requestUrl.pathname.includes("clinic-");
          if (isClinicPage) {
            const clinicQueue = await caches.match(CLINIC_QUEUE_PAGE);
            if (clinicQueue) return clinicQueue;
            const clinicOffline = await caches.match(CLINIC_OFFLINE_PAGE);
            if (clinicOffline) return clinicOffline;
          }

          const offlineFallback = await caches.match(OFFLINE_PAGE);
          if (offlineFallback) return offlineFallback;

          const indexFallback = await caches.match("/");
          if (indexFallback) return indexFallback;

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  const isStaticAsset =
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "document" ||
    requestUrl.pathname.endsWith(".html") ||
    requestUrl.pathname.endsWith(".js") ||
    requestUrl.pathname.endsWith(".css");

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request, {
            cache: "no-store",
          });
          if (networkResponse && networkResponse.ok) {
            if (isSameOrigin) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }
          throw new Error("Network response not OK");
        } catch (error) {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          console.warn(
            "[Service Worker] Static asset fetch failed:",
            event.request.url,
            error,
          );
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok && isSameOrigin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.warn(
          "[Service Worker] Asset offline and not cached:",
          event.request.url,
          error,
        );
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      }
    })(),
  );
});
