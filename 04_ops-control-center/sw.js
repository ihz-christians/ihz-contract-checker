const CACHE_NAME = 'ops-control-cache-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './app.js',
  './components/health-grid.js',
  './components/pipeline-queue.js',
  './components/cost-metrics.js',
  './components/security-audit.js',
  './components/simulator-panel.js',
  './components/incident-tracker.js'
];

// Install Service Worker and Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell...');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event and Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - Cache First, Fallback to Network
self.addEventListener('fetch', (event) => {
  // Exclude external API requests from caching
  if (event.request.url.includes('/api/v1') || event.request.url.includes('/actuator')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
