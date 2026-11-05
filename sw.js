/* Service Worker — يخلّي التطبيق يشتغل أوفلاين.
   غيّر رقم VERSION كل ما تعدّل في الملفات عشان الكاش يتحدّث. */
const VERSION = 'v1';
const SHELL = `romany-shell-${VERSION}`;
const RUNTIME = `romany-runtime-${VERSION}`;

const SHELL_FILES = [
    './', 'index.html', 'tester.html', 'extractor.html', 'history.html', 'settings.html', 'offline.html',
    'manifest.json',
    'css/base.css', 'css/components.css',
    'js/tools.js', 'js/app.js', 'js/analyzer.js', 'js/player.js',
    'js/pages/home.js', 'js/pages/tester.js', 'js/pages/extractor.js', 'js/pages/history.js', 'js/pages/settings.js',
    'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/favicon-32.png'
];
/* مكتبات خارجية مسموح نخزّنها (خطوط، أيقونات، hls.js) — أي رابط تاني (فيديوهات المستخدم) مش بيتخزّن */
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => ![SHELL, RUNTIME].includes(k)).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // صفحات: الشبكة أولاً (عشان التحديثات) وبعدين الكاش وبعدين صفحة الأوفلاين
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req).then(res => {
                const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); return res;
            }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || caches.match('offline.html'))
        );
        return;
    }

    // ملفات التطبيق: كاش أولاً مع تحديث في الخلفية
    if (url.origin === location.origin || CDN_HOSTS.includes(url.hostname)) {
        e.respondWith(
            caches.match(req).then(cached => {
                const refresh = fetch(req).then(res => {
                    if (res && (res.ok || res.type === 'opaque')) {
                        const copy = res.clone();
                        caches.open(url.origin === location.origin ? SHELL : RUNTIME).then(c => c.put(req, copy));
                    }
                    return res;
                }).catch(() => cached);
                return cached || refresh;
            })
        );
    }
    // أي حاجة تانية (روابط فيديو/بث المستخدم) تعدّي للشبكة مباشرة
});
