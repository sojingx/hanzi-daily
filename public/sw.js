const CACHE_NAME = 'hanzidaily-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// ── Install: cache shell ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches + take control immediately ────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// ── Fetch: network-first, fall back to cache ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Notification scheduling ───────────────────────────────────────────────────
let scheduledTimeout = null;
let scheduledPayload = null;

function localDateString() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATION') return;

  const { time, character, meaning, wordId } = event.data;
  scheduledPayload = { character, meaning, wordId };

  if (scheduledTimeout) clearTimeout(scheduledTimeout);

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If today's time has already passed, schedule for tomorrow
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target - now;

  scheduledTimeout = setTimeout(async () => {
    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
    const focused = allClients.some((c) => c.focused);

    if (!focused) {
      self.registration.showNotification('今日汉字', {
        body: `${character}  —  ${meaning}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'daily-word',
        renotify: false,
        data: { wordId },
      });
    }

    // Re-schedule for same time tomorrow
    scheduledTimeout = setTimeout(async () => {
      if (!scheduledPayload) return;
      self.registration.showNotification('今日汉字', {
        body: `${scheduledPayload.character}  —  ${scheduledPayload.meaning}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'daily-word',
        renotify: true,
        data: { wordId: scheduledPayload.wordId },
      });
    }, 24 * 60 * 60 * 1000);
  }, delay);
});

// ── Notification click: open / focus app ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const wordId = event.notification.data?.wordId;
  const url = wordId ? `/?word=${wordId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'OPEN_WORD', wordId });
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
