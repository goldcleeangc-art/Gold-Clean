'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Tag, 
  Flame, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  Banknote 
} from 'lucide-react';
import { Category, Offer, Product } from '../../lib/types/store';

interface HomeViewProps {
  categories: Category[];
  setActiveCategory: (cat: string) => void;
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  offers: Offer[];
  products: Product[];
  onAddOfferToCart: (offer: Offer, e: React.MouseEvent) => void;
}

export default function HomeView({
  categories,
  setActiveCategory,
  setCurrentTab,
  offers,
  products,
  onAddOfferToCart
}: HomeViewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-16" dir="rtl" id="home-view">
      {/* HERO SECTION */}
      <div className="relative bg-white pt-10 md:pt-16 pb-12 md:pb-20 border-b border-slate-100 overflow-hidden shrink-0">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -left-1/4 -top-1/4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl mix-blend-multiply" />
          <div className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl mix-blend-multiply" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Right Column: Text Content */}
            <div className="md:col-span-7 text-center md:text-right order-2 md:order-1">
              <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider mb-5 inline-block"
              >
                ✨ النظافة اللي تستاهليها.. بسهولة وأمان!
              </motion.span>
              
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight"
              >
                مرحباً بكِ في عالم <br />
                <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent font-sans">GOLD CLEAN</span>
                <br />
                للمنظفات الفاخرة وعالية الجودة
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-slate-600 text-sm md:text-base mb-8 leading-relaxed max-w-xl mx-auto md:mx-0 font-semibold"
              >
                نحن في <strong className="text-slate-800">جولد كلين</strong> نوفر لكِ خيارات متعددة وجودة استثنائية لجميع مستلزمات التنظيف والتعقيم للمنازل والمكاتب. تركيباتنا الفعالة تمنحكِ النظافة العميقة وحماية تدوم طويلاً وبأفضل الأسعار.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <button 
                  onClick={() => setCurrentTab('products')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>تصفح منتجاتنا الآن</span>
                  <span className="text-lg leading-none">&larr;</span>
                </button>
                
                <button 
                  onClick={() => setCurrentTab('about')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>تعرّف على مصنعنا</span>
                </button>
              </motion.div>
            </div>

            {/* Left Column: Image Container */}
            <div className="md:col-span-5 order-1 md:order-2 flex justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-[280px] sm:max-w-[320px] md:max-w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-50 transition-all duration-500 hover:shadow-blue-200/50 group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
                <img 
                  src="https://ik.imagekit.io/gxrz55knx/Halal.jpeg" 
                  alt="جولد كلين - النظافة اللي تستاهليها" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[420px] md:max-h-[500px] transition-transform duration-750 group-hover:scale-103"
                />
              </motion.div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MAIN CATEGORIES */}
      <div className="max-w-6xl mx-auto px-6 py-12 shrink-0">
        <h3 className="text-lg font-black text-slate-900 mb-6 border-r-4 border-amber-500 pr-3">اختر من الفئات الرئيسية</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.length > 0 ? categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => { setActiveCategory(cat.key); setCurrentTab('products'); }}
              className="bg-white hover:bg-amber-50 p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all text-center group cursor-pointer"
            >
              <div className="w-12 h-12 bg-slate-50 group-hover:bg-white rounded-xl mx-auto mb-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{cat.name}</h4>
            </button>
          )) : (
            <p className="text-sm text-slate-500 text-center col-span-4 bg-white p-6 rounded-2xl border border-slate-100">جاري تحميل الفئات...</p>
          )}
        </div>
      </div>

      {/* FEATURED OFFERS SECTION ON HOMEPAGE */}
      {offers.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-y border-rose-200/60 py-12 shrink-0">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-rose-600 animate-bounce" />
                  <span className="text-rose-700 text-xs font-black bg-rose-100 px-2.5 py-0.5 rounded-md">أقوى التخفيضات</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">عروض وباقات التوفير الحصرية</h3>
              </div>
              <button 
                onClick={() => setCurrentTab('offers')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>تصفح جميع باقات العروض ({offers.length})</span>
                <span>&larr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((off) => {
                const savingsVal = off.savings || Math.max(0, off.originalPrice - off.offerPrice);
                const discountPercent = off.originalPrice > 0 ? Math.round((savingsVal / off.originalPrice) * 100) : 0;
                const totalPieces = off.items ? off.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                
                // Resolve main image or items images
                const directImage = off.image && off.image.trim() !== '' ? off.image : null;
                const resolvedItemImages = (off.items || []).map((it) => {
                  if (it.image && it.image.trim() !== '') return { name: it.productName, qty: it.quantity, img: it.image };
                  const matchedProd = products.find(p => p.id === it.productId || p.name === it.productName);
                  return { 
                    name: it.productName, 
                    qty: it.quantity, 
                    img: matchedProd?.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=300' 
                  };
                });
                const primaryFallbackImage = resolvedItemImages[0]?.img || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';

                return (
                  <div 
                    key={`home-offer-${off.id}`} 
                    onClick={() => setCurrentTab('offers')} 
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-150/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between cursor-pointer group overflow-hidden"
                  >
                    <div>
                      {/* Offer Visual Media Box */}
                      <div className="h-48 bg-gradient-to-b from-slate-50/80 to-rose-50/40 rounded-2xl mb-3.5 flex items-center justify-center overflow-hidden border border-slate-100 p-2.5 relative group-hover:border-rose-200 transition-all">
                        {/* Badges on top */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>{off.badge || 'عرض توفير'}</span>
                          </span>
                          {discountPercent > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                              خصم {discountPercent}%
                            </span>
                          )}
                          {off.isFreeShipping && (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>شحن مجاني 🚚</span>
                            </span>
                          )}
                          {!off.isAvailable && (
                            <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-rose-100 shadow-xs">
                              غير متوفر حالياً
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2.5 right-2.5 z-10">
                          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                            باقة {totalPieces} قطع
                          </span>
                        </div>

                        {/* Images Display: Direct Banner or Multi-Product Composite */}
                        {directImage ? (
                          <img 
                            src={directImage} 
                            alt={off.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : resolvedItemImages.length > 1 ? (
                          <div className="grid grid-cols-2 gap-2 w-full h-full items-center justify-center">
                            {resolvedItemImages.slice(0, 4).map((itImg, idx) => (
                              <div key={idx} className="h-full bg-white/90 rounded-xl p-1.5 flex flex-col items-center justify-center border border-slate-100 shadow-2xs overflow-hidden">
                                <img 
                                  src={itImg.img} 
                                  alt={itImg.name} 
                                  referrerPolicy="no-referrer"
                                  className="max-h-12 object-contain group-hover:scale-105 transition-transform" 
                                />
                                <span className="text-[8px] font-extrabold text-slate-700 truncate w-full text-center mt-0.5">
                                  {itImg.qty}× {itImg.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <img 
                            src={primaryFallbackImage} 
                            alt={off.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2" 
                          />
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">{off.title}</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mb-3 leading-relaxed">{off.description}</p>
                      
                      {/* Mini Items Checklist */}
                      <div className="text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 space-y-1">
                        {(off.items || []).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="font-semibold truncate">• {it.quantity}× {it.productName}</span>
                            <span className="text-slate-400 font-mono text-[9px] shrink-0 mr-2">({it.unitPrice * it.quantity} ج)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-xs text-slate-400 line-through ml-1.5">{off.originalPrice} ج</span>
                          <span className="text-base font-black text-rose-600 font-mono">{off.offerPrice} جنيه</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          وفر {savingsVal} جنيه
                        </span>
                      </div>

                      <button
                        id={`home-offer-add-btn-${off.id}`}
                        disabled={!off.isAvailable}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddOfferToCart(off, e);
                        }}
                        className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                          !off.isAvailable
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{!off.isAvailable ? 'الباقة غير متوفرة' : 'أضف الباقة للسلة'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BEST SELLING PRODUCTS */}
      <div className="bg-white border-y border-slate-100 py-12 shrink-0">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-lg font-black text-slate-900 border-r-4 border-blue-600 pr-3">تشكيلة منتجات مميزة</h3>
            <button 
              onClick={() => setCurrentTab('products')}
              className="text-blue-600 text-[11px] font-bold hover:underline cursor-pointer"
            >
              عرض كل المنتجات &larr;
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.slice(0, 4).map((product) => (
              <div key={`featured-${product.id}`} onClick={() => setCurrentTab('products')} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col relative group cursor-pointer">
                <div className="h-36 bg-white rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                  />
                </div>
                <h5 className="font-bold text-slate-800 text-xs line-clamp-1 mb-1">{product.name}</h5>
                <span className="text-blue-600 font-mono font-black text-sm block mt-auto">{product.price.toFixed(2)} جنيه</span>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-slate-500 text-center col-span-4 p-6">جاري تحميل المنتجات...</p>
            )}
          </div>
        </div>
      </div>

      {/* STORE FEATURES */}
      <div className="max-w-6xl mx-auto px-6 py-12 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 bg-white border border-blue-100 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2 relative z-10">توصيل سريع وموثوق</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">نقوم بتوصيل طلباتك بسرعة وبأمان تام لكافة الدول العربية ومصر.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2 relative z-10">جودة ممتازة ومضمونة</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">بضائع أصلية ١٠٠٪ ومرخصة مع ضمان الجودة على كافة المنظفات.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 bg-white border border-rose-100 text-rose-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
              <Banknote className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2 relative z-10">الدفع عند الاستلام</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">لراحتكم، الدفع يكون نقداً عند استلامكم للطلب لمعاينة جودة منتجاتنا.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
