/* صفحة الإعدادات */
(function () {
    const R = window.Romany;
    const $ = (id) => document.getElementById(id);

    const fx = $('set-fx'), con = $('set-console');
    fx.checked = R.settings.get('fx'); con.checked = R.settings.get('consoleFx');
    fx.onchange = () => R.settings.set('fx', fx.checked);
    con.onchange = () => R.settings.set('consoleFx', con.checked);

    const btn = $('install-btn'), hint = $('install-hint');
    function refresh() {
        if (R.install.isStandalone()) { btn.style.display = 'none'; hint.textContent = 'التطبيق مثبّت ويعمل كتطبيق مستقل ✔'; }
        else if (!R.install.available()) { btn.disabled = true; hint.textContent = 'من قائمة كروم (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'; }
        else { btn.disabled = false; }
    }
    R.install.onChange(refresh); refresh();
    btn.onclick = () => R.install.prompt();

    $('wipe-btn').onclick = () => {
        if (confirm('مسح كل البيانات المحفوظة؟')) { R.store.clearAll(); R.toast('تم المسح', 'info'); setTimeout(() => location.reload(), 600); }
    };
})();
