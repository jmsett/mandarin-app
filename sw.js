// Bump the cache name whenever a shell asset changes.
const CACHE = 'little-mandarin-shell-v4';
const SHELL = ['./', './index.html', './styles.css', './app.js', './state.js', './data.js', './resources.json', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL.map(asset => new Request(new URL(asset, self.registration.scope), {cache: 'reload'})));
    // Activate only after the complete shell is cached. Open pages decide when
    // to reload, so active practice is not interrupted by an ordinary update.
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('little-mandarin-shell-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    // Older app code has no update control. An explicit recovery link lets that
    // tab load the new shell even while other old app tabs remain open.
    const clients = await self.clients.matchAll({type: 'window'});
    clients.forEach(client => {
      const url = new URL(client.url);
      if (url.searchParams.get('update') !== '1') return;
      url.searchParams.delete('update');
      // Do not await navigation here: its fetch waits for activation to finish.
      client.navigate(url.href).catch(() => {});
    });
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match('./index.html')) || fetch(request)));
    return;
  }
  // Cache only the app shell, never recordings, user data, or third-party media.
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
});
