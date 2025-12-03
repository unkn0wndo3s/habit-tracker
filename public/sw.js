// Version du cache - incrémenter pour forcer la mise à jour
const CACHE_VERSION = "v2";
const CACHE_NAME = `trackit-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  // Forcer l'activation immédiate du nouveau service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ne pas bloquer l'installation si certains assets échouent
      return cache.addAll(CORE_ASSETS).catch((error) => {
        console.warn("Erreur lors du cache des assets:", error);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log("Suppression de l'ancien cache:", key);
              return caches.delete(key);
            })
        )
      )
      .then(() => {
        // Prendre le contrôle immédiatement
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Pour les requêtes API, toujours utiliser le réseau (pas de cache)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Pour les assets statiques (images, fonts, etc.), utiliser stale-while-revalidate
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i) ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // Retourner le cache immédiatement, mettre à jour en arrière-plan
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Pour les pages HTML et JS, utiliser network-first avec fallback sur cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la réponse est valide, mettre à jour le cache
        if (networkResponse.ok) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si le réseau échoue, utiliser le cache
        return caches.match(event.request).then((cachedResponse) => {
          // Si pas de cache pour cette requête, retourner la page d'accueil en cache
          return cachedResponse || caches.match("/");
        });
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "TrackIt";
  const options = {
    body: payload.body || "Rappel d'habitude",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    data: payload.data || { url: "/" },
    tag: payload.tag || `trackit-${Date.now()}`,
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "OPEN_FROM_NOTIFICATION",
              data: event.notification.data,
            });
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
