/* الصفحة الرئيسية: الكروت بتتبني من tools.js تلقائي */
(function () {
    const grid = document.getElementById('home-grid');
    const { esc, install } = window.Romany;

    const cards = [];
    window.ROMANY_SERVERS.forEach(s => cards.push({
        href: `tester.html?server=${s.id}`, icon: s.icon, title: `تجربة سيرفر ${s.short}`, desc: s.desc, accent: ''
    }));
    window.ROMANY_PAGES.filter(p => p.card).forEach(p => cards.push({
        href: p.href, icon: p.icon, title: p.title, desc: p.desc || '', accent: p.accent || ''
    }));

    grid.innerHTML = cards.map(c => `
        <a class="premium-btn ${c.accent}" href="${c.href}">
            <i class="fa-solid ${c.icon}"></i>
            <h3>${esc(c.title)}</h3>
            <span>${esc(c.desc)}</span>
        </a>`).join('');

    const box = document.getElementById('install-box');
    const refresh = (can) => { box.style.display = can && !install.isStandalone() ? 'block' : 'none'; };
    install.onChange(refresh); refresh(install.available());
    document.getElementById('install-btn').onclick = () => install.prompt();
})();
