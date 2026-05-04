const CACHE_NAME = 'secret-story-v' + Date.now();
const urlsToCache = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalação - guarda ficheiros em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberta');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Erro a adicionar ao cache:', err))
      .then(() => self.skipWaiting())
  );
});

// Fetch - só guarda pedidos GET
self.addEventListener('fetch', event => {
  // Ignora pedidos POST, PUT, DELETE (votações, chat, etc)
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchResponse => {
          // Só guarda respostas bem-sucedidas e do mesmo domínio
          if (fetchResponse && fetchResponse.status === 200 && event.request.url.startsWith('https://reality-fan-pi.vercel.app')) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Offline fallback - mostra página inicial
        return caches.match('/index.html');
      })
  );
});

// Ativação - remove caches antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('🗑️ Cache antiga removida:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});
