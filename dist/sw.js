// LONGVIEW 서비스워커 · 앱 껍데기는 캐시 우선(백그라운드 갱신), 자료(history.js·macro.js)는 네트워크 우선.
// 코드를 고치면 아래 VERSION을 올려야 설치된 앱이 새 껍데기를 받습니다. 자료만 바뀔 때는 올릴 필요 없습니다.
const VERSION = '2026-11-03a';
const CACHE = 'longview-' + VERSION;
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'indicators.js', 'chart.js', 'judge.js', 'training.js', 'chart-guide.js', 'cases.js', 'research.js', 'reading.js', 'easy-reading.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];
const DATA = ['history.js', 'macro.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('longview-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const name = url.pathname.split('/').pop();
  if (same && DATA.includes(name)) {
    // 자료: 네트워크 우선, 실패하면 캐시(오프라인)
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req)));
    return;
  }
  if (same) {
    // 껍데기: 캐시 우선 + 백그라운드 갱신
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  // 외부(CDN 차트 라이브러리·글꼴): 캐시 우선
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })));
});
