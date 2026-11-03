'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Flame, Award, Tag } from 'lucide-react';
import { Product, ProductTierOffer } from '../../lib/types/store';
import { getProductTierPricing } from '../../lib/pricing';

interface TieredOfferSelectorProps {
  product: Product;
  selectedQuantity: number;
  onSelectQuantity: (quantity: number) => void;
  accentTheme?: 'dark' | 'light';
}

export default function TieredOfferSelector({
  product,
  selectedQuantity,
  onSelectQuantity,
  accentTheme = 'light'
}: TieredOfferSelectorProps) {
  const basePrice = (product.isWhiteFriday && typeof product.whiteFridayPrice === 'number' && product.whiteFridayPrice > 0)
    ? product.whiteFridayPrice
    : (Number(product.price) || 0);

  const tiers = (product.tieredPricing || [])
    .filter(t => Number(t.quantity) > 0 && Number(t.price) > 0)
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  if (tiers.length === 0) {
    return null;
  }

  const isDark = accentTheme === 'dark';

  return (
    <div className="space-y-2.5 my-5" dir="rtl">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>عروض التوفير الخاصة بالكميات (وفّر أكثر عند طلب عبوات إضافية):</span>
        </span>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          خصومات المصنع المباشرة
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Tier 1: Single unit standard option */}
        <div
          onClick={() => onSelectQuantity(1)}
          className={`relative rounded-2xl p-3 cursor-pointer transition-all border-2 text-right flex flex-col justify-between ${
            selectedQuantity === 1
              ? isDark
                ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                : 'border-amber-500 bg-amber-50/70 shadow-md shadow-amber-500/10'
              : isDark
                ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              عبوة واحدة
            </span>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedQuantity === 1
                ? 'border-amber-500 bg-amber-500 text-slate-950'
                : 'border-slate-300'
            }`}>
              {selectedQuantity === 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 overflow-hidden shrink-0 my-1 p-0.5 shadow-2xs">
            <img 
              src={(product.isWhiteFriday && product.whiteFridayImage) || product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=400'} 
              alt="عبوة واحدة" 
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-black font-mono ${isDark ? 'text-amber-400' : 'text-slate-900'}`}>
                {basePrice}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">جنيه</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              السعر الأساسي
            </span>
          </div>
        </div>

        {/* Dynamic Quantity Tiers */}
        {tiers.map((tier) => {
          const qty = Number(tier.quantity);
          const price = Number(tier.price);
          const fullNormal = basePrice * qty;
          const savings = Math.max(0, fullNormal - price);
          const savingsPct = fullNormal > 0 ? Math.round((savings / fullNormal) * 100) : 0;
          const unitPrice = qty > 0 ? (Math.round((price / qty) * 10) / 10).toFixed(1) : 0;
          const isSelected = selectedQuantity === qty;

          const labelText = qty === 2 ? 'عبوتان (عرض التوفير)' : qty === 3 ? '3 عبوات (الباقة الأكثر طلباً)' : `${qty} عبوات`;
          const bundleImage = tier.image || (product.isWhiteFriday && product.whiteFridayImage) || product.image;

          return (
            <div
              key={qty}
              onClick={() => onSelectQuantity(qty)}
              className={`relative rounded-2xl p-3 cursor-pointer transition-all border-2 text-right flex flex-col justify-between group ${
                isSelected
                  ? isDark
                    ? 'border-amber-400 bg-amber-500/15 shadow-xl shadow-amber-500/15 scale-[1.02]'
                    : 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:border-amber-500/50'
                    : 'border-slate-200 bg-white hover:border-amber-400/60'
              }`}
            >
              {/* Badge overlay on top of card */}
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <div className="flex flex-col">
                  <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {labelText}
                  </span>
                  {tier.badge && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 font-sans mt-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{tier.badge}</span>
                    </span>
                  )}
                </div>

                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-300'
                }`}>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Bundle Thumbnail */}
              {bundleImage && (
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 overflow-hidden shrink-0 my-1 p-0.5 shadow-2xs">
                  <img 
                    src={bundleImage} 
                    alt={labelText} 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {price}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">جنيه إجمالي</span>
                  {fullNormal > price && (
                    <span className="text-xs text-slate-400 line-through font-mono mr-auto">
                      {fullNormal}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
                  <span className="text-slate-500 font-medium font-mono">
                    ({unitPrice} ج.م / للعبوة)
                  </span>
                  {savings > 0 && (
                    <span className="font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[9px]">
                      وفّر {savings} ج.م ({savingsPct}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
