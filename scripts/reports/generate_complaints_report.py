import os
import subprocess

rc_p1 = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير قسم الشكاوى وخدمة العملاء - صفحة 1</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Noto Sans Arabic', Tahoma, sans-serif;
    width: 1200px;
    height: 1697px;
    background: #f8fafc;
    color: #0f172a;
    padding: 50px 60px;
    position: relative;
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
    border-radius: 22px;
    padding: 32px 40px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.25);
    margin-bottom: 25px;
  }
  .brand-title {
    font-size: 32px;
    font-weight: 900;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }
  .brand-sub {
    font-size: 14px;
    color: #c7d2fe;
    font-weight: 600;
  }
  .doc-meta {
    text-align: left;
    direction: ltr;
  }
  .badge {
    display: inline-block;
    background: rgba(251, 191, 36, 0.2);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fef08a;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 30px;
    margin-bottom: 6px;
  }
  .meta-text {
    font-size: 11px;
    color: #cbd5e1;
    font-family: monospace;
  }

  .title-section {
    background: #ffffff;
    border-radius: 18px;
    padding: 24px 32px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    margin-bottom: 22px;
  }
  .report-heading {
    font-size: 24px;
    font-weight: 800;
    color: #312e81;
    margin-bottom: 8px;
  }
  .report-desc {
    font-size: 14.5px;
    line-height: 1.7;
    color: #475569;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .metric-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
    position: relative;
    overflow: hidden;
  }
  .metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #6366f1;
  }
  .metric-val {
    font-size: 36px;
    font-weight: 900;
    color: #4338ca;
    line-height: 1.1;
    margin-bottom: 6px;
  }
  .metric-label {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .metric-sub {
    font-size: 11px;
    color: #64748b;
  }

  .comp-section {
    background: #ffffff;
    border-radius: 18px;
    padding: 24px 28px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    margin-bottom: 22px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 20px;
    background: #6366f1;
    border-radius: 4px;
  }

  .comp-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
  }
  .comp-table th {
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-align: right;
  }
  .comp-row {
    background: #f8fafc;
    border-radius: 10px;
  }
  .comp-row td {
    padding: 13px 14px;
    font-size: 13.5px;
    vertical-align: middle;
  }
  .comp-row td:first-child {
    font-weight: 800;
    color: #1e293b;
    width: 25%;
    border-radius: 0 10px 10px 0;
    border-right: 4px solid #6366f1;
  }
  .comp-old {
    color: #b91c1c;
    background: #fef2f2;
    width: 37%;
    border-left: 1px solid #fee2e2;
  }
  .comp-new {
    color: #3730a3;
    background: #eef2ff;
    width: 38%;
    font-weight: 700;
    border-radius: 10px 0 0 10px;
  }

  .pillars-section {
    background: #ffffff;
    border-radius: 18px;
    padding: 22px 28px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
  }
  .pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .pillar-box {
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .pillar-num {
    font-size: 12px;
    font-weight: 900;
    color: #4338ca;
    margin-bottom: 4px;
  }
  .pillar-title {
    font-size: 14px;
    font-weight: 800;
    color: #312e81;
    margin-bottom: 4px;
  }
  .pillar-text {
    font-size: 12px;
    color: #4338ca;
    line-height: 1.5;
  }

  .footer {
    position: absolute;
    bottom: 35px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e2e8f0;
    font-size: 11.5px;
    color: #64748b;
  }
</style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand-title">💬 جولد كلين | Gold Clean</div>
      <div class="brand-sub">منظومة خدمة العملاء، إدارة الشكاوى، وضمان الجودة</div>
    </div>
    <div class="doc-meta">
      <div class="badge">تقرير تنفيذي لإدارة الشركة</div>
      <div class="meta-text">ID: GC-CS-2026-03 | DATE: 2026-10-19</div>
      <div class="meta-text">STATUS: DEPLOYED & OPERATIONAL (100%)</div>
    </div>
  </div>

  <div class="title-section">
    <h1 class="report-heading">منظومة معالجة الشكاوى والمقترحات وحماية سمعة العلامة التجارية</h1>
    <p class="report-desc">
      لترسيخ ثقة عملاء <strong>جولد كلين</strong> وحماية اسم الشركة من أي تقييمات سلبية، تم بناء وتشغيل <strong>قسم متكامل لاستقبال الشكاوى والمقترحات</strong>. يتيح النظام للعميل تسجيل مشكلته والحصول على رقم مرجعي رسمي ومتابعة الحل لحظة بلحظة، كما يوفر للإدارة شاشة مركزية لفرز المشكلات وسرعة الرد على العميل عبر الهاتف أو الواتساب بنقرة واحدة.
    </p>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-val">100%</div>
      <div class="metric-label">احتواء الشكاوى داخلياً</div>
      <div class="metric-sub">منع نشر المشاكل على السوشيال ميديا</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">7</div>
      <div class="metric-label">تصنيفات متخصصة</div>
      <div class="metric-sub">فرز مباشر للمشاكل والمقترحات</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">تتبع حي</div>
      <div class="metric-label">متابعة التذكرة بالرقم المرجعي</div>
      <div class="metric-sub">إشعار العميل برد الإدارة فور اعتماده</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">1 نقرة</div>
      <div class="metric-label">تواصل مباشر عبر الواتساب</div>
      <div class="metric-sub">حل فوري وودي يرفع ولاء العميل</div>
    </div>
  </div>

  <div class="comp-section">
    <h2 class="section-title">المقارنة المباشرة: إدارة خدمة العملاء والشكاوى</h2>
    <table class="comp-table">
      <thead>
        <tr>
          <th>عنصر التقييم</th>
          <th>قبل تفعيل القسم (الوضع السابق)</th>
          <th>بعد تفعيل القسم (الوضع الحالي المعتمد)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="comp-row">
          <td>طريقة استقبال شكوى العميل</td>
          <td class="comp-old">رسائل عشوائية متفرقة على صفحات فيسبوك والواتساب بدون توثيق أو متابعة.</td>
          <td class="comp-new">بوابة رسمية داخل المتجر تصدر رقم تذكرة مرجعي وتلزم فريق العمل بالحل.</td>
        </tr>
        <tr class="comp-row">
          <td>تحديد مسؤولية الخلل</td>
          <td class="comp-old">صعوبة معرفة هل المشكلة من مندوب الشحن أم من عمال التعبئة بالمخزن.</td>
          <td class="comp-new">ربط مباشر برقم الطلب وتصنيف محدد (جودة، شحن، نقص، استبدال) يكشف المقصر.</td>
        </tr>
        <tr class="comp-row">
          <td>متابعة العميل لحالة مشكلته</td>
          <td class="comp-old">قلق العميل وشعوره بالإهمال مما يدفعه لكتابة تعليقات غاضبة تحذر الآخرين.</td>
          <td class="comp-new">شاشة تتبع بالرقم المرجعي أو الهاتف تظهر حالة التذكرة والرد الرسمي للمتجر.</td>
        </tr>
        <tr class="comp-row">
          <td>سرعة إجراءات الحل والرد</td>
          <td class="comp-old">تأخر الردود لأيام وضياع تفاصيل الشكوى بين الموظفين.</td>
          <td class="comp-new">لوحة تحكم إدارية تمكن الموظف من الرد وحل الشكوى والتواصل بواتساب فوري.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="pillars-section">
    <h2 class="section-title">المزايا التشغيلية الثلاث لمنظومة الشكاوى</h2>
    <div class="pillars-grid">
      <div class="pillar-box">
        <div class="pillar-num">الميزة 01</div>
        <div class="pillar-title">توليد أكواد تذاكر رسمية</div>
        <div class="pillar-text">إصدار كود فريد لكل تذكرة (مثل GC-CMP-82914) يسهل تداولها بين العميل وفريق الدعم الفني.</div>
      </div>
      <div class="pillar-box">
        <div class="pillar-num">الميزة 02</div>
        <div class="pillar-title">أولوية خاصة للحالات العاجلة</div>
        <div class="pillar-text">تمييز الشكاوى العاجلة لسرعة تدخل الإدارة قبل حدوث أي أزمة أو رفض لاستلام الشحنة.</div>
      </div>
      <div class="pillar-box">
        <div class="pillar-num">الميزة 03</div>
        <div class="pillar-title">تواصل تفاعلي بنقرة واحدة</div>
        <div class="pillar-text">زر اتصال هاتفي مباشر وزر واتساب مجهز بالرد يتيح للموظف معالجة الأمر بودية واحتراف.</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>شركة جولد كلين لمستحضرات النظافة | وثيقة إدارية رسمية سرية للاستخدام الداخلي</span>
    <span>صفحة 1 من 2</span>
  </div>

</body>
</html>
"""

rc_p2 = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير قسم الشكاوى وخدمة العملاء - صفحة 2</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Noto Sans Arabic', Tahoma, sans-serif;
    width: 1200px;
    height: 1697px;
    background: #f8fafc;
    color: #0f172a;
    padding: 50px 60px;
    position: relative;
    overflow: hidden;
  }

  .sub-header {
    background: #ffffff;
    border-radius: 20px;
    padding: 24px 35px;
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
  }
  .sub-title {
    font-size: 22px;
    font-weight: 800;
    color: #312e81;
  }
  .tag {
    background: #eef2ff;
    color: #4338ca;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }
  .benefit-card {
    background: #ffffff;
    border-radius: 18px;
    padding: 24px 26px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  }
  .benefit-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .benefit-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #eef2ff;
    color: #4338ca;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .benefit-title {
    font-size: 16.5px;
    font-weight: 800;
    color: #0f172a;
  }
  .benefit-body {
    font-size: 13.5px;
    line-height: 1.7;
    color: #475569;
  }

  .impact-section {
    background: #ffffff;
    border-radius: 18px;
    padding: 24px 30px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
  }
  .impact-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .impact-title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 20px;
    background: #6366f1;
    border-radius: 4px;
  }
  .impact-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .impact-box {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
  }
  .impact-role {
    font-size: 13.5px;
    font-weight: 800;
    color: #312e81;
    margin-bottom: 6px;
  }
  .impact-desc {
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
  }

  .recommendations-section {
    background: #ffffff;
    border-radius: 18px;
    padding: 22px 30px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
  }
  .rec-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f8fafc;
    padding: 12px 14px;
    border-radius: 10px;
    border-right: 3px solid #6366f1;
  }
  .rec-text {
    font-size: 12.5px;
    color: #334155;
    line-height: 1.5;
  }

  .signoff-box {
    background: linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%);
    border: 1px solid #c7d2fe;
    border-radius: 18px;
    padding: 20px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .signoff-text h4 {
    font-size: 16px;
    font-weight: 800;
    color: #3730a3;
    margin-bottom: 4px;
  }
  .signoff-text p {
    font-size: 12.5px;
    color: #334155;
  }
  .stamp {
    background: #ffffff;
    border: 2px dashed #4f46e5;
    color: #4f46e5;
    padding: 8px 20px;
    border-radius: 10px;
    font-weight: 900;
    font-size: 13px;
    text-align: center;
  }

  .footer {
    position: absolute;
    bottom: 35px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e2e8f0;
    font-size: 11.5px;
    color: #64748b;
  }
</style>
</head>
<body>

  <div class="sub-header">
    <div class="sub-title">العوائد التجارية والإدارية لنظام خدمة العملاء المتطور</div>
    <div class="tag">جولد كلين | ولاء العملاء وضمان الجودة</div>
  </div>

  <div class="benefits-grid">
    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">🛡️</div>
        <div class="benefit-title">حماية سمعة البراند على السوشيال ميديا</div>
      </div>
      <div class="benefit-body">
        العميل الغاضب إذا لم يجد وسيلة رسمية لحل مشكلته داخل المتجر، سيتجه للتعليق على إعلانات الشركة في فيسبوك وتيك توك، مما يضر بالمبيعات. وجود قسم الشكاوى يمتص غضب العميل ويحل مشكلته في بيئة داخلية آمنة.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">🔁</div>
        <div class="benefit-title">تحويل الشكوى إلى فرصة ولاء وإعادة شراء</div>
      </div>
      <div class="benefit-body">
        تشير دراسات التجارة الإلكترونية إلى أن 70% من العملاء الذين تُحل مشكلاتهم بسرعة واحترافية يصبحون أكثر ولاءً للعلامة التجارية من العملاء الذين لم تواجههم أي مشكلة، ويعودون للشراء مراراً وتكراراً.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">🔍</div>
        <div class="benefit-title">كشف مبكر لعيوب التغليف أو شركات الشحن</div>
      </div>
      <div class="benefit-body">
        بفضل التصنيفات السبعة، تستطيع إدارة جولد كلين معرفة ما إذا كانت هناك عبوة معينة بها تسريب متكرر، أو مندوب شحن يتأخر على الزبائن، مما يتيح للإدارة معالجة الخلل مع المصنع أو شركة الشحن فوراً وتفادي الخسائر.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">⏱️</div>
        <div class="benefit-title">توفير الوقت وتنظيم عمل فريق خدمة العملاء</div>
      </div>
      <div class="benefit-body">
        بدلاً من تشتت موظفي خدمة العملاء في محادثات هاتفية طويلة ورسائل مفقودة، أصبح لكل مشكلة ملف وتاريخ ورقم طلب ورقم هاتف، مع إمكانية الرد بضغطة زر وإغلاق التذكرة فور إرضاء العميل.
      </div>
    </div>
  </div>

  <div class="impact-section">
    <h2 class="impact-title">كيف يدعم النظام أقسام الشركة المختلفة؟</h2>
    <div class="impact-row">
      <div class="impact-box">
        <div class="impact-role">👔 الإدارة العامة</div>
        <div class="impact-desc">رؤية كاملة لمستوى رضا العملاء، ومراقبة جودة المنتجات وسرعة استجابة موظفي الدعم.</div>
      </div>
      <div class="impact-box">
        <div class="impact-role">📦 المخازن والجودة</div>
        <div class="impact-desc">معرفة دقيقة لأي صنف به نقص أو تلف أثناء التعبئة لمنع تكرار الخطأ وتطوير التغليف.</div>
      </div>
      <div class="impact-box">
        <div class="impact-role">❤️ متسوقو جولد كلين</div>
        <div class="impact-desc">شعور تام بالاهتمام والاحترام، وحق كامل في استبدال المنتجات أو حل أي مشكلة بسرعة.</div>
      </div>
    </div>
  </div>

  <div class="recommendations-section">
    <h2 class="impact-title">توصيات تشغيلية لفريق خدمة العملاء</h2>
    <div class="rec-grid">
      <div class="rec-item">
        <span style="font-weight:900; color:#4f46e5;">✓</span>
        <div class="rec-text"><strong>سرعة الرد على التذاكر العاجلة:</strong> معالجة الشكاوى ذات الأولوية العاجلة خلال أقل من 3 ساعات لضمان أعلى مستويات الرضا.</div>
      </div>
      <div class="rec-item">
        <span style="font-weight:900; color:#4f46e5;">✓</span>
        <div class="rec-text"><strong>استخدام الرد عبر الواتساب:</strong> الاستفادة من رسالة الواتساب المجهزة للتواصل الودود وإرسال البدائل فوراً للعميل.</div>
      </div>
    </div>
  </div>

  <div class="signoff-box">
    <div class="signoff-text">
      <h4>جاهزية النظام والتشغيل الفعلي</h4>
      <p>منظومة الشكاوى والتتبع مفعلة وتعمل بالكامل داخل المتجر وفي لوحة تحكم الإدارة.</p>
    </div>
    <div class="stamp">
      مفعل ويعمل 100%<br>
      <small style="font-size:9.5px; font-weight:normal;">FULLY OPERATIONAL & LIVE</small>
    </div>
  </div>

  <div class="footer">
    <span>شركة جولد كلين لمستحضرات النظافة | وثيقة إدارية رسمية سرية للاستخدام الداخلي</span>
    <span>صفحة 2 من 2</span>
  </div>

</body>
</html>
"""

base_dir = "/home/jalal/Projects/Gold-Clean/reports"
with open(os.path.join(base_dir, "report_complaints_p1.html"), "w", encoding="utf-8") as f:
    f.write(rc_p1)
with open(os.path.join(base_dir, "report_complaints_p2.html"), "w", encoding="utf-8") as f:
    f.write(rc_p2)

print("Complaints HTML files generated successfully!")
