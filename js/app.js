/* ==========================================================
   app.js — نواة التطبيق (بتتحمّل في كل صفحة)
   بتعمل: الهيدر + التنقل + اللودر + الـ Toast + الإعدادات + السجل
          + تسجيل الـ Service Worker + زر التثبيت.
   الصفحات بتستخدم  window.Romany  فقط.
   ========================================================== */
(function () {
    'use strict';

    const PAGE = document.body.dataset.page || '';

    /* ---------- تخزين آمن (localStorage ممكن يفشل) ---------- */
    const store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem('romany:' + key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (_) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem('romany:' + key, JSON.stringify(value)); return true; }
            catch (_) { return false; }
        },
        clearAll() {
            try {
                Object.keys(localStorage).filter(k => k.startsWith('romany:')).forEach(k => localStorage.removeItem(k));
            } catch (_) { /* ignore */ }
        }
    };

    /* ---------- الإعدادات ---------- */
    const DEFAULTS = { fx: true, consoleFx: true };
    const settings = {
        all() { return Object.assign({}, DEFAULTS, store.get('settings', {})); },
        get(k) { return this.all()[k]; },
        set(k, v) {
            const s = this.all(); s[k] = v; store.set('settings', s);
            if (k === 'fx') document.body.classList.toggle('no-fx', !v);
        }
    };

    /* ---------- أدوات مساعدة ---------- */
    const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function toast(message, variant = 'success') {
        const wrap = document.getElementById('toast-wrapper');
        if (!wrap) return;
        const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
        const el = document.createElement('div');
        el.className = 'toast-item ' + variant;
        const i = document.createElement('i'); i.className = 'fa-solid ' + (icons[variant] || icons.info);
        const s = document.createElement('span'); s.textContent = message;
        el.append(i, s);
        wrap.appendChild(el);
        setTimeout(() => el.classList.add('visible'), 40);
        setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); }, 3500);
    }

    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); toast('تم النسخ للحافظة', 'success'); return true; }
        catch (_) {
            // بديل لو الـ clipboard API مش متاح (http أو صلاحيات)
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* ignore */ }
            ta.remove(); toast(ok ? 'تم النسخ للحافظة' : 'تعذّر النسخ', ok ? 'success' : 'error');
            return ok;
        }
    }

    /* يكتب أسطر في "كونسول" بالتتابع؛ لو التأثيرات مقفولة يكتبها فوراً */
    async function typeLines(consoleEl, lines, delay = 320) {
        consoleEl.innerHTML = '';
        consoleEl.style.display = 'block';
        const fast = !settings.get('consoleFx');
        for (const line of lines) {
            const row = document.createElement('div');
            if (typeof line === 'object') { row.textContent = line.text; if (line.err) row.className = 'err'; }
            else row.textContent = line;
            consoleEl.appendChild(row);
            consoleEl.scrollTop = consoleEl.scrollHeight;
            if (!fast) await sleep(delay);
        }
    }

    /* ---------- السجل ---------- */
    const history = {
        MAX: 100,
        list() { return store.get('history', []); },
        add(entry) {
            const all = this.list().filter(e => !(e.url === entry.url && e.type === entry.type));
            all.unshift(Object.assign({ at: Date.now() }, entry));
            store.set('history', all.slice(0, this.MAX));
        },
        remove(at) { store.set('history', this.list().filter(e => e.at !== at)); },
        clear() { store.set('history', []); }
    };

    /* ---------- الـ Shell: هيدر + تنقل + لودر ---------- */
    function buildShell() {
        const pages = window.ROMANY_PAGES || [];
        const navPages = pages.filter(p => p.nav);
        const isActive = (p) => p.id === PAGE || (PAGE === 'tester' && p.id === 'tester');

        // خلفية
        const glow = document.createElement('div');
        glow.className = 'ambient-glow';
        glow.innerHTML = '<div class="orb orb-1"></div><div class="orb orb-2"></div>';
        document.body.prepend(glow);

        // هيدر
        const header = document.createElement('header');
        header.className = 'app-header';
        header.innerHTML = `
            <a class="logo" href="index.html"><i class="fa-solid fa-user-secret"></i><span>ROMANY Server hacking</span></a>
            <nav class="top-nav" aria-label="التنقل الرئيسي">
                ${navPages.map(p => `<a href="${p.href}" class="${isActive(p) ? 'active' : ''}"><i class="fa-solid ${p.icon}"></i>${esc(p.title)}</a>`).join('')}
            </nav>
            <div class="header-stats">
                <div class="stat-badge"><div class="pulse-dot"></div><span>الحالة: <strong style="color:var(--terminal-green)" id="net-state">متصل</strong></span></div>
                <div class="stat-badge"><i class="fa-solid fa-shield-virus" style="color:var(--danger)"></i><span>عمليات الفحص: <strong id="cyber-counter">0</strong></span></div>
            </div>`;
        document.body.insertBefore(header, document.querySelector('main'));

        // شريط سفلي (موبايل)
        const bottom = document.createElement('nav');
        bottom.className = 'bottom-nav';
        bottom.setAttribute('aria-label', 'التنقل السفلي');
        bottom.innerHTML = navPages.map(p => `<a href="${p.href}" class="${isActive(p) ? 'active' : ''}"><i class="fa-solid ${p.icon}"></i><span>${esc(p.title)}</span></a>`).join('');
        document.body.appendChild(bottom);

        // Toasts
        const tb = document.createElement('div');
        tb.className = 'toast-box'; tb.id = 'toast-wrapper';
        tb.setAttribute('aria-live', 'polite');
        document.body.appendChild(tb);

        // عدّاد الفحوصات: بيزيد فعلياً مع كل اختبار/تحليل بتعمله (مش رقم عشوائي)
        const counter = document.getElementById('cyber-counter');
        if (counter) counter.textContent = Number(store.get('scans', 0)).toLocaleString('ar-EG');

        // حالة الاتصال الحقيقية
        const netEl = document.getElementById('net-state');
        const syncNet = () => {
            if (!netEl) return;
            netEl.textContent = navigator.onLine ? 'متصل' : 'أوفلاين';
            netEl.style.color = navigator.onLine ? 'var(--terminal-green)' : 'var(--danger)';
        };
        window.addEventListener('online', syncNet); window.addEventListener('offline', syncNet); syncNet();

        // لودر الإقلاع: مرة واحدة في الجلسة بس
        let seen = false;
        try { seen = sessionStorage.getItem('romany:boot') === '1'; sessionStorage.setItem('romany:boot', '1'); } catch (_) { /* ignore */ }
        if (!seen && settings.get('fx')) {
            const l = document.createElement('div');
            l.id = 'site-loader';
            l.innerHTML = '<div class="cyber-spinner"></div><p>ROMANY_SYSTEMS_BOOTING...</p>';
            document.body.appendChild(l);
            setTimeout(() => { l.classList.add('hide'); setTimeout(() => l.remove(), 600); }, 900);
        }
    }

    function bumpScans() {
        const n = Number(store.get('scans', 0)) + 1;
        store.set('scans', n);
        const c = document.getElementById('cyber-counter');
        if (c) c.textContent = n.toLocaleString('ar-EG');
    }

    /* ---------- تثبيت التطبيق (PWA) ---------- */
    let deferredPrompt = null;
    const installListeners = [];
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); deferredPrompt = e;
        installListeners.forEach(fn => fn(true));
    });
    window.addEventListener('appinstalled', () => { deferredPrompt = null; toast('تم تثبيت التطبيق 🎉', 'success'); installListeners.forEach(fn => fn(false)); });
    const install = {
        available() { return !!deferredPrompt; },
        isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
        onChange(fn) { installListeners.push(fn); },
        async prompt() {
            if (!deferredPrompt) return false;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null; installListeners.forEach(fn => fn(false));
            return outcome === 'accepted';
        }
    };

    /* ---------- Service Worker ---------- */
    function registerSW() {
        if (!('serviceWorker' in navigator)) return;
        if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed:', err));
    }

    /* ---------- Boot ---------- */
    document.body.classList.toggle('no-fx', !settings.get('fx'));
    buildShell();
    registerSW();

    window.Romany = { page: PAGE, store, settings, history, esc, sleep, toast, copyText, typeLines, bumpScans, install };
})();
