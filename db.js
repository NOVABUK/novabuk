// ================================================================
// db.js - The Offline-First Engine for NovaBuk
// ================================================================

<<<<<<< HEAD
const DB_NAME = "NovaBukOffline";
const DB_VERSION = 2; // Upgraded version for caching
const STORE_OUTBOX = "outbox";
const STORE_CACHE = "cache";
=======
const DB_NAME = 'NovaBukOffline';
const DB_VERSION = 2; // Upgraded version for caching
const STORE_OUTBOX = 'outbox';
const STORE_CACHE = 'cache';
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281

// ── DATABASE SETUP ───────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Store for data waiting to be SENT to server
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
<<<<<<< HEAD
        db.createObjectStore(STORE_OUTBOX, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      // Store for data fetched FROM server for viewing offline
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "url" });
=======
        db.createObjectStore(STORE_OUTBOX, { keyPath: 'id', autoIncrement: true });
      }
      // Store for data fetched FROM server for viewing offline
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'url' });
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ── SAVE REQUEST FOR LATER (OUTBOX) ───────────────────────────
async function saveOfflineRequest(url, method, body, headers, baseVersion) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
<<<<<<< HEAD
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const store = tx.objectStore(STORE_OUTBOX);
    const request = store.add({
      url,
      method,
      body,
      headers,
      baseVersion, // The version the user SAW before editing
      timestamp: Date.now(),
=======
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    const store = tx.objectStore(STORE_OUTBOX);
    const request = store.add({ 
      url, method, body, headers, 
      baseVersion, // The version the user SAW before editing
      timestamp: Date.now() 
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── CACHE DATA FOR VIEWING (CACHE) ────────────────────────────
async function saveToCache(url, data) {
  const db = await openDB();
<<<<<<< HEAD
  const tx = db.transaction(STORE_CACHE, "readwrite");
=======
  const tx = db.transaction(STORE_CACHE, 'readwrite');
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
  tx.objectStore(STORE_CACHE).put({ url, data, timestamp: Date.now() });
}

async function getFromCache(url) {
  const db = await openDB();
<<<<<<< HEAD
  const tx = db.transaction(STORE_CACHE, "readonly");
=======
  const tx = db.transaction(STORE_CACHE, 'readonly');
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
  return new Promise((resolve) => {
    const req = tx.objectStore(STORE_CACHE).get(url);
    req.onsuccess = () => resolve(req.result); // Returns {url, data, timestamp}
  });
}

// ── THE SMART FETCH WRAPPER ───────────────────────────────────
async function smartFetch(url, options = {}) {
<<<<<<< HEAD
  const method = options.method || "GET";

  // 1. Quick check for known offline state when saving data
  if (method !== "GET" && !navigator.onLine) {
    console.log("📦 Device offline. Saving to Outbox with Conflict Guard...");
    const cacheEntry = await getFromCache(url);
    const baseVersion = cacheEntry
      ? cacheEntry.data.updatedAt || cacheEntry.timestamp
      : null;

    await saveOfflineRequest(
      url,
      method,
      options.body,
      options.headers,
      baseVersion,
    );
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, offline: true }),
=======
  const method = options.method || 'GET';

  // 1. Quick check for known offline state when saving data
  if (method !== 'GET' && !navigator.onLine) {
    console.log("📦 Device offline. Saving to Outbox with Conflict Guard...");
    const cacheEntry = await getFromCache(url);
    const baseVersion = cacheEntry ? (cacheEntry.data.updatedAt || cacheEntry.timestamp) : null;
    
    await saveOfflineRequest(url, method, options.body, options.headers, baseVersion);
    return { 
      ok: true, status: 200, 
      json: async () => ({ success: true, offline: true }) 
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
    };
  }

  // 2. Try the network
  try {
    const response = await fetch(url, options);
<<<<<<< HEAD

    // Treat the dummy Offline response from the Service Worker as a network failure
    if (
      response.status === 503 &&
      response.statusText === "Service Unavailable"
    ) {
      throw new Error("Service Worker Offline Response");
    }

    // If online and successful GET, silently update the cache
    if (method === "GET" && response.ok) {
      const clone = response.clone();
      clone
        .json()
        .then((data) => saveToCache(url, data))
        .catch(() => {});
=======
    
    // Treat the dummy Offline response from the Service Worker as a network failure
    if (response.status === 503 && response.statusText === "Service Unavailable") {
      throw new Error("Service Worker Offline Response");
    }
    
    // If online and successful GET, silently update the cache
    if (method === 'GET' && response.ok) {
      const clone = response.clone();
      clone.json().then(data => saveToCache(url, data)).catch(() => {});
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
    }
    return response;
  } catch (err) {
    // ── NETWORK FAILURE HANDLER (Catches throttled/failed requests) ──
<<<<<<< HEAD

    // If it's a SAVE request (POST/PUT/DELETE), move to outbox
    if (method !== "GET") {
      console.log("📡 Network error during save. Moving to Outbox...");
      const cacheEntry = await getFromCache(url);
      const baseVersion = cacheEntry
        ? cacheEntry.data.updatedAt || cacheEntry.timestamp
        : null;
      await saveOfflineRequest(
        url,
        method,
        options.body,
        options.headers,
        baseVersion,
      );
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, offline: true }),
=======
    
    // If it's a SAVE request (POST/PUT/DELETE), move to outbox
    if (method !== 'GET') {
      console.log("📡 Network error during save. Moving to Outbox...");
      const cacheEntry = await getFromCache(url);
      const baseVersion = cacheEntry ? (cacheEntry.data.updatedAt || cacheEntry.timestamp) : null;
      await saveOfflineRequest(url, method, options.body, options.headers, baseVersion);
      return { 
        ok: true, status: 200, 
        json: async () => ({ success: true, offline: true }) 
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
      };
    }

    // If it's a GET request, try to serve from cache
    const cacheEntry = await getFromCache(url);
    if (cacheEntry) {
      console.log("📂 Serving cached data for:", url);
      return {
<<<<<<< HEAD
        ok: true,
        status: 200,
        json: async () => cacheEntry.data,
        lastUpdated: cacheEntry.timestamp,
      };
    }

=======
        ok: true, status: 200,
        json: async () => cacheEntry.data,
        lastUpdated: cacheEntry.timestamp
      };
    }
    
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
    // If no cache and no network, let it fail
    throw err;
  }
}

// ── THE SYNC ENGINE ──────────────────────────────────────────
async function syncOutbox() {
  if (!navigator.onLine) return; // Don't even try if we know we are offline
<<<<<<< HEAD

  const db = await openDB();
  const tx = db.transaction(STORE_OUTBOX, "readonly");
  const store = tx.objectStore(STORE_OUTBOX);

=======
  
  const db = await openDB();
  const tx = db.transaction(STORE_OUTBOX, 'readonly');
  const store = tx.objectStore(STORE_OUTBOX);
  
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
  const requests = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  if (requests.length === 0) return;

<<<<<<< HEAD
  let syncedCount = 0;
  for (const req of requests) {
    try {
      const headers = {
        ...(req.headers || {}),
        "Content-Type": "application/json",
      };
      if (req.baseVersion) {
        headers["X-Base-Version"] = req.baseVersion;
=======
  for (const req of requests) {
    try {
      const headers = { ...(req.headers || {}), 'Content-Type': 'application/json' };
      if (req.baseVersion) {
        headers['X-Base-Version'] = req.baseVersion;
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
      }

      const response = await fetch(req.url, {
        method: req.method,
        headers: headers,
<<<<<<< HEAD
        body: req.body,
      });
      if (response.ok) {
        syncedCount += 1;
        console.log(
          ` [SyncEngine] Successfully synced offline data to server: ${req.url}`,
        );
        const deleteTx = db.transaction(STORE_OUTBOX, "readwrite");
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);
      } else if (response.status === 409) {
        console.error(
          ` [SyncEngine] Conflict detected on ${req.url}. Deleting outdated offline action.`,
        );
        const deleteTx = db.transaction(STORE_OUTBOX, "readwrite");
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);

        // Alert the doctor that someone else modified the record while they were offline
        if (typeof window.showNetworkToast === "function") {
          window.showNetworkToast(
            "Sync Conflict: An offline change was rejected because another staff member updated the record first.",
            false,
            true,
          );
        }
      } else {
        console.warn(
          ` [SyncEngine] Server rejected sync data: ${req.url} (Status: ${response.status})`,
        );
      }
    } catch (err) {
      break;
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("novabuk-sync-complete", { detail: { syncedCount } }),
    );
  }

  return syncedCount;
=======
        body: req.body
      });
      if (response.ok) {
        console.log(`✅ [SyncEngine] Successfully synced offline data to server: ${req.url}`);
        const deleteTx = db.transaction(STORE_OUTBOX, 'readwrite');
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);
      } else if (response.status === 409) {
        console.error(`❌ [SyncEngine] Conflict detected on ${req.url}. Deleting outdated offline action.`);
        const deleteTx = db.transaction(STORE_OUTBOX, 'readwrite');
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);
        
        // Alert the doctor that someone else modified the record while they were offline
        if (typeof window.showNetworkToast === 'function') {
          window.showNetworkToast("Sync Conflict: An offline change was rejected because another staff member updated the record first.", false, true);
        }
      } else {
        console.warn(`⚠️ [SyncEngine] Server rejected sync data: ${req.url} (Status: ${response.status})`);
      }
    } catch (err) { break; }
  }
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
}

// ── HELPERS FOR UI ───────────────────────────────────────────
async function getOutboxCount() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
<<<<<<< HEAD
      const tx = db.transaction(STORE_OUTBOX, "readonly");
=======
      const tx = db.transaction(STORE_OUTBOX, 'readonly');
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
      const store = tx.objectStore(STORE_OUTBOX);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => {
        console.error("❌ [DB] Error counting outbox:", e);
        resolve(0);
      };
    });
  } catch (err) {
    console.error("❌ [DB] Failed to open database for counting:", err);
    return 0;
  }
}

// ── LISTENERS ────────────────────────────────────────────────
<<<<<<< HEAD
window.addEventListener("online", syncOutbox);
window.addEventListener("load", syncOutbox);
=======
window.addEventListener('online', syncOutbox);
window.addEventListener('load', syncOutbox);
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281

// Expose to window
window.smartFetch = smartFetch;
window.syncOutbox = syncOutbox;
window.getOutboxCount = getOutboxCount;
