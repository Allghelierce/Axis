const CACHE = 'axis-v1';
const SHELL = [
    '/dashboard.html',
    '/styles.css',
    '/js/state.js',
    '/js/auth.js',
    '/js/settings.js',
    '/js/habits.js',
    '/js/notes.js',
    '/js/analytics.js',
    '/js/nutrition.js',
    '/js/gallery.js',
    '/js/workouts.js',
    '/js/tasks.js',
    '/js/particles.js',
    '/js/map.js',
    '/js/summary.js',
    '/js/storage.js',
    '/js/selection.js',
    '/js/dock.js',
    '/js/main.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return res;
        }))
    );
});
