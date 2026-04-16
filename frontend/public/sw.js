// ═══════════════════════════════════════════════════════════
// PrevenApp v2.0 — Service Worker
// Estrategia: Cache-first para assets, Network-first para API
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = "prevenapp-v2.2";
const API_CACHE = "prevenapp-api-v1";

// App shell — archivos esenciales que se cachean al instalar
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// ─── Install: cachear app shell ─────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cacheando app shell");
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ─── Activate: limpiar caches viejos ────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => {
            console.log("[SW] Eliminando cache viejo:", name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: estrategia por tipo de request ──────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET for caching (POST/PUT/DELETE van directo a red)
  if (request.method !== "GET") return;

  // API requests: network-first con fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // Google Fonts: cache-first (raramente cambian)
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // Todo lo demás (app shell, JS bundles): stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Estrategia: Network-first (para API) ───────────────────
async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    // Cache successful GET responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline: intentar cache
    const cached = await caches.match(request);
    if (cached) return cached;
    // No cache: devolver respuesta de error legible
    return new Response(
      JSON.stringify({
        success: false,
        error: "Sin conexión. Los datos se mostrarán cuando vuelva a conectarse.",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ─── Estrategia: Cache-first (para fonts y assets estáticos) ─
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response("", { status: 408 });
  }
}

// ─── Estrategia: Stale-while-revalidate (para app shell) ────
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  // Devolver cached inmediatamente si existe, mientras actualiza en background
  return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
}

// ─── Offline queue para writes (POST/PUT) ───────────────────
// Los writes que fallan se encolan en IndexedDB y se reenvían
// cuando se restablece la conexión. Esto se maneja desde el
// frontend (api.js) dado que el SW no intercepta non-GET.
// El SW notifica al frontend cuando vuelve la conexión:

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
