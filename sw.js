const C='compass-v14',SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vvi/index.json','./mx/index.json','./world/countries.json','./world/countries_geo.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL.map(s=>new Request(s,{cache:'reload'})))));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
// per-state VVI files (vvi/zip_SS.json, vvi/tract_SS.json) are not precached; the fetch handler caches them at runtime when a route loads them
// network-first for the app shell; API calls (OSRM/TIGERweb/Nominatim/tiles) pass through untouched
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});
