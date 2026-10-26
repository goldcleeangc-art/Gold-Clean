# متجر جولد كلين | Gold Clean Store ✨

متجر إلكتروني حديث ومتكامل لمنتجات المنظفات المتميزة مع لوحة تحكم إدارية متقدمة للتجار، دعم الدفع والشراء كضيف، وتكامل مباشر مع شركة الشحن (Bosta API) وقواعد بيانات Firebase Firestore.

---

## 📁 هيكلة المشروع (Project Architecture)

تم تنظيم المشروع بدقة لفصل ملفات الكود البرمجي الأساسية عن التوثيقات والسكربتات والأدوات المساعدة:

```text
Gold-Clean/
├── app/                          # مسارات وصفحات Next.js App Router وواجهات الـ API
│   ├── (store)                   # صفحات المتجر الرئيسية
│   │   ├── page.tsx              # الصفحة الرئيسية للمتجر
│   │   ├── layout.tsx            # التخطيط العام وتضمين الخطوط
│   │   ├── globals.css           # أنماط Tailwind CSS v4 والسمات العامة
│   │   └── not-found.tsx         # صفحة الخطأ 404
│   ├── products/[id]/            # صفحات المنتجات الديناميكية (SSR + SEO + JSON-LD)
│   ├── admin/                    # مسار لوحة تحكم التاجر المستقل (/admin)
│   └── api/                      # نقاط النهاية الخلفية (Backend API Routes)
│       ├── orders/checkout/      # التحقق من الأسعار وإنشاء الطلب وتأكيده
│       ├── shipping/             # تتبع وشحن البوليصات عبر Bosta
│       └── seo/                  # توليد بيانات محركات البحث
│
├── components/                   # مكونات واجهة المستخدم (مقسمة بدقة حسب الاختصاص)
│   ├── admin/                    # تبويبات ونوافذ لوحة الإدارة (Merchant Portal)
│   │   ├── MerchantPortal.tsx    # الواجهة الحاوية للوحة التاجر
│   │   ├── AdminComplaintsTab.tsx# إدارة وبحث شكاوى العملاء وحالاتها
│   │   ├── AdminOrdersTab.tsx    # إدارة ومتابعة الطلبات وتحديث حالاتها
│   │   ├── AdminProductsTab.tsx  # إضافة وتعديل وحذف المنتجات
│   │   ├── AdminOffersTab.tsx    # إدارة العروض الترويجية والخصومات
│   │   ├── AdminCategoriesTab.tsx# إدارة وتصنيف أقسام المنتجات
│   │   ├── AdminStatsTab.tsx     # الرسوم البيانية والإحصائيات والتحليلات
│   │   ├── AdminUsersTab.tsx     # إدارة المستخدمين وصلاحيات المشرفين
│   │   ├── PackingSlipModal.tsx  # بوالص الشحن وطباعة الفواتير
│   │   ├── DeleteOrdersModal.tsx # إدارة حذف الطلبات
│   │   └── FailedSyncModal.tsx   # متابعة الطلبات التي فشلت في المزامنة
│   ├── store/                    # واجهات تصفح المتجر للمستخدمين
│   │   ├── HomeView.tsx          # الواجهة الرئيسية والعروض المميزة
│   │   ├── ProductsView.tsx      # شبكة المنتجات والفلترة والتصنيف
│   │   ├── ProductDetailView.tsx # عرض تفاصيل المنتج وخيارات الحجم
│   │   ├── OffersView.tsx        # قسم الباقات والعروض الخاصة
│   │   ├── AboutView.tsx         # قسم من نحن ومعلومات المصنع والشهادات
│   │   └── ComplaintsSection.tsx # نموذج تسجيل ومتابعة شكاوى العملاء
│   ├── cart/                     # عناصر سلة المشتريات والدفع
│   │   ├── CartDrawer.tsx        # درج السلة الجانبي
│   │   ├── CheckoutModal.tsx     # نموذج إتمام الطلب وتأكيد الشحن
│   │   └── FlyToCartParticles.tsx# تأثيرات حركية عند إضافة المنتجات
│   ├── layout/                   # عناصر الهيكل والتنقل
│   │   ├── Navbar.tsx            # شريط التنقل العلوي والبحث والإشعارات
│   │   └── MobileBottomNav.tsx   # شريط التنقل السفلي للهواتف المحمولة
│   └── modals/                   # النوافذ المنبثقة العامة
│       ├── AuthModal.tsx         # تسجيل الدخول عبر Google
│       ├── OrderTrackerModal.tsx # نافذة تتبع مسار الشحنة برقم الهاتف
│       └── ProductDetailsModal.tsx # نظرة سريعة على المنتج
│
├── lib/                          # المكتبات المساعدة وإعدادات الخدمات الخارجية
│   ├── firebase.ts               # تهيئة Firebase SDK، Auth، و Firestore
│   ├── auth-server.ts            # التحقق الآمن من جلسات المشرفين بالخادم
│   ├── bosta.ts                  # دوال التكامل مع Bosta Shipping API
│   ├── shipping.ts               # معالجة أرقام الهواتف وحساب تكاليف الشحن
│   ├── rate-limit.ts             # حماية نقاط الـ API من هجمات الإغراق
│   ├── utils.ts                  # أدوات دمج فئات Tailwind CSS (clsx + twMerge)
│   └── types/                    # تعريفات TypeScript للأنواع والبيانات
│       ├── store.ts              # نماذج المنتجات، الطلبات، العروض، المستخدمين
│       └── complaint.ts          # نماذج الشكاوى والأولويات والتصنيفات
│
├── hooks/                        # خطافات React المخصصة (use-mobile.ts)
│
├── public/                       # الملفات الثابتة (شهادات الجودة ISO، الأيقونات)
│
├── docs/                         # التوثيقات الفنية والتقارير والملفات المرجعية
│   ├── security/                 # تقارير الأمان والحماية والتدقيق الفني
│   │   ├── EXECUTIVE_SECURITY_REPORT.md
│   │   ├── SECURITY_IMPROVEMENTS.md
│   │   ├── Executive_Security_Report_GoldClean.docx
│   │   └── تقرير_إداري_حماية_المتجر_GoldClean.docx
│   ├── integrations/             # أدلة التكامل مع الخدمات الخارجية
│   │   └── bosta/                # مرجع ومستندات تكامل شحن بوسطة
│   └── archive/                  # الأرشيف والنسخ الاحتياطية التاريخية
│       ├── firestore.rules.old   # نسخة احتياطية من قواعد Firestore السابقة
│       └── banner-preview.png    # صور ومعاينات سابقة
│
├── scripts/                      # سكربتات الأتمتة والتوليد والمعالجة
│   ├── reports/                  # توليد تقارير الأداء والشكاوى (Python + HTML)
│   └── tools/                    # أدوات تحويل المستندات والتقارير الإدارية (docx)
│
├── firestore.rules               # قواعد الأمان المحدثة والنشطة لقاعدة Firestore
├── firebase-applet-config.json   # إعدادات Firebase الاحتياطية أثناء البناء
├── firebase-blueprint.json       # مخطط البيانات وتوصيف الكيانات
├── metadata.json                 # بيانات تعريف التطبيق
├── next.config.ts                # إعدادات وتكوين Next.js
├── tsconfig.json                 # إعدادات TypeScript مع مسارات التحويل (@/*)
├── package.json                  # الاعتماديات وأوامر التشغيل
└── README.md                     # دليل المشروع وهيكلته
```

---

## 🚀 التقنيات المستخدمة (Tech Stack)

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion (Framer Motion v12)](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / Database**: [Firebase Firestore & Authentication](https://firebase.google.com/)
- **Shipping Integration**: [Bosta Shipping API](https://bosta.co/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🛠️ أوامر التشغيل (Available Scripts)

```bash
# تشغيل خادم التطوير المحلي
npm run dev

# بناء المشروع لبيئة الإنتاج والتحقق من الأخطاء
npm run build

# تشغيل بيئة الإنتاج محلياً بعد البناء
npm run start

# فحص المعايير البرمجية
npm run lint
```

---

## 🔒 الأمان وضبط الصلاحيات

- **حماية مسار الإدارة (`/admin`)**: التحقق من صلاحيات المدير عبر `auth-server.ts` لمنع الوصول غير المصرح.
- **التحقق من أسعار السلة**: التحقق من أسعار جميع المنتجات من السيرفر مباشرة قبل تأكيد الطلب لمنع أي تلاعب محلي.
- **التحكم بمعدل الطلبات (Rate Limiting)**: حماية نقاط نهاية الشحن وإنشاء الطلبات من الهجمات التكرارية.
- **قواعد أمان Firestore (`firestore.rules`)**: منع أي قراءة أو كتابة غير مصرح بها للبيانات الحساسة كبيانات العملاء والأرباح.
