# توثيق تطبيق التحسينات الأمنية وحماية البيانات (Security & Permissions)
**مشروع متجر مصنع Gold Clean**  
**تاريخ التنفيذ:** 6 أكتوبر 2026

---

## 📌 الفهرس
1. [ملخص التحديثات الأمنية](#ملخص-التحديثات-الأمنية)
2. [قواعد الأمان لقاعدة البيانات (Firestore Rules)](#قواعد-الأمان-لقاعدة-البيانات-firestore-rules)
3. [نظام التحقق الأمني في الخادم (Server-Side Auth Verification)](#نظام-التحقق-الأمني-في-الخادم-server-side-auth-verification)
4. [نظام الحماية من الإغراق وتحديد المعدل (Rate Limiting)](#نظام-الحماية-من-الإغراق-وتحديد-المعدل-rate-limiting)
5. [حماية مسار شركة الشحن J&T Express](#حماية-مسار-شركة-الشحن-jt-express)
6. [حماية مسار الذكاء الاصطناعي لـ SEO](#حماية-مسار-الذكاء-الاصطناعي-لـ-seo)
7. [تحديثات واجهة المتجر (Client-Side Updates)](#تحديثات-واجهة-المتجر-client-side-updates)
8. [جدول مقارنة: قبل وبعد التحديثات](#جدول-مقارنة-قبل-وبعد-التحديثات)

---

## 1. ملخص التحديثات الأمنية

تم تنفيذ حزمة شاملة من الإجراءات الأمنية لإغلاق جميع الثغرات المحتملة في المشروع، وضمان حماية خصوصية العملاء، ومنع التلاعب بالأسعار أو استنزاف خدمات الربط الخارجي مع شركة الشحن **J&T Express** ومفاتيح الذكاء الاصطناعي **Google Gemini**.

---

## 2. قواعد الأمان لقاعدة البيانات (Firestore Rules)

**الملف المعدّل:** [`firestore.rules`](./firestore.rules)

### 🔴 الثغرات التي تم إغلاقها:
1. **ثغرة تعديل المنتجات والأسعار (`match /products/{productId}`)**:
   * **سابقاً:** كانت القاعدة تسمح بالتعديل المفتوح `allow update: if true;` لأي شخص بدون تسجيل دخول، مما كان يتيح لأي زائر التلاعب بأسعار المنتجات وأسمائها.
   * **حالياً:** تم حصر التعديل الكامل بالمدراء فقط (`isManager()`)، وتم إنشاء دالة تحقق `isOnlyRatingUpdate()` تتيح للمستخدمين فقط تعديل حقول التقييم (`ratingsMap`, `rating`, `reviewsCount`) مع فحص أن قيمة التقييم رقم بين 0 و 5.
   ```firestore
   function isOnlyRatingUpdate() {
     return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ratingsMap', 'rating', 'reviewsCount']) &&
            request.resource.data.rating is number &&
            request.resource.data.rating >= 0 &&
            request.resource.data.rating <= 5 &&
            request.resource.data.reviewsCount is number &&
            request.resource.data.reviewsCount >= 0;
   }

   match /products/{productId} {
     allow read: if true;
     allow create, delete: if isManager();
     allow update: if isManager() || isOnlyRatingUpdate();
   }
   ```

2. **ثغرة استخراج وتسريب طلبات الضيوف (`match /orders/{orderId}`)**:
   * **سابقاً:** كان الشرط `|| (resource.data.userId == 'guest')` موجوداً ضمن `allow read` العامة، مما كان يسمح لأي شخص بإجراء استعلام وتنزيل كافة بيانات طلبات الضيوف (أسماء العملاء، أرقام هواتفهم، عناوينهم بالتفصيل، والمنتجات).
   * **حالياً:** تم فصل صلاحيات القراءة إلى:
     - `allow list`: يسمح بالاستعلام والبحث الشامل فقط للمدراء والمستخدم المسجل لطلباته فقط. يُمنع منعاً باتاً استعلام كل طلبات الضيوف جماعياً.
     - `allow get`: يسمح بجلب وثيقة طلب محددة فقط في حال كان الضيف يملك معرّف الطلب الخاص به (`orderId`) والمحفوظ محلياً في متصفحه بعد إتمام الشراء، مما يحافظ على ميزة تتبع الطلب دون تعريض بيانات باقي العملاء.
   ```firestore
   match /orders/{orderId} {
     allow create: if isValidOrder(request.resource.data);
     allow list: if isManager() || (isSignedIn() && resource.data.userId == request.auth.uid);
     allow get: if isManager() || (isSignedIn() && resource.data.userId == request.auth.uid) || (resource.data.userId == 'guest');
     ...
   }
   ```

3. **تقييد صلاحية إلغاء الطلبات**:
   * تم تدقيق التعديل بحيث لا يستطيع المستخدم عند إلغاء طلبه سوى تعديل حقل `status` إلى `'cancelled'` دون إمكانية التلاعب بالأسعار أو تفاصيل الشحنة:
   ```firestore
   allow update: if isManager() || (
     isSignedIn() &&
     resource.data.userId == request.auth.uid && 
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']) &&
     request.resource.data.status == 'cancelled' &&
     resource.data.status != 'delivered'
   );
   ```

---

## 3. نظام التحقق الأمني في الخادم (Server-Side Auth Verification)

**الملف الجديد:** [`lib/auth-server.ts`](./lib/auth-server.ts)

* تم إنشاء وحدة تحقق أمنية مستقلة تعمل في بيئة Node.js / Next.js API Routes.
* تقوم بالتحقق من الـ `Authorization: Bearer <ID_TOKEN>` القادم من العميل باستخدام خدمة التحقق المعتمدة من Google (`oauth2.googleapis.com/tokeninfo`).
* تتأكد من صلاحيات المستخدم:
  1. مطابقة البريد الإلكتروني مع بريد الإدارة الرئيسي (`jalalmahmoud8000@gmail.com` أو المتغير `ADMIN_EMAIL`).
  2. أو التحقق من وثيقة المستخدم في مجموعة `users` بقاعدة البيانات والتأكد من امتلاكه لدور `manager` أو `admin`.

---

## 4. نظام الحماية من الإغراق وتحديد المعدل (Rate Limiting)

**الملف الجديد:** [`lib/rate-limit.ts`](./lib/rate-limit.ts)

* تم تطوير خوارزمية تحديد معدل الطلبات (In-memory sliding window rate limiter) خفيفة وعالية الكفاءة بدون أي مكتبات خارجية إضافية.
* تقوم بحساب عدد الطلبات لكل عنوان IP، وتسمح بحد أقصى للطلبات خلال فترة زمنية محددة لمنع هجمات حرمان الخدمة (DoS) وروبوتات الإغراق (Spam bots).
* تتضمن تنظيفاً دورياً تلقائياً في الذاكرة كل 5 دقائق لمنع استهلاك الذاكرة (Memory Leak Prevention).

---

## 5. حماية مسار شركة الشحن J&T Express

**الملف المعدّل:** [`app/api/shipping/create-order/route.ts`](./app/api/shipping/create-order/route.ts)

### 🔴 الإجراءات المنفذة:
1. **حماية العمليات الإدارية الخاصة بالشحن**:
   * عمليات تعديل البوليصة (`operateType === 2`) أو إعادة إصدار البوليصة (`forceRecreate: true`) أصبحت تشترط التحقق الأمني من هوية المدير عبر `verifyManagerAuth(req)`، وتُرجع `403 Forbidden` في حال عدم وجود صلاحية.
2. **الحماية من إغراق طلبات الشحن (Anti-Spam Rate Limit)**:
   * تم تطبيق حد أقصى للطلبات العادية بمعدل **15 طلباً لكل 10 دقائق** لكل عنوان IP. وإذا تجاوز الزائر هذا الحد يتم إرجاع كود `429 Too Many Requests`.
3. **التدقيق الصارم على بيانات العميل (Input Validation)**:
   * **الاسم**: ألا يقل عن حرفين.
   * **رقم الهاتف**: التحقق الصارم من أنه رقم محمول مصري صحيح مكون من 11 رقماً ويبدأ بـ `010` أو `011` أو `012` أو `015`، مع رفض الأرقام الوهمية قبل إرسالها لشركة الشحن.
   * **العنوان والمحافظة**: التأكد من وجود المحافظة والعنوان التفصيلي.
   * **المنتجات والقيمة**: التأكد من أن السلة تحتوي على منتجات وأن القيمة الإجمالية رقم موجب صحيح.

---

## 6. حماية مسار الذكاء الاصطناعي لـ SEO

**الملف المعدّل:** [`app/api/seo/route.ts`](./app/api/seo/route.ts)

* كان المسار سابقاً متاحاً لأي طلب عام، مما يتيح استنزاف رصيد مفتاح Google Gemini API.
* أصبح المسار محصناً باشتراط توثيق المدير عبر `verifyManagerAuth(req)`.
* أي استدعاء خارجي غير مسجل بحساب مشرف يتم رفضه فوراً بـ `403 Forbidden` قبل التواصل مع Gemini API.

---

## 7. تحديثات واجهة المتجر (Client-Side Updates)

**الملف المعدّل:** [`app/page.tsx`](./app/page.tsx)

1. **إرسال رمز التوثيق (Authorization Bearer Token)**:
   * تم تحديث دوال الإدارة لإرسال `getIdToken()` تلقائياً في ترويسة الطلب:
     - دالة المزامنة المفردة لشركة الشحن (`syncOrderWithShipping`).
     - دالة تحديث بوالص الشحن للكرتونات و SKUs (`updateShippingSkuForOrder`).
     - دالة المزامنة الجماعية للطلبات المعلقة (`handleBulkShippingSync`).
     - دالة توليد بيانات الـ SEO بالذكاء الاصطناعي (`handleGenerateSeo`).
2. **مركزية التحقق من بريد الإدارة**:
   * استبدال النصوص المكررة بالدالة المركزية `isUserMasterAdmin()`، مع دعم متغير البيئة `NEXT_PUBLIC_ADMIN_EMAIL`.

---

## 8. جدول مقارنة: قبل وبعد التحديثات

| العنصر | الحالة السابقة | الحالة بعد التحديث الأمني |
| :--- | :--- | :--- |
| **تعديل المنتجات والأسعار** | مفتوح للجميع (`allow update: if true;`) | محصور بالمدير فقط، والزوار مسموح لهم فقط بإرسال التقييمات. |
| **قراءة طلبات الضيوف** | أي زائر يستطيع تنزيل كل طلبات الضيوف دفعة واحدة. | ممنوع استخراج الطلبات جماعياً، وتتبع الطلب متاح فقط بالمعرّف المخصص. |
| **مسار شحن J&T Express** | مفتوح بدون أي فحص صلاحيات أو تحديد معدل. | محمي بنظام Rate Limiting وفحص صارم لأرقام الهواتف، وتعديل البوالص للمدير فقط. |
| **مسار Gemini SEO** | مفتوح للاستهلاك العام بدون قيود. | محمي برمز تحقق أمني وخاص بالمشرفين فقط. |
| **إلغاء الطلبات من المستخدم** | إمكانية تعديل بيانات إضافية أثناء الإلغاء. | محصور حصراً في تعديل حقل `status` إلى `cancelled`. |
| **بناء المشروع (Build & Types)** | خالي من الأخطاء. | مجاز بنجاح 100% مع `tsc --noEmit` و `npm run build`. |

---

✅ **تم اكتمال التنفيذ واختبار كافة التعديلات والتأكد من سلامة البناء في بيئة الإنتاج بنجاح.**
