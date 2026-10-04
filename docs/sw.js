/* The build script injects the release cache and its exact asset list. */
const VERSION = "kang-in-v4-0784afa9bc55";
const PRECACHE = ["./","./assets/index-C4ZU1kYv.js","./assets/style-p-uBcQ9Y.css","./favicon.svg","./icon-192.png","./icon-512.png","./icon-maskable.png","./manifest.webmanifest","./retro-kid.png"];
const scopeUrl = new URL('./', self.registration.scope);
const absolute = path => new URL(path, scopeUrl).href;
const allowed = new Set(PRECACHE.map(absolute));

async function validResponse(response, navigation = false) {
  if (!response || !response.ok || response.redirected || response.type !== 'basic') return false;
  if (new URL(response.url).origin !== scopeUrl.origin) return false;
  if (navigation) {
    if (!(response.headers.get('content-type') || '').includes('text/html')) return false;
    // Never store an authentication page as the offline game shell.
    return (await response.clone().text()).includes('data-app-id="kang-in"');
  }
  return true;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    try {
      await Promise.all(PRECACHE.map(async path => {
        const url = absolute(path);
        const response = await fetch(url, {credentials:'same-origin',cache:'reload'});
        if (!(await validResponse(response, path === './'))) throw new Error('App shell unavailable');
        await cache.put(url, response);
      }));
    } catch (error) {
      await caches.delete(VERSION);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('kang-in-') && key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scopeUrl.origin) return;
  const navigation = request.mode === 'navigate' && url.pathname === scopeUrl.pathname;
  if (navigation) {
    event.respondWith((async () => {
      // Keep HTML and its hashed assets in the same release. A waiting update
      // becomes the current shell only when the player applies that update.
      const shell = await caches.match(scopeUrl.href, {cacheName:VERSION});
      if (shell) return shell;
      try {
        return await fetch(request);
      } catch {
        return new Response('첫 실행에는 인터넷 연결이 필요합니다.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
  } else if (allowed.has(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (await validResponse(response)) await cache.put(request, response.clone());
      return response;
    })());
  }
});
