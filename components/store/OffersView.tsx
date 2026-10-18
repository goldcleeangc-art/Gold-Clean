'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Percent, 
  Flame, 
  Truck, 
  CheckCircle, 
  ShoppingCart 
} from 'lucide-react';
import { Offer, Product } from '../../lib/types/store';

interface OffersViewProps {
  offers: Offer[];
  products: Product[];
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  onAddOfferToCart: (offer: Offer, e: React.MouseEvent) => void;
}

export default function OffersView({
  offers,
  products,
  setCurrentTab,
  onAddOfferToCart
}: OffersViewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-16" dir="rtl" id="offers-view">
      {/* OFFERS HERO HEADER */}
      <div className="relative bg-gradient-to-b from-rose-50/70 via-white to-slate-50 pt-8 pb-10 border-b border-rose-100/60 overflow-hidden shrink-0">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-black mb-3 border border-rose-200">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>عروض وباقات التوفير الحصرية من مصنع جولد كلين</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
                وفّر أكثر مع باقات التوفير المتكاملة 🔥
              </h2>
              <p className="text-slate-600 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
                اختر باقتك المفضلة المكونة من أشهر منتجات العناية والمنظفات بخصومات حقيقية وتوفير مضمون مقارنة بالشراء الفردي!
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-rose-100 shadow-sm shrink-0">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                <Percent className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">مجموع الباقات المتاحة</span>
                <span className="text-xl font-black text-rose-600 font-mono">
                  {offers.filter(o => o.isAvailable).length} باقة توفير
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OFFERS GRID */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {offers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد باقات عروض متاحة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              يقوم فريق جولد كلين بتجهيز باقات توفير جديدة قريباً. يمكنك تصفح المنتجات الفردية الآن.
            </p>
            <button
              onClick={() => setCurrentTab('products')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              تصفح المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="storefront-offers-grid">
            {offers.map((offer) => {
              const savingsVal = offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice);
              const discountPercent = offer.originalPrice > 0 ? Math.round((savingsVal / offer.originalPrice) * 100) : 0;
              const totalPieces = offer.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Card Header & Visual Media */}
                    <div className="relative bg-slate-50 p-4 border-b border-slate-100 overflow-hidden">
                      {/* Promo Badge */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>{offer.badge || 'عرض خاص'}</span>
                        </span>
                        {discountPercent > 0 && (
                          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xs">
                            خصم {discountPercent}%
                          </span>
                        )}
                        {offer.isFreeShipping && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>شحن مجاني 🚚</span>
                          </span>
                        )}
                      </div>

                      {/* Offer Image or Product Collage */}
                      <div className="h-48 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden p-3 relative">
                        {offer.image && offer.image.trim() !== '' ? (
                          <img 
                            src={offer.image} 
                            alt={offer.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : offer.items && offer.items.length > 1 ? (
                          <div className="grid grid-cols-2 gap-2 w-full h-full p-1 items-center justify-center">
                            {offer.items.slice(0, 4).map((it, idx) => {
                              const itImg = it.image && it.image.trim() !== '' 
                                ? it.image 
                                : (products.find(p => p.id === it.productId || p.name === it.productName)?.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=300');
                              return (
                                <div key={idx} className="h-full bg-slate-50 rounded-xl p-1 flex flex-col items-center justify-center border border-slate-100 overflow-hidden">
                                  <img 
                                    src={itImg} 
                                    alt={it.productName} 
                                    referrerPolicy="no-referrer"
                                    className="max-h-12 object-contain" 
                                  />
                                  <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center mt-0.5">
                                    {it.quantity}× {it.productName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : offer.items && offer.items.length === 1 ? (
                          <img 
                            src={offer.items[0].image || products.find(p => p.id === offer.items[0].productId || p.name === offer.items[0].productName)?.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600'} 
                            alt={offer.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <img 
                            src="https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600" 
                            alt={offer.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          باقة تحتوي على {totalPieces} قطع
                        </span>
                        {!offer.isAvailable && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            غير متوفر حالياً
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-rose-600 transition-colors">
                        {offer.title}
                      </h3>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                        {offer.description}
                      </p>

                      {/* Detailed Items in Bundle */}
                      <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-700 block">
                          محتويات الباقة:
                        </span>
                        <div className="space-y-1">
                          {offer.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="font-bold text-slate-800">{it.quantity}×</span>
                                <span className="truncate">{it.productName}</span>
                                {it.volume && <span className="text-[10px] text-slate-400">({it.volume})</span>}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {(it.unitPrice * it.quantity).toFixed(0)} ج
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Pricing, Prominent Savings Box & Add Button */}
                  <div className="p-5 pt-0 space-y-3">
                    {/* Price Display */}
                    <div className="flex items-baseline justify-between pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-0.5">سعر الباقة</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-rose-600 font-mono">
                            {offer.offerPrice.toFixed(0)}
                          </span>
                          <span className="text-xs font-bold text-slate-500">جنيه</span>
                          {offer.originalPrice > offer.offerPrice && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {offer.originalPrice.toFixed(0)} ج
                            </span>
                          )}
                        </div>
                      </div>

                      {discountPercent > 0 && (
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 inline-block">
                            وفرت {discountPercent}% خصم
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PROMINENT SAVINGS BADGE UNDER PRICE */}
                    <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-900">
                          قيمة التوفير:
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-emerald-700 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                        وفر {savingsVal} جنيه 💰
                      </div>
                    </div>

                    {/* Shipping Banner */}
                    {offer.isFreeShipping && (
                      <div className="p-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200/80 flex items-center justify-center gap-1.5 text-blue-900 text-[11px] font-bold shadow-2xs">
                        <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>العرض يشمل شحن وتوصيل مجاني بالكامل 🎁</span>
                      </div>
                    )}

                    {/* CTA Button */}
                    <button
                      disabled={!offer.isAvailable}
                      onClick={(e) => onAddOfferToCart(offer, e)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                        !offer.isAvailable
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-rose-600/20 hover:scale-[1.02]'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{!offer.isAvailable ? 'الباقة غير متوفرة' : 'أضف باقة العرض إلى السلة'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
