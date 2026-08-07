# Spanker

موقع حجز رحلات طيران مبني بـ Next.js 16، يدعم اللغتين العربية والإنجليزية مع تجربة RTL كاملة.

---

## التقنيات

- **Next.js 16** — App Router + React 19 + TypeScript
- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — مكونات واجهة مستخدم
- **Cairo** — Google Font (Latin + Arabic)

---

## البراند

| اللون | Hex | الاستخدام |
|-------|-----|-----------|
| أخضر | `#3D6833` | اللون الأساسي |
| أصفر | `#FDD12A` | لون داعم بنفس الأهمية |
| أزرق | `#2473BC` | ثانوي (بحر، سماء) |
| أبيض | `#FFFFFF` | خلفية الموقع |

---

## الصفحات والأقسام

- **Navbar** — شريط تنقل ثابت مع dropdowns وزر تبديل اللغة
- **Hero Banner** — شريحة رئيسية دوارة مع أداة بحث الرحلات
- **Flight Search Widget** — بحث برحلات One Way / Round Trip / Multi-City
- **Flying Services** — روابط سريعة للخدمات
- **Special Offers** — كاروسيل عروض الرحلات
- **Destinations** — شبكة الوجهات
- **Travel News** — أحدث المقالات
- **Mobile App Banner** — قسم تحميل التطبيق
- **Footer** — روابط وتواصل

---

## تشغيل المشروع

```bash
npm install
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000)

---

## اللغات

الموقع يدعم العربية (RTL) والإنجليزية (LTR) — العربية هي اللغة الافتراضية. يمكن التبديل من زر اللغة في الـ Navbar، ويُحفظ الاختيار في localStorage.
