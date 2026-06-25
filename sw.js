const CACHE_NAME = 'streva-prod-v2';
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
    e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request).then((netRes) => {
                if (e.request.url.includes('basemaps.cartocdn.com')) return netRes; // Jangan cache tiles map dynamis
                return caches.open(CACHE_NAME).then((c) => { c.put(e.request, netRes.clone()); return netRes; });
            });
        })
    );
});
