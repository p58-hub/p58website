const CACHE = 'p58-card-v14';
const SHELL = [
  '/card/georgios', '/card/card.css', '/card/card.js', '/card/profile.js',
  '/card/contact', '/card/contact.js',
  '/card/language.js', '/card/locales.js', '/card/details.js', '/card/context.js', '/card/avatar.svg',
  '/card/vendor/qrcode.js', '/card/manifest.webmanifest', '/card/icon-192.png', '/card/icon-512.png',
  '/assets/people/georgios-grigoriadis.jpg', '/assets/logo-black.svg',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('p58-card-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Never cache authenticated settings, APIs, drafts, messages or external sites.
  if (request.method !== 'GET' || url.origin !== self.location.origin || (!SHELL.includes(url.pathname) && !/^\/card\/member\/[a-z0-9-]+$/.test(url.pathname))) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected) { await cache.put(url.pathname, response.clone()); return response; }
      return (await cache.match(url.pathname)) || response;
    } catch {
      return (await cache.match(url.pathname)) || (url.pathname.startsWith('/card/member/') ? await cache.match('/card/georgios') : null) || new Response('Offline', { status: 503 });
    }
  })());
});
