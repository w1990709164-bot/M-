const CACHE_NAME = 'mji-pwa-cache-20260617-nav-fullscreen';
const CORE_ASSETS = [
  "./",
  "./README.txt",
  "./README_UPLOAD.txt",
  "./desktop-style-add.css",
  "./desktop-style-theme.css",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./js/app.js",
  "./js/backup.js",
  "./js/blindbox.js",
  "./js/chat.js",
  "./js/contacts.js",
  "./js/db.js",
  "./js/desktop.js",
  "./js/diary.js",
  "./js/door.js",
  "./js/dreamhouse.js",
  "./js/forum.js",
  "./js/game.js",
  "./js/groups.js",
  "./js/hacker.js",
  "./js/imagegen.js",
  "./js/mailbox.js",
  "./js/memory.js",
  "./js/moments.js",
  "./js/nav.js",
  "./js/pomodoro.js",
  "./js/radio.js",
  "./js/reading.js",
  "./js/schedule.js",
  "./js/settings.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/utils.js",
  "./js/weather.js",
  "./js/worldbook.js",
  "./manifest.json",
  "./style.css"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS.map(u => new Request(u, { cache: 'reload' }))).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(req) {
  try { return new URL(req.url).origin === self.location.origin; } catch(e) { return false; }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !isSameOrigin(req)) return;
  const url = new URL(req.url);

  // 页面入口：网络优先，失败再回退缓存，解决桌面图标打开“连接不上/旧缓存”
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => null);
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
        }
        return resp;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
