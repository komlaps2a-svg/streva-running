const CACHE_NAME = 'streva-prod-v8';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map(k => { 
                    if (k !== CACHE_NAME) return caches.delete(k); 
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request).then((networkResponse) => {
                // Pengecualian: Blokir caching untuk map pihak ketiga (CartoDB) guna mencegah pembengkakan memori penyimpanan hp.
                if (e.request.url.includes('basemaps.cartocdn.com')) {
                    return networkResponse;
                }
                
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            console.warn('[STREVA SW] Fetch gagal, memuat aset luring (jika ada).');
        })
    );
});
