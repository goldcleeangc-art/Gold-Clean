'use client';

import React from 'react';

export default function AboutView() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 md:p-12 relative" dir="rtl" id="about-view">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-amber-50 p-8 border-b border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-amber-950 mb-2">عن شركة جولد كلين</h2>
            <p className="text-amber-800 text-sm font-semibold">خبرة تمتد لأكثر من 10 سنوات في السوق</p>
          </div>
          <a 
            href="/ISO . GMB.pdf" 
            download 
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm whitespace-nowrap inline-flex items-center gap-2"
          >
            <span>تحميل شهادات الجودة</span>
            <span className="text-lg">⬇</span>
          </a>
        </div>
        
        <div className="p-8 space-y-8 text-slate-700 leading-relaxed text-sm">
          <section>
            <p className="mb-4">
              شركة جولد كلين هي مصنع متخصص في إنتاج المنظفات والعطور ومنتجات العناية المنزلية، بخبرة تمتد لأكثر من 10 سنوات في السوق. ومنذ بداية رحلتنا، نحرص على التطوير المستمر وتقديم منتجات عالية الجودة تلبي احتياجات العملاء وتحقق أعلى معايير الأمان والكفاءة.
            </p>
            <p>
              لا يقتصر اهتمامنا على تقديم منتج مميز فقط، بل نحرص على استخدام أفضل الخامات والمواد الخام لضمان جودة المنتج وسلامة المستخدم، لأننا نؤمن أن عملاءنا هم شركاء النجاح الحقيقيون في مسيرتنا.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-4 border-r-4 border-amber-500 pr-3">شهادات الجودة والاعتمادات</h3>
            <p className="mb-3">حصل المصنع على عدد من شهادات الجودة والاعتمادات الدولية، منها:</p>
            <ul className="list-disc list-inside space-y-2 mr-4 text-slate-600 font-semibold">
              <li>شهادة ISO 9001 لنظم إدارة الجودة.</li>
              <li>شهادة GMP الخاصة بمعايير جودة وسلامة المنتجات.</li>
              <li>عضو في خدمات الاعتماد الأوروبية.</li>
              <li>عضو في المنتدى العالمي للمطابقة GCF.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-4 border-r-4 border-blue-600 pr-3">منتجاتنا</h3>
            <p className="mb-3">تتنوع منتجاتنا لتشمل جميع احتياجات العناية بالمنزل، ومنها:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-2 text-slate-600 font-semibold">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات الجو</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات المفروشات</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات الأرضيات</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> المزيلات الشاملة</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> المطهرات</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> منعمات الملابس</li>
            </ul>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 border-r-4 border-emerald-500 pr-3">التواجد الدولي</h3>
            <p>
              وتفخر جولد كلين بتصدير منتجاتها إلى العديد من الأسواق الدولية، منها المملكة العربية السعودية، ودولة الكويت، ودولة ليبيا، وعدد من الدول الأوروبية، كما تتواجد منتجاتنا حالياً في أكثر من 10 دول حول العالم.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
