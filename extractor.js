/* صفحة محلّل الروابط */
(function () {
    const R = window.Romany;
    const $ = (id) => document.getElementById(id);
    const input = $('raw-url-input');
    let lastInfo = null;

    const fill = $('extractor-line-fill'), loader = $('extractor-line-loader');
    const setPct = (p) => { fill.style.width = p + '%'; };

    async function run() {
        const raw = input.value.trim();
        if (!raw) return R.toast('ضع رابط الهدف أولاً', 'error');

        const out = $('extractor-output-panel');
        out.style.display = 'none'; $('found-box').style.display = 'none';
        const info = R.analyzer.analyze(raw);
        if (!info.valid) return R.toast(info.error, 'error');

        $('run-btn').disabled = true;
        loader.style.display = 'block'; setPct(10);
        const logs = [`[!] Target: ${info.original}`, `[!] Detected type: ${info.kindLabel}`];
        await R.typeLines($('extractor-console'), logs, 250); setPct(40);

        let scan = null;
        if ($('scan-toggle').checked && info.kind === 'page') {
            await R.typeLines($('extractor-console'), [...logs, '[!] Fetching page and scanning for media URLs...'], 0); setPct(60);
            scan = await R.analyzer.scanPage(info.original);
            const last = scan.ok ? `[+] Scan complete: ${scan.media.length} media / ${scan.frames.length} iframes` : { text: '[x] ' + scan.error, err: true };
            await R.typeLines($('extractor-console'), [...logs, '[!] Fetching page and scanning for media URLs...', last], 0);
        }
        setPct(100);
        await R.sleep(350);
        $('extractor-console').style.display = 'none'; loader.style.display = 'none';

        render(info, scan);
        R.history.add({ type: 'analyze', title: info.kindLabel + ' — ' + info.host, url: info.original, kind: info.kindLabel });
        R.bumpScans();
        $('run-btn').disabled = false;
    }

    function render(info, scan) {
        lastInfo = info;
        const out = $('extractor-output-panel');
        const result = info.embedUrl;
        $('final-extracted-url').textContent = result;
        $('out-title').className = 'output-title';
        $('out-title').querySelector('span').textContent = info.kind === 'youtube' ? 'تم تحويل الرابط لصيغة Embed' : 'تم تحليل الرابط';

        const rows = [['النوع', info.kindLabel], ['الدومين', info.host], ['البروتوكول', info.protocol]];
        if (info.videoId) rows.push(['معرّف الفيديو', info.videoId]);
        if (scan && !scan.ok) rows.push(['فحص الصفحة', scan.error]);
        $('info-table').innerHTML = rows.map(([k, v]) => `<tr><td>${R.esc(k)}</td><td>${R.esc(v)}</td></tr>`).join('');
        info.notes.forEach(n => R.toast(n, 'info'));

        const found = scan && scan.ok ? [...scan.media.map(u => ({ u, t: 'media' })), ...scan.frames.map(u => ({ u, t: 'frame' }))] : [];
        $('found-box').style.display = found.length ? 'block' : 'none';
        $('found-list').innerHTML = '';
        found.forEach(({ u, t }) => {
            const li = document.createElement('li');
            li.className = 'output-card';
            const url = document.createElement('div'); url.className = 'output-url'; url.textContent = u;
            const act = document.createElement('div'); act.className = 'card-actions';
            const test = document.createElement('a'); test.className = 'action-node-btn play';
            test.href = 'tester.html?url=' + encodeURIComponent(u); test.innerHTML = '<i class="fa-solid fa-play"></i> اختبار';
            const cp = document.createElement('button'); cp.className = 'action-node-btn copy';
            cp.innerHTML = '<i class="fa-solid fa-copy"></i>'; cp.onclick = () => R.copyText(u);
            act.append(test, cp); li.append(url, act); $('found-list').appendChild(li);
        });
        out.style.display = 'block';
    }

    $('run-btn').onclick = run;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    $('paste-btn').onclick = async () => {
        try { input.value = (await navigator.clipboard.readText()).trim(); input.focus(); }
        catch (_) { R.toast('اسمح للمتصفح بالوصول للحافظة أو الصق يدوي', 'info'); }
    };
    $('btn-copy').onclick = () => lastInfo && R.copyText(lastInfo.embedUrl);
    $('btn-open').onclick = () => lastInfo && window.open(lastInfo.embedUrl, '_blank', 'noopener');
    $('btn-test').onclick = () => lastInfo && (location.href = 'tester.html?url=' + encodeURIComponent(lastInfo.embedUrl));

    const preset = new URLSearchParams(location.search).get('url');
    if (preset) { input.value = preset; run(); }
})();
