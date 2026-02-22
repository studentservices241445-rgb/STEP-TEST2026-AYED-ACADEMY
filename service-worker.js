const CACHE_NAME = 'ayed-step-v3';
const STATIC_CACHE = 'ayed-static-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/quiz.html',
  '/results.html',
  '/register.html',
  '/course.html',
  '/login.html',
  '/captcha.html',
  '/install.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/data/questions.json',
  '/assets/data/plans.json',
  '/assets/data/course.json',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        // For external URLs, use no-cors
        if (url.startsWith('http')) return new Request(url, { mode: 'no-cors' });
        return url;
      })).catch(e => console.warn('Cache add failed for some assets:', e));
    }).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy: Cache-first for static, Network-first for dynamic
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip Chrome extension and external APIs
  if (url.protocol === 'chrome-extension:') return;
  if (url.hostname.includes('googleapis.com') && !url.pathname.includes('css')) return;
  if (url.hostname.includes('script.google.com')) return;

  // For HTML pages: Network-first (to get updates)
  if (event.request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // For JS, CSS, images, fonts: Cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (!resp || resp.status !== 200) return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return resp;
      }).catch(() => {
        // Offline fallback for images
        if (event.request.destination === 'image') return new Response('', { status: 200 });
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for registration data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-registration') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    // In real implementation, this would read from IndexedDB and send pending data
    console.log('Background sync: checking pending data');
  } catch(e) {
    console.error('Sync failed:', e);
  }
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'أكاديمية عايد', {
      body: data.body || 'لديك تحديث جديد من أكاديمية عايد STEP 2026',
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'close', title: 'إغلاق' },
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action !== 'close') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
    );
  }
});
