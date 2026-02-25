/**
 * AstroNuit — Service Worker (PWA)
 * Gère le cache et les notifications push
 */

const CACHE_NAME = 'astronuit-v2';
const OFFLINE_PAGE = '/index.html';

// Ressources à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/evenements.html',
  '/carte.html',
  '/ciel-du-soir.html',
  '/galerie.html',
  '/connexion.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/main.css',
  '/css/components.css',
  '/css/pages/home.css',
  '/css/pages/events.css',
  '/js/stars.js',
  '/js/astronomy.js',
  '/js/weather.js',
  '/js/firebase.js',
  '/js/services/auth.service.js',
  '/js/services/firestore.service.js',
  '/js/services/storage.service.js',
  '/js/services/fcm.service.js',
  '/js/utils/app.js',
  '/js/utils/helpers.js',
  '/js/utils/router.js',
  '/js/pages/index.page.js',
  '/js/pages/connexion.page.js',
];

// Installation : pré-cacher les ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map(url => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes Firebase/API externes
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('openweathermap') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche pour les ressources statiques
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match(OFFLINE_PAGE);
        });
      })
  );
});

// Notifications push
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Rappel de sortie AstroNuit',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/evenements.html' },
    actions: [
      { action: 'view', title: 'Voir la sortie' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || '🌌 AstroNuit — Rappel de sortie',
      options
    )
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
