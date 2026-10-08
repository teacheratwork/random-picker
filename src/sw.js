/*
 * Service worker: keeps a copy of the app's files on the phone,
 * so the app opens even without internet.
 *
 * !!! IMPORTANT !!!
 * Every time you change ANY file of the app, raise the version number below
 * (v1 -> v2 -> v3 ...). Otherwise phones keep using the old copy.
 */
const CACHE = "random-picker-v1";

const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

// First install: download and store every file.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting(); // use the new version as soon as it is installed
});

// New version active: delete the copies made by older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Every request: answer from the stored copy first, from the network otherwise.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((cached) => cached || fetch(event.request))
  );
});
