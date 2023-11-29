importScripts('https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js');
importScripts('/assets/js/utils/db.utils.js');
importScripts('/assets/js/utils/sw-utils.js');

const STATIC_CACHE = 'staticv1';
const INMUTABLE_CACHE = 'inmutable1';
const DYNAMIC_CACHE = 'dynamicv1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/img/img-404.png',
  '/assets/img/not-found.svg',
  '/assets/img/report.ico',
  '/assets/img/reports.png',
  '/assets/js/main.js',
  '/assets/js/admin/admin.home.controller.js',
  '/assets/js/admin/admin.users.controller.js',
  '/assets/js/auth/signin.js',
  '/assets/js/axios/axios-intance.js',
  '/assets/js/toast/toasts.js',
  '/pages/auth/register.html',
  '/pages/admin/home.html',
  '/pages/admin/users.html',
  '/pages/attendant/home.html',
  '/pages/docent/home.html',
  '/pages/docent/incidences.html',
];

const APP_SHELL_INMUTABLE = [
  'https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js',
  '/assets/js/jquery-3.7.1.min.js',
  '/assets/vendor/bootstrap/css/bootstrap.min.css',
  '/assets/vendor/bootstrap/js/bootstrap.min.js',
  '/assets/vendor/bootstrap-icons/bootstrap-icons.min.css',
  '/assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff',
  '/assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2',
  '/assets/vendor/boxicons/css/boxicons.min.css',
  '/assets/vendor/boxicons/fonts/boxicons.eot',
  'https://cdn.jsdelivr.net/npm/toastify-js',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  '/assets/vendor/boxicons/fonts/boxicons.svg',
  '/assets/vendor/boxicons/fonts/boxicons.ttf',
  '/assets/vendor/boxicons/fonts/boxicons.woff',
  '/assets/vendor/boxicons/fonts/boxicons.woff2',
  'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
  'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
];

const clear = (cacheName, items = 50) => {
  caches.open(cacheName).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys.length > items)
        cache.delete(keys[0]).then(clear(cacheName, items));
    });
  });
};

// La instalación y activación
self.addEventListener('install', (e) => {
  const static = caches.open(STATIC_CACHE).then((cache) => {
    return cache.addAll(APP_SHELL);
  });
  const inmutable = caches.open(INMUTABLE_CACHE).then((cache) => {
    return cache.addAll(APP_SHELL_INMUTABLE);
  });
  self.skipWaiting();
  e.waitUntil(Promise.all([static, inmutable]));
});

self.addEventListener('activate', (e) => {
  const clearCache = caches.keys().then((keys) => {
    // forof / forEach
    keys.forEach((key) => {
      if (key !== STATIC_CACHE && key.includes('static'))
        return caches.delete(key);
      if (key !== DYNAMIC_CACHE && key.includes('dynamic'))
        return caches.delete(key);
    });
  });
  e.waitUntil(clearCache);
});

self.addEventListener('fetch', (e) => {
  //VErificar el POST '/api/user' ->POST
  let source;
  if (e.request.url.includes('/api/')) {
    //Network with cache fallback
    source = apiSaveIncidence(DYNAMIC_CACHE, e.request);
  } else {
    //Cache with network fallback
    source = caches.match(e.request).then((cacheRes) => {
      if (cacheRes) {
        updateStaticCache(STATIC_CACHE, e.request, APP_SHELL_INMUTABLE);
        return cacheRes;
      } else {
        return fetch(e.request).then((res) => {
          return updateDynamicCache(DYNAMIC_CACHE, e.request, res);
        });
      }
    });
  }
  e.respondWith(source);
});

self.addEventListener('sync', (event) => {
  console.log('SYNC', { event });
  if (event.tag === 'incidence-status-post') {
    event.waitUntil(saveIncidenceToApi());
  }
});