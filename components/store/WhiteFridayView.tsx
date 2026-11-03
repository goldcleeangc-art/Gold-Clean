'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  ShoppingCart, 
  Star, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Check, 
  Share2, 
  Eye, 
  Tag, 
  Search, 
  Percent, 
  Sparkle,
  ArrowLeft,
  Package,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Product, Category, WhiteFridaySettings } from '../../lib/types/store';
import { getDecomposedProductOffers, DecomposedOffer } from '../../lib/pricing';

interface WhiteFridayViewProps {
  products: Product[];
  categories: Category[];
  whiteFridaySettings: WhiteFridaySettings;
  setCurrentTab: (tab: 'home' | 'products' | 'white_friday' | 'offers' | 'about' | 'complaints') => void;
  onAddToCart: (product: Product, e: React.MouseEvent, quantity?: number) => void;
  onSelectProduct: (product: Product, initialQuantity?: number) => void;
  copiedLinkId: string | null;
  onCopyLink: (id: string) => void;
  loading?: boolean;
}

export default function WhiteFridayView({
  products,
  categories,
  whiteFridaySettings,
  setCurrentTab,
  onAddToCart,
  onSelectProduct,
  copiedLinkId,
  onCopyLink,
  loading = false
}: WhiteFridayViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter White Friday products
  const whiteFridayProducts = products.filter(p => p.isWhiteFriday === true && p.isAvailable !== false);

  // Decompose every tiered product into standalone individual offer cards!
  const allWhiteFridayOffers = React.useMemo(() => {
    return getDecomposedProductOffers(whiteFridayProducts);
  }, [whiteFridayProducts]);

  const filteredOffers = React.useMemo(() => {
    return allWhiteFridayOffers.filter(offer => {
      const searchMatch = 
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        offer.product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const catMatch = selectedCategory === 'all' || offer.category === selectedCategory;
      return searchMatch && catMatch;
    });
  }, [allWhiteFridayOffers, searchTerm, selectedCategory]);

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDateStr = whiteFridaySettings.endDate || '2026-11-30T23:59:59';
    const target = new Date(targetDateStr).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [whiteFridaySettings.endDate]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F19] text-slate-100 relative pb-24 md:pb-16 selection:bg-amber-500 selection:text-slate-950" dir="rtl" id="white-friday-view">
      
      {/* 1. HERO BANNER - LUXURY BLACK & GOLD THEMED */}
      <section className="relative pt-10 sm:pt-14 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-slate-950 via-[#101726] to-[#0B0F19]">
        {/* Ambient Lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 left-1/3 w-[600px] h-[300px] bg-amber-600/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          
          {/* Eyebrow Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-lg shadow-amber-500/10 mb-6"
          >
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{whiteFridaySettings.badgeText || 'مهرجان عروض الجمعة البيضاء 🔥'}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-5 leading-[1.2]"
          >
            {whiteFridaySettings.title || 'أقوى تخفيضات الجمعة البيضاء'}
            <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
              وفر حتى 60% على أرقى المنظفات والمعقمات
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto font-medium leading-relaxed mb-8"
          >
            {whiteFridaySettings.subtitle || 'تركيبات حصرية فائقة التركيز من مصنع جولد كلين لمنزلكِ وملابسكِ بأعلى جودة مضمونة وأفضل أسعار العام. الكميات محدودة والعروض سارية حتى نفاد المخزون!'}
          </motion.p>

          {/* Optional Hero Banner Image */}
          {whiteFridaySettings.bannerImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="max-w-3xl mx-auto mb-8 rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10"
            >
              <img
                src={whiteFridaySettings.bannerImage}
                alt="White Friday Banner"
                className="w-full h-auto max-h-[320px] object-cover"
              />
            </motion.div>
          )}

          {/* COUNTDOWN TIMER */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md shadow-2xl mb-8"
          >
            <div className="flex items-center gap-1.5 px-2 text-amber-400 text-xs font-black">
              <Clock className="w-4 h-4 animate-spin" />
              <span>ينتهي العرض خلال:</span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <div className="flex flex-col items-center bg-slate-950/80 border border-amber-500/40 rounded-2xl w-14 sm:w-16 py-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400">{timeLeft.days}</span>
                <span className="text-[10px] text-slate-400 font-sans font-bold">يوم</span>
              </div>
              <span className="text-amber-500 font-bold text-lg">:</span>

              <div className="flex flex-col items-center bg-slate-950/80 border border-amber-500/40 rounded-2xl w-14 sm:w-16 py-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 font-sans font-bold">ساعة</span>
              </div>
              <span className="text-amber-500 font-bold text-lg">:</span>

              <div className="flex flex-col items-center bg-slate-950/80 border border-amber-500/40 rounded-2xl w-14 sm:w-16 py-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 font-sans font-bold">دقيقة</span>
              </div>
              <span className="text-amber-500 font-bold text-lg">:</span>

              <div className="flex flex-col items-center bg-slate-950/80 border border-amber-500/40 rounded-2xl w-14 sm:w-16 py-2">
                <span className="text-xl sm:text-2xl font-black text-rose-400 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 font-sans font-bold">ثانية</span>
              </div>
            </div>
          </motion.div>

          {/* Guarantees Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center justify-center gap-2 py-2">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">شحن سريع لكافة المحافظات</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">معاينة وفحص قبل الاستلام</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <Percent className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">أسعار التوفير من المصنع</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">جودة وتركيز يدوم طويلاً</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في عروض الجمعة البيضاء..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              جميع العروض ({allWhiteFridayOffers.length})
            </button>

            {categories.map((cat) => {
              const count = allWhiteFridayOffers.filter(o => o.category === cat.key).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. PRODUCTS & BUNDLE OFFERS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800 animate-pulse h-80" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 my-8">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-4">
              <Flame className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-white">
              {searchTerm ? 'لم يتم العثور على عروض مطابقة للبحث' : 'ترقبوا أقوى عروض الجمعة البيضاء قريباً!'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              {searchTerm ? 'جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً.' : 'نحن نجهز لكم تشكيلة مذهلة من العروض والتخفيضات الكبرى. تصفح بقية منتجات المتجر الآن!'}
            </p>
            <button
              onClick={() => setCurrentTab('products')}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>تصفح جميع المنتجات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredOffers.map((offer) => {
              return (
                <div
                  key={offer.id}
                  className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-amber-500/30 hover:border-amber-400 p-3 sm:p-4 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Decorative glowing corner */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-1.5 mb-2.5 relative z-10">
                    <span className="bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300 animate-bounce" />
                      <span>{offer.discountPct > 0 ? `-${offer.discountPct}%` : 'عرض حصري'}</span>
                    </span>

                    <button
                      onClick={() => onCopyLink(offer.productId)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="مشاركة رابط العرض"
                    >
                      {copiedLinkId === offer.productId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Offer Image */}
                  <div 
                    onClick={() => onSelectProduct(offer.product, offer.quantity)}
                    className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 relative mb-3 cursor-pointer border border-slate-800"
                  >
                    <img 
                      src={offer.image} 
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" 
                    />
                    
                    {/* Badge Overlay */}
                    {offer.badge && (
                      <div className="absolute bottom-2 inset-x-2">
                        <span className="bg-amber-500/95 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg block text-center truncate shadow-md backdrop-blur-xs">
                          {offer.badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Volume & Pieces tag */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          offer.isBundle 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' 
                            : 'bg-slate-800/80 text-slate-300'
                        }`}>
                          {offer.product.isBundle 
                            ? `🎁 باقة مجمعة (${offer.product.bundleItems?.length || 2} أصناف)`
                            : (offer.isBundle ? `باقة توفير (${offer.quantity} عبوات)` : offer.volume)}
                        </span>

                        {offer.product.rating > 0 && (
                          <div className="flex items-center gap-0.5 text-amber-400 mr-auto font-mono font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{offer.product.rating}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        onClick={() => onSelectProduct(offer.product, offer.quantity)}
                        className="font-extrabold text-xs sm:text-sm text-white hover:text-amber-300 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
                        title={offer.title}
                      >
                        {offer.title}
                      </h3>
                    </div>

                    {/* Pricing */}
                    <div className="pt-2 border-t border-slate-800/90 mt-2">
                      <div className="flex items-baseline justify-between gap-1 mb-2">
                        <div>
                          <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                            {offer.price} <span className="text-xs font-bold text-amber-300">ج.م</span>
                          </span>
                          {offer.originalPrice > offer.price && (
                            <span className="text-xs text-slate-400 line-through font-mono block">
                              {offer.originalPrice} ج.م
                            </span>
                          )}
                        </div>

                        {offer.savings > 0 && (
                          <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                            وفري {offer.savings} ج.م
                          </span>
                        )}
                      </div>

                      {/* Unit price inside bundle or bundle contents */}
                      {offer.product.isBundle && offer.product.bundleItems && offer.product.bundleItems.length > 0 ? (
                        <p className="text-[10px] text-slate-300 mb-2 truncate" title={offer.product.bundleItems.map(bi => `${bi.quantity}× ${bi.productName}`).join(' + ')}>
                          يشمل: {offer.product.bundleItems.map(bi => `${bi.quantity}× ${bi.productName}`).join(' + ')}
                        </p>
                      ) : (
                        offer.isBundle && (
                          <p className="text-[10px] text-slate-400 mb-2 font-mono">
                            سعر العبوة في العرض: <strong className="text-amber-300">{(offer.price / offer.quantity).toFixed(0)} ج.م</strong>
                          </p>
                        )
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => onAddToCart(offer.product, e, offer.quantity)}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{offer.product.isBundle ? 'أضف الباقة للسلة' : (offer.isBundle ? `أضف باقة (${offer.quantity}) عبوات` : 'أضف للسلة الآن')}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
