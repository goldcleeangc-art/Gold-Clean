'use client';

import React from 'react';
import { Plus, Trash2, Sparkles, Tag, Flame, TrendingDown, Layers, HelpCircle } from 'lucide-react';
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
      alert(`يوجد بالفعل عرض محدد للكمية (${quantity} عبوة).`);
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
    <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>عروض وتخفيضات الكمية (Tiered Quantity Offers)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300/40">
                زيادة المبيعات
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              حدد أسعاراً خاصة وتخفيضات تصاعدية عند شراء أكثر من عبوة (مثلاً: عبوتين بسعر مخفض، 3 عبوات بتوفير أكبر).
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold ml-1">عروض سريعة:</span>
          <button
            type="button"
            onClick={() => addPreset(2, 10, 'الأكثر طلباً 🔥')}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 transition-colors cursor-pointer"
          >
            + عبوتين (خصم 10%)
          </button>
          <button
            type="button"
            onClick={() => addPreset(3, 20, 'أفضل توفير 👑')}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 transition-colors cursor-pointer"
          >
            + 3 عبوات (خصم 20%)
          </button>
          <button
            type="button"
            onClick={() => addPreset(4, 25, 'باقة العائلة ⭐')}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 transition-colors cursor-pointer"
          >
            + 4 عبوات (خصم 25%)
          </button>
        </div>
      </div>

      {/* Tiers List */}
      {tiers.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white/70 text-center">
          <p className="text-xs text-slate-500 font-medium">
            لم يتم إنشاء عروض كميات لهذا المنتج بعد. يمكنك استخدام أحد العروض الجاهزة بالأعلى أو الضغط على زر الإضافة بالأسفل.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tiers.map((tier, idx) => {
            const qty = Math.max(1, tier.quantity || 1);
            const price = Math.max(0, tier.price || 0);
            const fullNormal = currentBase * qty;
            const savings = Math.max(0, fullNormal - price);
            const savingsPct = fullNormal > 0 ? Math.round((savings / fullNormal) * 100) : 0;
            const unitPrice = qty > 0 ? Math.round((price / qty) * 10) / 10 : 0;

            return (
              <div 
                key={idx}
                className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:border-amber-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      الكمية (عدد العبوات) *
                    </label>
                    <input 
                      type="number"
                      min="2"
                      max="100"
                      value={tier.quantity || ''}
                      onChange={(e) => handleUpdateTier(idx, 'quantity', Number(e.target.value))}
                      className="w-full text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Total Offer Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      السعر الإجمالي للكمية (ج.م) *
                    </label>
                    <input 
                      type="number"
                      min="1"
                      step="1"
                      value={tier.price || ''}
                      onChange={(e) => handleUpdateTier(idx, 'price', Number(e.target.value))}
                      className="w-full text-xs font-bold font-mono px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/40 text-amber-800 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      شارة العرض الترويجي
                    </label>
                    <input 
                      type="text"
                      value={tier.badge || ''}
                      onChange={(e) => handleUpdateTier(idx, 'badge', e.target.value)}
                      placeholder="مثال: الأكثر طلباً 🔥"
                      className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Live calculation info */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-slate-800 font-mono">
                        {unitPrice} ج.م <span className="text-[9px] font-sans text-slate-400">/ للعبوة</span>
                      </span>
                      {savings > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          توفير {savings} ج.م ({savingsPct}%)
                        </span>
                      )}
                    </div>
                    {currentBase > 0 && price >= fullNormal && (
                      <span className="text-[9px] text-rose-500 block">
                        تنبيه: السعر يجب أن يكون أقل من {fullNormal} ج.م لتقديم خصم
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف هذا العرض"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Tier Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            const nextQty = tiers.length > 0 ? Math.max(...tiers.map(t => t.quantity)) + 1 : 2;
            const fullPrice = currentBase * nextQty;
            const defaultPrice = Math.round(fullPrice * 0.85); // 15% discount
            handleAddTier(nextQty, defaultPrice, nextQty === 2 ? 'الأكثر طلباً 🔥' : 'عرض خاص ⭐');
          }}
          className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة مستوى عرض كمية جديد</span>
        </button>

        {tiers.length > 0 && (
          <span className="text-[10px] text-slate-500 font-medium">
            عدد العروض المفعلة: <strong className="text-slate-800">{tiers.length}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
