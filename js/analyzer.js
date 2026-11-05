/* ==========================================================
   analyzer.js — تحليل الروابط (منطق حقيقي، بدون روابط مُلفّقة)
   Romany.analyzer.analyze(url)  -> يحدد النوع ويحوّل يوتيوب لـ embed
   Romany.analyzer.scanPage(url) -> يحاول يقرأ الصفحة ويدوّر على روابط وسائط
   ========================================================== */
(function () {
    'use strict';

    const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'];
    const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

    function normalize(raw) {
        let s = String(raw || '').trim();
        if (!s) return null;
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
        try {
            const u = new URL(s);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
            return u;
        } catch (_) { return null; }
    }

    /* يرجّع { id } أو { list } أو null */
    function parseYouTube(u) {
        if (!YT_HOSTS.includes(u.hostname)) return null;
        const seg = u.pathname.split('/').filter(Boolean);
        const idOk = (s) => /^[\w-]{11}$/.test(s || '');
        if (u.hostname === 'youtu.be') return idOk(seg[0]) ? { id: seg[0] } : null;
        const v = u.searchParams.get('v');
        if (v && idOk(v)) return { id: v };
        if (['embed', 'shorts', 'live', 'v'].includes(seg[0]) && idOk(seg[1])) return { id: seg[1] };
        const list = u.searchParams.get('list');
        if (list) return { list };
        return null;
    }

    function analyze(raw) {
        const u = normalize(raw);
        if (!u) return { valid: false, error: 'الرابط غير صالح — لازم يبدأ بـ http أو https' };

        const info = {
            valid: true, original: u.href, host: u.hostname, protocol: u.protocol.replace(':', ''),
            kind: 'page', kindLabel: 'صفحة ويب / Embed خارجي', embedUrl: u.href, playUrl: u.href, notes: []
        };

        const yt = parseYouTube(u);
        if (YT_HOSTS.includes(u.hostname)) {
            if (!yt) return { valid: false, error: 'رابط يوتيوب بدون معرّف فيديو أو قائمة تشغيل (روابط القنوات مش بتتحوّل لـ Embed)' };
            info.kind = 'youtube'; info.kindLabel = 'يوتيوب';
            info.embedUrl = yt.id
                ? `https://www.youtube.com/embed/${yt.id}`
                : `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(yt.list)}`;
            info.playUrl = info.embedUrl;
            info.videoId = yt.id || ('list:' + yt.list);
        } else if (/\.m3u8$/i.test(u.pathname) || u.searchParams.get('protocol') === 'hls') {
            info.kind = 'hls'; info.kindLabel = 'بث HLS (M3U8)'; info.embedUrl = u.href;
        } else if (VIDEO_EXT.test(u.pathname) || u.hostname.endsWith('googlevideo.com')) {
            info.kind = 'video'; info.kindLabel = 'ملف فيديو مباشر';
        }

        if (u.protocol === 'http:' && location.protocol === 'https:' && info.kind !== 'page') {
            info.notes.push('الرابط http والتطبيق https — المتصفح غالباً هيحجبه (Mixed Content).');
        }
        return info;
    }

    /* يحاول يجيب الصفحة ويدوّر على روابط وسائط. معظم المواقع بتحجب القراءة
       من متصفح تاني (CORS) — ساعتها بنرجّع cors:true وبنقول للمستخدم بوضوح. */
    async function scanPage(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 9000);
        try {
            const res = await fetch(url, { signal: ctrl.signal, mode: 'cors', credentials: 'omit' });
            if (!res.ok) return { ok: false, error: `السيرفر رد بحالة ${res.status}` };
            const text = (await res.text()).replace(/\\\//g, '/');
            const media = new Set();
            const re = /https?:\/\/[^\s"'<>\\)]+?\.(?:m3u8|mp4|webm)(?:\?[^\s"'<>\\)]*)?/gi;
            let m; while ((m = re.exec(text)) && media.size < 25) media.add(m[0]);
            const frames = new Set();
            const fr = /<iframe[^>]+src=["']([^"']+)["']/gi;
            while ((m = fr.exec(text)) && frames.size < 10) {
                try { frames.add(new URL(m[1], url).href); } catch (_) { /* ignore */ }
            }
            return { ok: true, media: [...media], frames: [...frames] };
        } catch (err) {
            if (err.name === 'AbortError') return { ok: false, error: 'انتهت مهلة الاتصال (9 ثواني)' };
            return { ok: false, cors: true, error: 'الموقع بيمنع قراءة صفحته من المتصفح (CORS) — مش هينفع نفحصه من هنا' };
        } finally { clearTimeout(timer); }
    }

    window.Romany = window.Romany || {};
    window.Romany.analyzer = { analyze, scanPage, normalize };
})();
