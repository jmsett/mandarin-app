// Bump the cache name whenever a shell asset changes.
const CACHE = 'little-mandarin-shell-v3';
const SHELL = ['./', './index.html', './styles.css', './app.js', './state.js', './data.js', './resources.json', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(asset => new Request(new URL(asset, self.registration.scope), {cache: 'reload'})))));
  // A new worker waits until existing app tabs close, avoiding a mixed app version.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('little-mandarin-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match('./index.html')) || fetch(request)));
    return;
  }
  // Only cache the app shell, never third-party content, recordings, or user data.
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
});
