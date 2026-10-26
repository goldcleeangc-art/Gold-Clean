import subprocess
import os

# Create HTML for Report 1: Performance & Architecture (Page 1 & Page 2)
# Create HTML for Report 2: Security & Checkout (Page 1 & Page 2)

report1_p1 = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير تحسين سرعة وكفاءة المتجر - صفحة 1</title>
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

  /* Header */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    border-radius: 24px;
    padding: 35px 40px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    margin-bottom: 30px;
  }
  .brand-title {
    font-size: 32px;
    font-weight: 900;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }
  .brand-sub {
    font-size: 14px;
    color: #93c5fd;
    font-weight: 600;
  }
  .doc-meta {
    text-align: left;
    direction: ltr;
  }
  .badge {
    display: inline-block;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fef08a;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 30px;
    margin-bottom: 8px;
  }
  .meta-text {
    font-size: 12px;
    color: #cbd5e1;
    font-family: monospace;
  }

  /* Title Box */
  .title-section {
    background: #ffffff;
    border-radius: 20px;
    padding: 28px 35px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
  }
  .report-heading {
    font-size: 26px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 10px;
  }
  .report-desc {
    font-size: 15px;
    line-height: 1.7;
    color: #475569;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 30px;
  }
  .metric-card {
    background: #ffffff;
    border-radius: 18px;
    padding: 22px 18px;
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
    background: #2563eb;
  }
  .metric-val {
    font-size: 38px;
    font-weight: 900;
    color: #1e3a8a;
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

  /* Comparison Section */
  .comp-section {
    background: #ffffff;
    border-radius: 20px;
    padding: 28px 32px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
  }
  .section-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 24px;
    background: #2563eb;
    border-radius: 4px;
  }

  .comp-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 10px;
  }
  .comp-table th {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    text-align: right;
  }
  .comp-row {
    background: #f8fafc;
    border-radius: 12px;
    transition: all 0.2s;
  }
  .comp-row td {
    padding: 16px;
    font-size: 14px;
    vertical-align: middle;
  }
  .comp-row td:first-child {
    font-weight: 800;
    color: #1e293b;
    width: 25%;
    border-radius: 0 12px 12px 0;
    border-right: 4px solid #94a3b8;
  }
  .comp-old {
    color: #b91c1c;
    background: #fef2f2;
    width: 37%;
    border-left: 1px solid #fee2e2;
  }
  .comp-new {
    color: #15803d;
    background: #f0fdf4;
    width: 38%;
    font-weight: 700;
    border-radius: 12px 0 0 12px;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 40px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    color: #64748b;
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-title">✨ جولد كلين | Gold Clean</div>
      <div class="brand-sub">الريادة في صناعة وتوزيع المنظفات المنزلية والصناعية</div>
    </div>
    <div class="doc-meta">
      <div class="badge">تقرير تنفيذي لإدارة الشركة</div>
      <div class="meta-text">ID: GC-PERF-2026-01 | DATE: 2026-10-19</div>
      <div class="meta-text">STATUS: DEPLOYED & LIVE (100%)</div>
    </div>
  </div>

  <!-- Title Section -->
  <div class="title-section">
    <h1 class="report-heading">المرحلة الأولى: تسريع المتجر الإلكتروني وفصل بوابة الإدارة</h1>
    <p class="report-desc">
      بهدف تقديم تجربة شراء فائقة السلاسة لعملاء شركة <strong>جولد كلين</strong> وضمان عدم ضياع أي عميل أثناء تصفحه للمنتجات عبر الموبايل، تم تنفيذ تطوير جذري لبنية المتجر. تم إلغاء التحميل الزائد عن العملاء وعزل شاشات الإدارة والمخازن في بوابة سرية ومستقلة، مما جعل المتجر يفتح في أجزاء من الثانية.
    </p>
  </div>

  <!-- Metrics Grid -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-val">85.6%</div>
      <div class="metric-label">تقليص حجم الصفحة</div>
      <div class="metric-sub">توفير هائل في باقة إنترنت الزبائن</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">3x</div>
      <div class="metric-label">زيادة سرعة التصفح</div>
      <div class="metric-sub">استجابة فورية بدون أي انتظار</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">100%</div>
      <div class="metric-label">استقلالية بوابة الإدارة</div>
      <div class="metric-sub">عزل تام لشاشات التحكم بالرابط /admin</div>
    </div>
    <div class="metric-card">
      <div class="metric-val">0</div>
      <div class="metric-label">أخطاء برمجية أو تعطيل</div>
      <div class="metric-sub">فحص كامل واعتماد نهائي 100%</div>
    </div>
  </div>

  <!-- Comparison Table -->
  <div class="comp-section">
    <h2 class="section-title">المقارنة المباشرة: كيف كان المتجر وكيف أصبح الآن؟</h2>
    <table class="comp-table">
      <thead>
        <tr>
          <th>عنصر التقييم</th>
          <th>قبل التحديث (الوضع السابق)</th>
          <th>بعد التحديث (الوضع الحالي المعتمد)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="comp-row">
          <td>سرعة فتح المتجر للمشتري</td>
          <td class="comp-old">بطء ملحوظ وثوانٍ إضافية في التحميل تؤدي لملل الزبون وخروجه قبل الشراء.</td>
          <td class="comp-new">فتح فوري بلمسة واحدة خلال أجزاء من الثانية حتى مع شبكات الموبايل الضعيفة.</td>
        </tr>
        <tr class="comp-row">
          <td>استهلاك باقة الإنترنت</td>
          <td class="comp-old">تحميل ملفات كبيرة وثقيلة تستهلك باقة إنترنت العميل بدون داعٍ.</td>
          <td class="comp-new">تخفيض 85% من حجم البيانات، مما يجعل التصفح خفيفاً وموفراً جداً للعملاء.</td>
        </tr>
        <tr class="comp-row">
          <td>شاشات الإدارة والمخازن</td>
          <td class="comp-old">مدمجة في نفس صفحة المتجر، مما يثقل الموقع ويعرض الإدارة للبطء.</td>
          <td class="comp-new">بوابة مستقلة ومنفصلة تماماً (/admin) مخصصة فقط للمديرين والموظفين.</td>
        </tr>
        <tr class="comp-row">
          <td>استقرار الموقع في الإعلانات</td>
          <td class="comp-old">احتمالية تعليق الموقع أو بطئه عند دخول أعداد كبيرة مع الحملات الممولة.</td>
          <td class="comp-new">أقصى درجات الثبات والتحمل لآلاف الزوار المتزامنين في لحظة واحدة.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>شركة جولد كلين لمستحضرات النظافة | وثيقة إدارية رسمية سرية للاستخدام الداخلي</span>
    <span>صفحة 1 من 2</span>
  </div>

</body>
</html>
"""

report1_p2 = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير تحسين سرعة وكفاءة المتجر - صفحة 2</title>
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

  /* Sub Header */
  .sub-header {
    background: #ffffff;
    border-radius: 20px;
    padding: 24px 35px;
    border: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 28px;
  }
  .sub-title {
    font-size: 22px;
    font-weight: 800;
    color: #1e3a8a;
  }
  .tag {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
  }

  /* Benefits Grid */
  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
    margin-bottom: 28px;
  }
  .benefit-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 26px 28px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
  }
  .benefit-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .benefit-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
  }
  .benefit-title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
  }
  .benefit-body {
    font-size: 14px;
    line-height: 1.7;
    color: #475569;
  }

  /* Stakeholder Impact */
  .impact-section {
    background: #ffffff;
    border-radius: 20px;
    padding: 26px 32px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 28px;
  }
  .impact-title {
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .impact-title::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 22px;
    background: #2563eb;
    border-radius: 4px;
  }
  .impact-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .impact-box {
    background: #f8fafc;
    border-radius: 14px;
    padding: 18px;
    border: 1px solid #e2e8f0;
  }
  .impact-role {
    font-size: 14px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 6px;
  }
  .impact-desc {
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
  }

  /* Signoff Box */
  .signoff-box {
    background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
    border: 1px solid #bbf7d0;
    border-radius: 20px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .signoff-text h4 {
    font-size: 17px;
    font-weight: 800;
    color: #15803d;
    margin-bottom: 4px;
  }
  .signoff-text p {
    font-size: 13px;
    color: #334155;
  }
  .stamp {
    background: #ffffff;
    border: 2px dashed #16a34a;
    color: #16a34a;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 14px;
    letter-spacing: 0.5px;
    text-align: center;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 40px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    color: #64748b;
  }
</style>
</head>
<body>

  <!-- Sub Header -->
  <div class="sub-header">
    <div class="sub-title">العوائد الاستثمارية والتجارية لمشروع تسريع المتجر</div>
    <div class="tag">جولد كلين | الأثر التشغيلي والمبيعات</div>
  </div>

  <!-- Benefits Grid -->
  <div class="benefits-grid">
    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">📈</div>
        <div class="benefit-title">زيادة فورية في إتمام عمليات الشراء</div>
      </div>
      <div class="benefit-body">
        أثبتت الإحصائيات أن كل ثانية تأخير في فتح صفحة المنتج تؤدي لفقدان 20% من الزبائن. التحديث الجديد يضمن وصول العميل إلى منتجات جولد كلين فور ضغطه على الإعلان، مما يرفع نسبة المبيعات ويمنع هدر ميزانيات الإعلانات.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">📱</div>
        <div class="benefit-title">مراعاة باقات إنترنت الموبايل في مصر</div>
      </div>
      <div class="benefit-body">
        أكثر من 90% من عملاء المتجر يشترون عبر الهواتف الذكية وباقات الداتا المتنقلة. تقليص حجم الموقع بنسبة 85% يوفر باقة العميل ويجعل التصفح خفيفاً وسريعاً، مما يعطي انطباعاً راقياً بالاحترافية ويشجع العميل على تكرار الطلب.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">🔒</div>
        <div class="benefit-title">حماية وسرية بيانات الإدارة والمخازن</div>
      </div>
      <div class="benefit-body">
        عزل شاشات الإدارة في بوابة مستقلة يضمن عدم تسريب أي أرقام مبيعات أو معلومات مخزنية للمتصفح العام، ويوفر لمسؤولي الشركة لوحة تحكم مخصصة لإدارة البضائع والأسعار دون التأثير على سرعة المتجر العام.
      </div>
    </div>

    <div class="benefit-card">
      <div class="benefit-header">
        <div class="benefit-icon">⚙️</div>
        <div class="benefit-title">مرونة وسهولة في إضافة عروض جديدة</div>
      </div>
      <div class="benefit-body">
        أصبح كود المتجر مقسماً بطريقة ذكية وعصرية؛ مما يسمح لفريق العمل بإضافة باقات توفير جديدة، وتعديل الصور، وإطلاق خصومات الأعياد والمواسم في دقائق معدودة دون المساس باستقرار الموقع.
      </div>
    </div>
  </div>

  <!-- Stakeholder Impact -->
  <div class="impact-section">
    <h2 class="impact-title">كيف ينعكس هذا التحسين على منظومة العمل؟</h2>
    <div class="impact-row">
      <div class="impact-box">
        <div class="impact-role">🎯 فريق التسويق والإعلانات</div>
        <div class="impact-desc">انخفاض تكلفة الحصول على الطلب (CPA) نتيجة عدم ارتداد الزوار وزيادة كفاءة الحملات الإعلانية على فيسبوك وتيك توك.</div>
      </div>
      <div class="impact-box">
        <div class="impact-role">📦 مسؤولو المبيعات والإدارة</div>
        <div class="impact-desc">لوحة تحكم إدارية سريعة وخفيفة تفتح بشكل مستقل، وتسهل متابعة الطلبات وتقارير المخزون بفاعلية تامة.</div>
      </div>
      <div class="impact-box">
        <div class="impact-role">⭐ عملاء جولد كلين</div>
        <div class="impact-desc">تصفح ممتع وفوري لكافة المنظفات والعروض مع سهولة فائقة في إتمام عملية الشراء بنقرات سريعة وبدون انتظار.</div>
      </div>
    </div>
  </div>

  <!-- Signoff Box -->
  <div class="signoff-box">
    <div class="signoff-text">
      <h4>جاهزية النظام والتشغيل الفعلي</h4>
      <p>تم إنجاز كافة مراحل التطوير والفحص البرمجي الشامل، والموقع يعمل الآن بنجاح على الخادم الرئيسي.</p>
    </div>
    <div class="stamp">
      معتمد للتشغيل 100%<br>
      <small style="font-size:10px; font-weight:normal;">SUCCESSFULLY DEPLOYED</small>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>شركة جولد كلين لمستحضرات النظافة | وثيقة إدارية رسمية سرية للاستخدام الداخلي</span>
    <span>صفحة 2 من 2</span>
  </div>

</body>
</html>
"""

with open('/home/jalal/Projects/Gold-Clean/reports/report1_p1.html', 'w', encoding='utf-8') as f:
    f.write(report1_p1)

with open('/home/jalal/Projects/Gold-Clean/reports/report1_p2.html', 'w', encoding='utf-8') as f:
    f.write(report1_p2)

print("Report 1 HTML created successfully!")
