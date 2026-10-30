// Помощник 47: офлайн-кэш оболочки приложения
const CACHE = 'p47-v9';
const FILES = ['./', 'index.html', 'settings.js', 'food.js', 'money.js', 'sync.js', 'books.js', 'body.js', 'private-data.js', 'manifest.json', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
// каждый файл кэшируем отдельно: личного файла может не быть, это не ошибка
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
// сначала сеть, при отсутствии сети: кэш
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request)));
});
