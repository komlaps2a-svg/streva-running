const CACHE_NAME = 'streva-prod-v8';
const ASSETS = [
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
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .catch((err) => console.error(JSON.stringify({ error: "Cache Install Fatal", where: "sw.install", why: err.message })))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map(k => { 
                if (k !== CACHE_NAME) return caches.delete(k); 
            })
        )).catch((err) => console.error(JSON.stringify({ error: "Cache Cleanup Fatal", where: "sw.activate", why: err.message })))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Abaikan mutasi data, hanya tangkap request GET
    if (e.request.method !== 'GET') return;
    
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request).then((netRes) => {
                // PENGECUALIAN KRITIKAL: Dilarang keras melakukan caching pada tile map CartoDB 
                // untuk mencegah kebocoran memori lokal (O(n) bloat).
                if (e.request.url.includes('basemaps.cartocdn.com')) return netRes; 
                
                return caches.open(CACHE_NAME).then((c) => { 
                    c.put(e.request, netRes.clone()); 
                    return netRes; 
                });
            });
        }).catch((err) => {
            console.error(JSON.stringify({ error: "Fetch Intercept Failed", where: "sw.fetch", url: e.request.url, why: err.message }));
            // Graceful degradation: Biarkan fail secara luring jika aset tidak vital
        })
    );
});
