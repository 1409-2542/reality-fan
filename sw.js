// Secret Story PWA - Service Worker v2.0
const CACHE_NAME = 'secret-story-v2';
const RUNTIME_CACHE = 'runtime-cache';

// Recursos estáticos para cache na instalação
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/expulsoes.html',
  '/nomeados-semana.html',
  '/estatisticas.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalação
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Adicionando recursos ao cache...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpa caches antigas
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker ativado!');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de fetch: Cache First para assets, Network First para dados
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar analytics e pings
  if (event.request.method !== 'GET' || 
      url.pathname.includes('analytics') ||
      url.pathname.includes('firestore')) {
    return fetch(event.request);
  }
  
  // Estratégia para HTML e dados dinâmicos
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }
  
  // Para imagens, CSS, JS - Cache First
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|css|js)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
    );
    return;
  }
  
  // Para APIs e dados - Network First with timeout
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(event.request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Fallback: tentar cache, depois rede
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline - Conteúdo não disponível', {
          status: 503,
          statusText: 'Offline'
        });
      })
  );
});

// Sincronização em segundo plano (quando online novamente)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-votes') {
    event.waitUntil(syncVotes());
  }
});

async function syncVotes() {
  const cache = await caches.open(RUNTIME_CACHE);
  const pendingVotes = await cache.match('/pending-votes');
  if (pendingVotes) {
    const votes = await pendingVotes.json();
    // Reenviar votos quando online
    for (const vote of votes) {
      await fetch('/api/vote', {
        method: 'POST',
        body: JSON.stringify(vote),
        headers: { 'Content-Type': 'application/json' }
      });
    }
    await cache.delete('/pending-votes');
  }
}

// Notificações push
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Nova atualização!', body: 'Algo novo no Secret Story' };
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
