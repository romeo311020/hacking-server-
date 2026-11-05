# ROMANY Server Hacking Dashboard (PWA)

تطبيق ويب متعدد الصفحات، كل أداة في صفحة مستقلة، ويتثبّت كتطبيق على أندرويد/كروم/ديسكتوب ويشتغل أوفلاين.

## الهيكل
```
index.html        الرئيسية (الكروت بتتبني تلقائي من js/tools.js)
tester.html       اختبار السيرفرات (HLS / فيديو مباشر / Embed)   ?server=embad&url=...
extractor.html    محلّل الروابط (يوتيوب -> Embed، فحص الصفحة لروابط m3u8/mp4)
history.html      سجل الروابط
settings.html     الإعدادات + تثبيت التطبيق
_template.html    قالب لإنشاء صفحة جديدة
offline.html      صفحة تظهر لو مفيش نت والصفحة مش متخزّنة
manifest.json     ملف التطبيق (الاسم، الأيقونات، الاختصارات)
sw.js             Service Worker (الكاش والأوفلاين)
css/base.css      المتغيرات، الهيدر، التنقل، Toast
css/components.css  كروت، فورم، مشغّل، جداول (قابلة لإعادة الاستخدام)
js/tools.js       سجل الصفحات والسيرفرات  <- هنا بتضيف أي حاجة جديدة
js/app.js         نواة التطبيق  (window.Romany)
js/analyzer.js    تحليل الروابط    js/player.js  المشغّل الشامل
js/pages/*.js     سكريبت كل صفحة لوحده
```

## إزاي تضيف صفحة جديدة (3 خطوات)
1. انسخ `_template.html` باسم جديد (مثلاً `scanner.html`) وغيّر `data-page="scanner"`.
2. أضف سطر في `ROMANY_PAGES` داخل `js/tools.js`:
   `{ id:'scanner', title:'الفاحص', icon:'fa-radar', href:'scanner.html', nav:true, card:true, desc:'...' }`
3. أضف اسم الصفحة وسكريبتها في `SHELL_FILES` داخل `sw.js` وارفع `VERSION` (عشان تشتغل أوفلاين).

الهيدر والتنقل العلوي والسفلي وكارت الرئيسية بيتعملوا تلقائي. أدوات جاهزة: `Romany.toast`, `Romany.store`,
`Romany.history`, `Romany.copyText`, `Romany.typeLines`, `Romany.analyzer`, `Romany.createPlayer`.

## التشغيل
الـ PWA والـ Service Worker محتاجين `https` أو `localhost`، فمش هيشتغلوا بفتح الملف مباشرة (`file://`).
- محلياً: `python3 -m http.server 8080` ثم افتح `http://localhost:8080`
- أونلاين مجاناً: ارفع المجلد على GitHub Pages أو Netlify أو Cloudflare Pages.
- على أندرويد: افتح الرابط في كروم -> قائمة ⋮ -> «تثبيت التطبيق» (أو زر التثبيت في الإعدادات).

## ملاحظات
- الأيقونات والخطوط وـ hls.js بتتحمّل من CDN (نسخ ثابتة) وبتتخزّن في الكاش بعد أول تشغيل.
- «محلّل الروابط» بيعمل تحليل فعلي: يحدد النوع، يحوّل يوتيوب لـ Embed بالمعرّف الحقيقي، ويحاول يقرأ الصفحة
  (لو الموقع بيسمح بـ CORS). النسخة القديمة كانت بتولّد روابط وهمية، وتم إلغاء ده.
- لو عايز تحويل لتطبيق APK: استخدم Bubblewrap / PWABuilder على الرابط بعد رفعه.
