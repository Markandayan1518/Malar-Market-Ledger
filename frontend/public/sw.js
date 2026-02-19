/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'malar-ledger-arctic-v2';
const OFFLINE_URL = '/';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// CSS files to cache (Arctic Frost theme)
const CSS_ASSETS = [
  '/src/styles/arctic-frost.css',
  '/src/styles/animations.css',
  '/src/index.css',
];

// API routes that should use NetworkFirst strategy
const API_ROUTES = ['/api/'];

// Static assets that should use CacheFirst strategy
const STATIC_ASSETS = [
  '/icons/',
  '/assets/',
  '/src/styles/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - NetworkFirst with offline fallback
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - CacheFirst
  if (STATIC_ASSETS.some((asset) => url.pathname.startsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle navigation requests - NetworkFirst with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Default: StaleWhileRevalidate for other requests
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});

async function syncOfflineEntries() {
  try {
    // Get offline entries from IndexedDB
    const offlineEntries = await getOfflineEntries();
    
    // Sync each entry
    for (const entry of offlineEntries) {
      try {
        const response = await fetch('/api/v1/daily-entries/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry.data),
        });
        
        if (response.ok) {
          await removeOfflineEntry(entry.id);
        }
      } catch (error) {
        console.error('Failed to sync entry:', error);
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { success: true },
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
function getOfflineEntries() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MalarLedgerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline_entries'], 'readonly');
      const store = transaction.objectStore('offline_entries');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

function removeOfflineEntry(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MalarLedgerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline_entries'], 'readwrite');
      const store = transaction.objectStore('offline_entries');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
