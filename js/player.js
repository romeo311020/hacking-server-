/* ==========================================================
   player.js — المشغّل الشامل (HLS / فيديو مباشر / Iframe)
   const p = Romany.createPlayer({ wrapper, target, controls, playIcon,
                                   bar, time, timeline, status });
   p.mount(url)  p.destroy()  p.toggle()  p.mute()  p.fullscreen()
   ========================================================== */
(function () {
    'use strict';

    function fmt(t) {
        if (!isFinite(t)) return '00:00';
        const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
        const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
        return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
    }

    function createPlayer(els) {
        let video = null, hls = null;

        const status = (msg, isErr) => {
            if (!els.status) return;
            els.status.textContent = msg || '';
            els.status.style.display = msg ? 'block' : 'none';
            els.status.classList.toggle('err', !!isErr);
        };

        function destroy() {
            if (video) { video.pause(); video.removeAttribute('src'); video.load(); video = null; }
            if (hls) { hls.destroy(); hls = null; }
            els.target.innerHTML = '';
            status('');
        }

        function bindVideo(v) {
            v.addEventListener('timeupdate', () => {
                if (els.bar && v.duration) els.bar.style.width = (v.currentTime / v.duration * 100) + '%';
                if (els.time) els.time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
            });
            v.addEventListener('play', () => { if (els.playIcon) els.playIcon.className = 'fa-solid fa-pause'; });
            v.addEventListener('pause', () => { if (els.playIcon) els.playIcon.className = 'fa-solid fa-play'; });
            v.addEventListener('error', () => status('تعذّر تشغيل الملف: الرابط غير صالح أو السيرفر بيمنع التشغيل من موقع تاني (CORS).', true));
        }

        /* info = نتيجة Romany.analyzer.analyze */
        function mount(info) {
            destroy();
            els.wrapper.style.display = 'block';

            if (info.kind === 'hls' || info.kind === 'video') {
                if (els.controls) els.controls.style.display = 'flex';
                video = document.createElement('video');
                video.setAttribute('playsinline', '');
                video.controls = false;
                els.target.appendChild(video);
                bindVideo(video);

                if (info.kind === 'hls') {
                    if (window.Hls && window.Hls.isSupported()) {
                        hls = new window.Hls();
                        hls.on(window.Hls.Events.ERROR, (_e, data) => {
                            if (data.fatal) status(`خطأ في البث (${data.type}): ${data.details}`, true);
                        });
                        hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
                        hls.loadSource(info.playUrl);
                        hls.attachMedia(video);
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = info.playUrl; video.play().catch(() => {});
                    } else {
                        status('المتصفح مش بيدعم HLS (أو مكتبة hls.js ماتحمّلتش — اتأكد من الإنترنت لأول مرة).', true);
                    }
                } else {
                    video.src = info.playUrl; video.play().catch(() => {});
                }
            } else {
                // صفحة / يوتيوب / Embed => Iframe (له أزراره الخاصة)
                if (els.controls) els.controls.style.display = 'none';
                const f = document.createElement('iframe');
                f.src = info.embedUrl;
                f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
                f.allowFullscreen = true;
                f.referrerPolicy = 'no-referrer-when-downgrade';
                f.title = 'مشغل خارجي';
                els.target.appendChild(f);
                status('بعض المواقع بتمنع التضمين داخل Iframe — لو الشاشة فاضية افتح الرابط في نافذة جديدة.');
            }
        }

        return {
            mount, destroy,
            toggle() { if (video) video.paused ? video.play() : video.pause(); },
            mute(iconEl) { if (video) { video.muted = !video.muted; if (iconEl) iconEl.className = 'fa-solid ' + (video.muted ? 'fa-volume-xmark' : 'fa-volume-high'); } },
            seek(e) {
                if (video && video.duration) {
                    const r = e.currentTarget.getBoundingClientRect();
                    video.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * video.duration;
                }
            },
            fullscreen() { (els.wrapper.requestFullscreen || els.wrapper.webkitRequestFullscreen || function () {}).call(els.wrapper); }
        };
    }

    window.Romany = window.Romany || {};
    window.Romany.createPlayer = createPlayer;
})();
