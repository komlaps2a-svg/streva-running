const CACHE_NAME = 'tracker-core-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/lucide@latest'
];

// Instalasi & Caching Strategi Agresif
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Pembersihan Memori Lintas-Versi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Interseptor Jaringan (Network First, Fallback to Cache)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

/**
 * LOGIKA SINKRONISASI WIDGET / BACKGROUND BADGE
 * Mendengarkan emisi dari index.html melalui BroadcastChannel.
 * Karena PWA tidak memiliki Widget Layar Utama interaktif murni di iOS/Android tanpa Wrapper, 
 * angka langkah dieksekusi ke App Badge (notifikasi angka merah di atas ikon aplikasi).
 */
const widgetChannel = new BroadcastChannel('pwa-widget-sync');

widgetChannel.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_STATE') {
        const payload = event.data.payload;
        
        // Eksekusi App Badge API (Didukung di Chromium 81+ dan iOS 16.4+)
        if ('setAppBadge' in navigator) {
            // Membatasi angka badge maksimal 9999 agar tidak merusak UI OS
            const displaySteps = payload.steps > 9999 ? 9999 : payload.steps;
            navigator.setAppBadge(displaySteps).catch(error => {
                console.error('[SW] Mutasi App Badge Gagal:', error);
            });
        }
    }
});
