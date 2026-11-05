/* صفحة السجل */
(function () {
    const R = window.Romany;
    const list = document.getElementById('history-list');

    function render() {
        const items = R.history.list();
        if (!items.length) {
            list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i>لسه مفيش حاجة هنا — جرّب تختبر أو تحلّل رابط.</div>';
            return;
        }
        list.innerHTML = '';
        items.forEach(e => {
            const row = document.createElement('div'); row.className = 'row-item';
            const icon = e.type === 'test' ? 'fa-bolt-lightning' : 'fa-mask';
            const when = new Date(e.at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
            row.innerHTML = `<i class="fa-solid ${icon}"></i>
                <div class="row-main"><b>${R.esc(e.title || e.url)}</b><small>${R.esc(e.url)}</small><small style="direction:rtl">${R.esc(when)}</small></div>
                <div class="row-actions"></div>`;
            const act = row.querySelector('.row-actions');
            const mk = (cls, html, fn) => { const b = document.createElement('button'); b.className = cls; b.innerHTML = html; b.onclick = fn; act.appendChild(b); };
            mk('action-node-btn play', '<i class="fa-solid fa-play"></i>', () => location.href = 'tester.html?url=' + encodeURIComponent(e.url));
            mk('action-node-btn copy', '<i class="fa-solid fa-copy"></i>', () => R.copyText(e.url));
            mk('action-node-btn', '<i class="fa-solid fa-xmark"></i>', () => { R.history.remove(e.at); render(); });
            list.appendChild(row);
        });
    }

    document.getElementById('clear-btn').onclick = () => {
        if (!R.history.list().length) return;
        if (confirm('مسح كل السجل؟')) { R.history.clear(); render(); R.toast('تم مسح السجل', 'info'); }
    };
    render();
})();
