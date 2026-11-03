'use client';

import React from 'react';
import { Plus, Trash2, Sparkles, Layers, Check, AlertCircle, TrendingDown, Tag } from 'lucide-react';
import { ProductTierOffer } from '../../lib/types/store';

interface TieredPricingManagerProps {
  basePrice: number;
  tiers: ProductTierOffer[];
  onChange: (tiers: ProductTierOffer[]) => void;
  accentColor?: 'amber' | 'blue' | 'rose';
}

export default function TieredPricingManager({
  basePrice,
  tiers = [],
  onChange,
  accentColor = 'amber'
}: TieredPricingManagerProps) {
  const currentBase = Number(basePrice) || 0;

  const handleAddTier = (quantity: number, price: number, badge = '') => {
    // Avoid duplicate quantity
    if (tiers.some(t => t.quantity === quantity)) {
      alert(`يوجد بالفعل عرض محدد للكمية (${quantity} عبوة). يمكنك تعديله مباشرة.`);
      return;
    }

    const updated = [
      ...tiers,
      {
        quantity,
        price,
        badge: badge || (quantity === 2 ? 'الأكثر طلباً 🔥' : quantity === 3 ? 'أفضل توفير 👑' : 'عرض خاص ⭐')
      }
    ].sort((a, b) => a.quantity - b.quantity);

    onChange(updated);
  };

  const handleUpdateTier = (index: number, field: keyof ProductTierOffer, value: any) => {
    const updated = tiers.map((t, i) => {
      if (i !== index) return t;
      return {
        ...t,
        [field]: field === 'quantity' || field === 'price' ? Number(value) : value
      };
    });
    onChange(updated);
  };

  const handleRemoveTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  // Preset calculation
  const addPreset = (qty: number, discountPercent: number, badge: string) => {
    if (currentBase <= 0) {
      alert('يرجى تحديد السعر الأساسي للمنتج أولاً لحساب خصم الكمية.');
      return;
    }
    const fullPrice = currentBase * qty;
    const discountedPrice = Math.round(fullPrice * (1 - discountPercent / 100));
    handleAddTier(qty, discountedPrice, badge);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* 1. Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-150">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span>عروض وتخفيضات الكمية (Tiered Quantity Offers)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                زيادة المبيعات
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              حدد أسعاراً خاصة وتخفيضات تصاعدية عند شراء أكثر من عبوة لتشجيع العميل على زيادة كمية الطلب.
            </p>
          </div>
        </div>

        {/* Status count */}
        {tiers.length > 0 && (
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-center">
            {tiers.length} مستويات مفعلة
          </span>
        )}
      </div>

      {/* 2. Quick Presets Bar */}
      <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>عروض سريعة جاهزة بضغطة زر:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addPreset(2, 10, 'الأكثر طلباً 🔥')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <span>+ باقة عبوتين</span>
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">خصم 10%</span>
          </button>

          <button
            type="button"
            onClick={() => addPreset(3, 20, 'أفضل توفير 👑')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <span>+ باقة 3 عبوات</span>
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">خصم 20%</span>
          </button>

          <button
            type="button"
            onClick={() => addPreset(4, 25, 'باقة العائلة ⭐')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <span>+ باقة 4 عبوات</span>
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">خصم 25%</span>
          </button>
        </div>
      </div>

      {/* 3. Tiers Cards List */}
      {tiers.length === 0 ? (
        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Tag className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            لم تقم بإضافة عروض كميات لهذا المنتج بعد
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            يمكنك الضغط على أحد العروض السريعة بالأعلى لتطبيق خصومات جاهزة فوراً، أو إضافة مستوى مخصص بالأسفل.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, idx) => {
            const qty = Math.max(1, tier.quantity || 1);
            const price = Math.max(0, tier.price || 0);
            const fullNormal = currentBase * qty;
            const savings = Math.max(0, fullNormal - price);
            const savingsPct = fullNormal > 0 ? Math.round((savings / fullNormal) * 100) : 0;
            const unitPrice = qty > 0 ? Math.round((price / qty) * 10) / 10 : 0;
            const isNoDiscount = currentBase > 0 && price >= fullNormal;

            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 p-4 shadow-xs transition-all space-y-3"
              >
                {/* Tier Card Top Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      باقة ({qty}) عبوات
                    </span>
                    {tier.badge && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {savings > 0 && (
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                        توفير {savings} ج.م (خصم {savingsPct}%)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف هذا المستوى"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tier Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      الكمية (عدد العبوات) *
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="2"
                        max="100"
                        value={tier.quantity || ''}
                        onChange={(e) => handleUpdateTier(idx, 'quantity', Number(e.target.value))}
                        className="w-full text-xs font-bold font-mono px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                        عبوة
                      </span>
                    </div>
                  </div>

                  {/* Total Offer Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      إجمالي سعر الباقة (ج.م) *
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        value={tier.price || ''}
                        onChange={(e) => handleUpdateTier(idx, 'price', Number(e.target.value))}
                        className="w-full text-xs font-black font-mono px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-amber-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 pointer-events-none">
                        ج.م
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      شارة العرض (Badge)
                    </label>
                    <input 
                      type="text"
                      value={tier.badge || ''}
                      onChange={(e) => handleUpdateTier(idx, 'badge', e.target.value)}
                      placeholder="مثال: الأكثر طلباً 🔥"
                      className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Tier Live Analytics / Warning Strip */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium text-[11px]">سعر العبوة الواحدة داخل العرض:</span>
                    <strong className="text-slate-900 font-bold font-mono">
                      {unitPrice} ج.م
                    </strong>
                    {currentBase > 0 && (
                      <span className="text-[10px] text-slate-400 line-through font-mono">
                        ({currentBase} ج.م)
                      </span>
                    )}
                  </div>

                  {isNoDiscount ? (
                    <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>تنبيه: السعر يجب أن يكون أقل من {fullNormal} ج.م لتقديم خصم حقيقي.</span>
                    </div>
                  ) : savings > 0 ? (
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>العميل يوفر {savings} ج.م مقارنة بشراء العبوات منفردة</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add Custom Tier Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            const nextQty = tiers.length > 0 ? Math.max(...tiers.map(t => t.quantity)) + 1 : 2;
            const fullPrice = currentBase * nextQty;
            const defaultPrice = Math.round(fullPrice * 0.85); // 15% discount
            handleAddTier(nextQty, defaultPrice, nextQty === 2 ? 'الأكثر طلباً 🔥' : 'عرض خاص ⭐');
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-400 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.005]"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>+ إضافة باقة / مستوى عرض كمية مخصص</span>
        </button>
      </div>
    </div>
  );
}
