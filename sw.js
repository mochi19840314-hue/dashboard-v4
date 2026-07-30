const C="keita-dashboard-v1048-kagemusha-images";
const A=["./","./index.html","./style.css?v=1047","./app.js?v=1048","./ai-director.js?v=1046","./manifest.json","./icon-192.png","./icon-512.png","./clinic-logo.png","./kagemusha-normal.jpeg","./kagemusha-smile.jpeg","./影武者思考.jpeg","./kagemusha-warning.jpeg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))})
