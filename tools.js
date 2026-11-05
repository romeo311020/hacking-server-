/* ==========================================================
   tools.js — سجل الصفحات والسيرفرات (المكان الوحيد اللي بتعدّل فيه
   عشان تضيف صفحة/أداة جديدة).

   إضافة صفحة جديدة:
     1) انسخ  _template.html  لاسم جديد، مثلاً  scanner.html
        وغيّر  data-page="scanner"  في وسم <body>.
     2) أضف سطر جديد في ROMANY_PAGES تحت بنفس الـ id.
     3) خلاص: هتظهر تلقائي في القائمة العلوية والسفلية وكروت الرئيسية.
   ========================================================== */

window.ROMANY_PAGES = [
    // nav: تظهر في شريط التنقل | card: تظهر ككارت في الصفحة الرئيسية
    { id: 'home',      title: 'الرئيسية',        icon: 'fa-house',       href: 'index.html',     nav: true,  card: false },
    { id: 'tester',    title: 'اختبار السيرفرات', icon: 'fa-bolt-lightning', href: 'tester.html', nav: true,  card: false },
    { id: 'extractor', title: 'محلّل الروابط',    icon: 'fa-mask',        href: 'extractor.html', nav: true,  card: true,
      accent: 'green', desc: 'تحليل الرابط واستخراج الـ Embed والمسارات المكشوفة في الصفحة' },
    { id: 'history',   title: 'السجل',            icon: 'fa-clock-rotate-left', href: 'history.html', nav: true, card: true,
      accent: 'orange', desc: 'كل الروابط اللي اختبرتها وحلّلتها محفوظة هنا' },
    { id: 'settings',  title: 'الإعدادات',        icon: 'fa-gear',        href: 'settings.html',  nav: true,  card: true,
      accent: 'purple', desc: 'التأثيرات، تثبيت التطبيق، ومسح البيانات' }
];

/* سيرفرات الاختبار — كل واحد بيفتح tester.html?server=<id> */
window.ROMANY_SERVERS = [
    { id: 'embad',    name: 'Embad Streaming Cloud', short: 'Embad',    icon: 'fa-bolt-lightning',
      desc: 'اختبار جودة الاتصال وتدفق البيانات' },
    { id: 'arabseed', name: 'Arab Seed Storage',     short: 'Arab Seed', icon: 'fa-database',
      desc: 'فحص استجابة الخوادم السحابية للمنصة' },
    { id: 'hls',      name: 'HLS Live Core',         short: 'HLS المباشر', icon: 'fa-satellite-dish',
      desc: 'تحليل بث بروتوكولات الـ M3U8 الفورية' }
];
