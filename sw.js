const CACHE_NAME = 'streva-prod-v7';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/lucide@latest'
];

// Instalasi: Melakukan caching awal pada aset-aset krusial PWA
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
});

// Aktivasi: Membersihkan cache lama yang sudah usang saat versi di-update
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

// Intersepsi Jaringan (Cache-First dengan Fallback)
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Mengembalikan cache jika ada, jika tidak, lanjutkan permintaan ke jaringan
            return cachedResponse || fetch(e.request).then((networkResponse) => {
                // Pengecualian mutlak: Jangan menyimpan tiles peta pihak ketiga (CartoDB) ke dalam cache lokal PWA 
                // karena akan membebani ruang penyimpanan ponsel secara eksponensial (O(n)).
                if (e.request.url.includes('basemaps.cartocdn.com')) {
                    return networkResponse;
                }
                
                // Menyimpan aset eksternal baru ke dalam cache secara dinamis
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Fallback skenario kegagalan jaringan mutlak (contoh: mode pesawat saat render peta)
            console.warn('[STREVA SW] Fetch failed, returning offline fallback if available.');
        })
    );
});
