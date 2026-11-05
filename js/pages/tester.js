/* صفحة اختبار السيرفرات */
(function () {
    const R = window.Romany;
    const $ = (id) => document.getElementById(id);
    const input = $('stream-url-input');
    const wrapper = $('tester-video-wrapper');
    const consoleEl = $('tester-console');

    const player = R.createPlayer({
        wrapper, target: $('player-dynamic-target'), controls: $('custom-player-controls'),
        playIcon: $('media-play-icon'), bar: $('media-progress-bar'), time: $('player-time-display'), status: $('player-status')
    });

    /* السيرفر المختار من ?server= */
    const params = new URLSearchParams(location.search);
    const current = window.ROMANY_SERVERS.find(s => s.id === params.get('server'));
    if (current) {
        $('tester-title').textContent = 'اختبار فحص سيرفر: ' + current.name;
        document.title = 'اختبار ' + current.short + ' — ROMANY';
    }
    $('server-switch').innerHTML = window.ROMANY_SERVERS.map(s =>
        `<a class="ghost-btn" href="tester.html?server=${s.id}" style="${current && current.id === s.id ? 'border-color:var(--primary);color:var(--primary)' : ''}"><i class="fa-solid ${s.icon}"></i>${R.esc(s.short)}</a>`
    ).join('');

    /* رابط جاهز عن طريق ?url= (مثلاً من صفحة المحلّل أو السجل) */
    const preset = params.get('url');
    if (preset) { input.value = preset; setTimeout(run, 300); }

    async function run() {
        const raw = input.value.trim();
        if (!raw) return R.toast('اكتب أو الصق رابط السيرفر أولاً', 'error');

        const info = R.analyzer.analyze(raw);
        player.destroy(); wrapper.style.display = 'none';
        if (!info.valid) return R.toast(info.error, 'error');

        $('run-btn').disabled = true;
        $('tester-tag').textContent = 'SCANNING...';
        await R.typeLines(consoleEl, [
            `[+] Target: ${info.host}`,
            `[+] Protocol: ${info.protocol.toUpperCase()} | Type: ${info.kindLabel}`,
            `[+] Mounting stream onto ROMANY Engine...`
        ], 300);
        consoleEl.style.display = 'none';

        player.mount(info);
        info.notes.forEach(n => R.toast(n, 'info'));
        R.history.add({ type: 'test', title: current ? current.short : info.host, url: info.original, kind: info.kindLabel });
        R.bumpScans();
        $('tester-tag').textContent = 'STREAMING';
        $('run-btn').disabled = false;
    }

    $('run-btn').onclick = run;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    $('paste-btn').onclick = async () => {
        try { input.value = (await navigator.clipboard.readText()).trim(); input.focus(); }
        catch (_) { R.toast('اسمح للمتصفح بالوصول للحافظة أو الصق يدوي', 'info'); }
    };
    $('btn-play').onclick = () => player.toggle();
    $('btn-mute').onclick = () => player.mute($('mute-icon'));
    $('btn-full').onclick = () => player.fullscreen();
    $('timeline').onclick = (e) => player.seek(e);
    window.addEventListener('pagehide', () => player.destroy());
})();
