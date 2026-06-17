const CACHE_NAME = 'mji-hard-recover-20260618-1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {}
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // 紧急恢复版：不缓存、不替换响应，全部交给网络，避免 CSS 被当成页面。
  event.respondWith(fetch(req));
});
