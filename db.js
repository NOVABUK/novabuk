// ================================================================
// db.js - The Offline-First Engine for NovaBuk
// ================================================================

const DB_NAME = "NovaBukOffline";
const DB_VERSION = 2; // Upgraded version for caching
const STORE_OUTBOX = "outbox";
const STORE_CACHE = "cache";

// ── DATABASE SETUP ───────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "url" });
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
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const store = tx.objectStore(STORE_OUTBOX);
    const request = store.add({
      url,
      method,
      body,
      headers,
      baseVersion, // The version the user SAW before editing
      timestamp: Date.now(),
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── CACHE DATA FOR VIEWING (CACHE) ────────────────────────────
async function saveToCache(url, data) {
  const db = await openDB();
  const tx = db.transaction(STORE_CACHE, "readwrite");
  tx.objectStore(STORE_CACHE).put({ url, data, timestamp: Date.now() });
}

async function getFromCache(url) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_CACHE, "readonly");
    const req = tx.objectStore(STORE_CACHE).get(url);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

// ── THE SMART FETCH WRAPPER ───────────────────────────────────
async function smartFetch(url, options = {}) {
  const method = options.method || "GET";

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
    };
  }

  try {
    const response = await fetch(url, options);

    if (
      response.status === 503 &&
      response.statusText === "Service Unavailable"
    ) {
      throw new Error("Service Worker Offline Response");
    }

    if (method === "GET" && response.ok) {
      response
        .clone()
        .json()
        .then((data) => saveToCache(url, data))
        .catch(() => {});
    }

    return response;
  } catch (err) {
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
      };
    }

    const cacheEntry = await getFromCache(url);
    if (cacheEntry) {
      console.log("📂 Serving cached data for:", url);
      return {
        ok: true,
        status: 200,
        json: async () => cacheEntry.data,
        lastUpdated: cacheEntry.timestamp,
      };
    }

    throw err;
  }
}

// ── THE SYNC ENGINE ──────────────────────────────────────────
async function syncOutbox() {
  if (!navigator.onLine) return;

  const db = await openDB();
  const tx = db.transaction(STORE_OUTBOX, "readonly");
  const store = tx.objectStore(STORE_OUTBOX);

  const requests = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });

  if (requests.length === 0) return 0;

  let syncedCount = 0;
  for (const req of requests) {
    try {
      const headers = {
        ...(req.headers || {}),
        "Content-Type": "application/json",
      };

      if (req.baseVersion) {
        headers["X-Base-Version"] = req.baseVersion;
      }

      const response = await fetch(req.url, {
        method: req.method,
        headers,
        body: req.body,
      });

      if (response.ok) {
        syncedCount += 1;
        console.log(
          `[SyncEngine] Successfully synced offline data to server: ${req.url}`,
        );
        const deleteTx = db.transaction(STORE_OUTBOX, "readwrite");
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);
      } else if (response.status === 409) {
        console.error(
          `[SyncEngine] Conflict detected on ${req.url}. Deleting outdated offline action.`,
        );
        const deleteTx = db.transaction(STORE_OUTBOX, "readwrite");
        deleteTx.objectStore(STORE_OUTBOX).delete(req.id);

        if (
          typeof window !== "undefined" &&
          typeof window.showNetworkToast === "function"
        ) {
          window.showNetworkToast(
            "Sync Conflict: An offline change was rejected because another staff member updated the record first.",
            false,
            true,
          );
        }
      } else {
        console.warn(
          `[SyncEngine] Server rejected sync data: ${req.url} (Status: ${response.status})`,
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
}

// ── HELPERS FOR UI ───────────────────────────────────────────
async function getOutboxCount() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => {
        console.error("[DB] Error counting outbox:", e);
        resolve(0);
      };
    });
  } catch (err) {
    console.error("[DB] Failed to open database for counting:", err);
    return 0;
  }
}

// ── LISTENERS ────────────────────────────────────────────────
window.addEventListener("online", syncOutbox);
window.addEventListener("load", syncOutbox);

// Expose to window
window.smartFetch = smartFetch;
window.syncOutbox = syncOutbox;
window.getOutboxCount = getOutboxCount;
