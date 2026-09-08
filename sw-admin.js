const CACHE = "joy-bronze-admin-v1";
const ASSETS = ["./admin.html","./admin.js","./firebase-config.js","./style.css","./manifest-admin.json","./icon-admin.svg"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", event => { event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });
self.addEventListener("notificationclick", event => { event.notification.close(); event.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(list => { for (const client of list) if ("focus" in client) return client.focus(); if (clients.openWindow) return clients.openWindow("./admin.html"); })); });