'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  Banknote, 
  Tag, 
  Check, 
  Star, 
  Award, 
  ChevronLeft, 
  Package, 
  Droplets, 
  Shirt, 
  Sparkle, 
  Info, 
  Clock, 
  HeartHandshake, 
  Eye,
  ArrowLeft,
  Percent,
  CheckCircle2,
  Code,
  Mail
} from 'lucide-react';
import { Category, Offer, Product, WhiteFridaySettings } from '../../lib/types/store';
import { getDecomposedProductOffers, DecomposedOffer } from '../../lib/pricing';

interface HomeViewProps {
  categories: Category[];
  setActiveCategory: (cat: string) => void;
  setCurrentTab: (tab: 'home' | 'products' | 'white_friday' | 'offers' | 'about' | 'complaints') => void;
  offers: Offer[];
  products: Product[];
  whiteFridaySettings?: WhiteFridaySettings;
  onAddOfferToCart: (offer: Offer, e: React.MouseEvent) => void;
  onAddToCart?: (product: Product, e: React.MouseEvent, quantity?: number) => void;
  onSelectProduct?: (product: Product, initialQuantity?: number) => void;
  loading?: boolean;
}

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';
const HERO_IMAGE_URL = 'https://ik.imagekit.io/gxrz55knx/Halal.jpeg';

// Helper to assign a relevant, elegant icon for categories dynamically
function getCategoryIcon(catKey: string = '', catName: string = '') {
  const combined = (catKey + ' ' + catName).toLowerCase();
  if (combined.includes('cloth') || combined.includes('ملابس') || combined.includes('غسيل') || combined.includes('laundry')) {
    return Shirt;
  }
  if (combined.includes('dish') || combined.includes('أطباق') || combined.includes('صحون') || combined.includes('مطبخ') || combined.includes('kitchen')) {
    return Droplets;
  }
  if (combined.includes('disinfect') || combined.includes('معقم') || combined.includes('مطهر') || combined.includes('تعقيم') || combined.includes('clor')) {
    return ShieldCheck;
  }
  if (combined.includes('glass') || combined.includes('زجاج')) {
    return Sparkle;
  }
  if (combined.includes('bath') || combined.includes('حمام') || combined.includes('أرضيات') || combined.includes('floor')) {
    return Sparkles;
  }
  return Tag;
}

export default function HomeView({
  categories,
  setActiveCategory,
  setCurrentTab,
  offers,
  products,
  whiteFridaySettings,
  onAddOfferToCart,
  onAddToCart,
  onSelectProduct,
  loading = false
}: HomeViewProps) {
  const [heroImgSrc, setHeroImgSrc] = useState(HERO_IMAGE_URL);

  // White Friday products & standalone decomposed bundle offers
  const whiteFridayProducts = products.filter(p => p.isWhiteFriday === true && p.isAvailable !== false);
  const whiteFridayDecomposedOffers = React.useMemo(() => {
    return getDecomposedProductOffers(whiteFridayProducts);
  }, [whiteFridayProducts]);

  // Countdown timer for announcement banner
  const [wfTimeLeft, setWfTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDateStr = whiteFridaySettings?.endDate || '2026-11-30T23:59:59';
    const target = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setWfTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [whiteFridaySettings?.endDate]);

  // Featured products subset
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative pb-20 md:pb-12" dir="rtl" id="home-view">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-white pt-8 sm:pt-12 md:pt-16 pb-14 md:pb-20 border-b border-slate-200/80 overflow-hidden shrink-0">
        {/* Soft luxury ambient background glows */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-20 -top-20 w-[550px] h-[550px] bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-sky-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-amber-50/50 rounded-full blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Right Column: Arabic Text Content & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-right order-2 lg:order-1">
              {/* Eyebrow Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-200/90 text-amber-900 px-4 py-1.5 rounded-full text-xs font-black tracking-wide mb-6 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>النظافة اللي تستاهليها.. جودة ذهبية وفخامة تدوم ✨</span>
              </motion.div>
              
              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] mb-6 leading-[1.25] tracking-tight"
              >
                مرحباً بكِ في عالم <br />
                <span className="font-sans font-black text-amber-500 tracking-tight drop-shadow-xs">
                  GOLDCLEAN
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 block mt-1">
                  لأرقى المنظفات والمعقمات فائقة التركيز
                </span>
              </motion.h1>
              
              {/* Compelling Description */}
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
              >
                نحن في <strong className="text-slate-900 font-bold">جولد كلين</strong> نصنع لكِ تركيبات مبتكرة ومعتمدة تمنحكِ أعلى درجات النظافة العميقة والتعقيم الشامل لمنزلك وملابسك ومطبخك. روائح منعشة تدوم طويلاً وحماية مؤكدة بأفضل أسعار التوفير من المصنع مباشرة.
              </motion.p>
              
              {/* CTAs */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-8"
              >
                <button 
                  onClick={() => setCurrentTab('products')}
                  className="bg-[#111827] hover:bg-amber-600 text-white px-7 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/15 hover:shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] cursor-pointer inline-flex items-center justify-center gap-2 group"
                >
                  <span>تصفح تشكيلة المنتجات</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => setCurrentTab('offers')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xs transition-all duration-300 hover:scale-[1.02] cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>عروض وباقات التوفير</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentTab('about');
                    window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:border-slate-300 cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>تعرّف على مصنعنا</span>
                </button>
              </motion.div>

              {/* Value Trust Indicators Row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 text-right"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">جودة معتمدة ١٠٠٪</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">شحن سريع ومباشر</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">دفع عند الاستلام</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold">ضمان المعاينة</span>
                </div>
              </motion.div>

            </div>

            {/* Left Column: Premium Framed Visual */}
            <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-[310px] sm:max-w-[360px] md:max-w-[420px] w-full"
              >
                {/* Decorative Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/60 border-4 border-white bg-slate-100 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/40 via-transparent to-transparent opacity-50 z-10 pointer-events-none" />
                  
                  <img 
                    src={heroImgSrc} 
                    alt="جولد كلين - GoldClean للمنظفات الفاخرة" 
                    onError={() => setHeroImgSrc(FALLBACK_PRODUCT_IMAGE)}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-[460px] md:max-h-[520px] transition-transform duration-700 group-hover:scale-103"
                  />

                  {/* Floating badge inside image container */}
                  <div className="absolute bottom-4 inset-x-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Star className="w-4 h-4 fill-white text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-extrabold text-slate-900">تركيز فائق ورائحة ممتدة</p>
                        <p className="text-[9px] text-slate-500 font-semibold">اختيار الأمهات والبيوت العصرية</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-lg">
                      الأعلى تقييماً
                    </span>
                  </div>
                </div>

                {/* Floating pill badge top left */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute -top-3 -right-3 z-20 bg-white text-slate-800 border border-slate-200/90 px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-2 hidden sm:flex"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-extrabold text-[#111827]">أصلي ومعتمد ١٠٠٪</span>
                </motion.div>

              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 1.5 WHITE FRIDAY ANNOUNCEMENT BANNER */}
      {whiteFridaySettings?.isActive !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-4 relative z-20">
          <div className="bg-gradient-to-r from-slate-950 via-[#1B1126] to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden group">
            {/* Ambient glowing blobs */}
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-colors" />
            <div className="absolute bottom-0 left-10 w-60 h-60 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 text-center lg:text-right">
              {whiteFridaySettings?.bannerImage && (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-amber-500/40 shrink-0 shadow-lg hidden sm:block">
                  <img
                    src={whiteFridaySettings.bannerImage}
                    alt="White Friday Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Text & Badge */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black shadow-xs mb-3">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>{whiteFridaySettings?.badgeText || 'إعلان عروض الجمعة البيضاء 🔥'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                  {whiteFridaySettings?.title || 'مهرجان عروض وتخفيضات الجمعة البيضاء الكبرى!'}
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 max-w-2xl">
                  {whiteFridaySettings?.subtitle || 'خصومات حصرية تصل حتى 60% على تشكيلة فاخرة من المنظفات والمعقمات — لفترة محدودة وحتى نفاد الكمية!'}
                </p>
              </div>

              {/* Countdown & CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0">
                {/* Mini countdown */}
                <div className="flex items-center gap-1.5 font-mono text-center bg-slate-900/90 border border-amber-500/30 px-3 py-2 rounded-2xl">
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                      {String(wfTimeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans">ساعة</span>
                  </div>
                  <span className="text-amber-500 font-bold">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                      {String(wfTimeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans">دقيقة</span>
                  </div>
                  <span className="text-amber-500 font-bold">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-rose-400 font-mono animate-pulse">
                      {String(wfTimeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans">ثانية</span>
                  </div>
                </div>

                {/* Primary Button to White Friday */}
                <button
                  onClick={() => setCurrentTab('white_friday')}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all duration-300 cursor-pointer flex items-center gap-2 group/btn"
                >
                  <Sparkles className="w-4 h-4 text-slate-950 group-hover/btn:rotate-12 transition-transform" />
                  <span>تسوق عروض الجمعة البيضاء الآن</span>
                  <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 2. MAIN CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-black text-[#111827]">تصفح حسب الفئات الرئيسية</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              اختر الفئة لاكتشاف أفضل حلول النظافة والتعقيم المتخصصة لكل ركن في منزلك
            </p>
          </div>
          <button 
            onClick={() => { setActiveCategory('all'); setCurrentTab('products'); }}
            className="text-amber-600 hover:text-amber-700 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>عرض كافة المعروضات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {loading ? (
            // Skeleton Loader for Categories
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs animate-pulse text-center">
                <div className="w-12 h-12 bg-slate-200 rounded-xl mx-auto mb-3" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4 mx-auto" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.key, cat.name);
              return (
                <button 
                  key={cat.id || cat.key}
                  onClick={() => { setActiveCategory(cat.key); setCurrentTab('products'); }}
                  className="bg-white hover:bg-gradient-to-b hover:from-amber-50/50 hover:to-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all duration-300 text-center group cursor-pointer flex flex-col items-center justify-between min-h-[140px]"
                >
                  <div className="w-13 h-13 bg-amber-50/80 group-hover:bg-amber-500 rounded-2xl mx-auto mb-3 flex items-center justify-center text-amber-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs border border-amber-100">
                    <IconComponent className="w-6 h-6 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-amber-700 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 group-hover:text-amber-600 transition-colors flex items-center justify-center gap-0.5 mt-1 font-semibold">
                      <span>تصفح</span>
                      <span>&larr;</span>
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 text-center col-span-full bg-white p-6 rounded-2xl border border-slate-200">
              جاري تجهيز فئات المنتجات...
            </p>
          )}
        </div>
      </section>

      {/* 2.5 WHITE FRIDAY SHOWCASE SECTION */}
      {whiteFridayProducts.length > 0 && (
        <section className="bg-gradient-to-b from-slate-950 via-[#101625] to-slate-950 border-y border-amber-500/30 py-12 md:py-16 shrink-0 relative overflow-hidden" id="home-white-friday-section">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-black mb-2 shadow-xs">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>تخفيضات موسم الجمعة البيضاء الحصرية 🏷️</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  عروض ومنتجات الجمعة البيضاء المختارة
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                  أسعار استثنائية وتخفيضات تصل إلى 60% مباشرة من المصنع، سارية حتى نفاد الكمية
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('white_friday')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <span>مشاهدة كافة عروض الجمعة البيضاء ({whiteFridayDecomposedOffers.length})</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {whiteFridayDecomposedOffers.slice(0, 8).map((offer) => {
                return (
                  <div
                    key={offer.id}
                    className="bg-slate-900/90 rounded-3xl border border-amber-500/30 hover:border-amber-400 p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2 relative z-10">
                      <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-xl shadow-xs flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-300 animate-bounce" />
                        <span>{offer.discountPct > 0 ? `-${offer.discountPct}%` : 'تخفيض'}</span>
                      </span>
                      {offer.badge && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-[120px]">
                          {offer.badge}
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => onSelectProduct?.(offer.product, offer.quantity)}
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 relative mb-3 cursor-pointer border border-slate-800"
                    >
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-medium inline-block mb-1">
                          {offer.isBundle ? `باقة توفير (${offer.quantity} عبوات)` : offer.volume}
                        </span>
                        <h4
                          onClick={() => onSelectProduct?.(offer.product, offer.quantity)}
                          className="font-extrabold text-xs sm:text-sm text-white hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                          title={offer.title}
                        >
                          {offer.title}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-800 mt-2">
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                              {offer.price} <span className="text-xs text-amber-300">ج.م</span>
                            </span>
                            {offer.originalPrice > offer.price && (
                              <span className="text-xs text-slate-400 line-through font-mono block">
                                {offer.originalPrice} ج.م
                              </span>
                            )}
                          </div>
                          {offer.savings > 0 && (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              وفري {offer.savings} ج.م
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => onAddToCart?.(offer.product, e, offer.quantity)}
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{offer.isBundle ? `أضف باقة (${offer.quantity}) عبوات` : 'أضف للسلة'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. PROMOTIONAL OFFERS & BUNDLES SECTION */}
      {offers.length > 0 && (
        <section className="bg-gradient-to-b from-rose-50/60 via-amber-50/30 to-slate-50 border-y border-rose-200/60 py-12 md:py-16 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Offers Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-xs font-black mb-2 border border-rose-200">
                  <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>أقوى باقات التوفير والتخفيضات الحصرية 🔥</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-[#111827]">
                  باقات التوفير الاقتصادية المتكاملة
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  اشتري باقتك المفضلة المجمّعة ووفّري الكثير مقارنة بالشراء الفردي مع ضمان أعلى جودة
                </p>
              </div>

              <button 
                onClick={() => setCurrentTab('offers')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>تصفح كافة باقات العروض ({offers.length})</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Offers Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.slice(0, 6).map((off) => {
                const savingsVal = off.savings || Math.max(0, off.originalPrice - off.offerPrice);
                const discountPercent = off.originalPrice > 0 ? Math.round((savingsVal / off.originalPrice) * 100) : 0;
                const totalPieces = off.items ? off.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                
                // Resolve images
                const directImage = off.image && off.image.trim() !== '' ? off.image : null;
                const resolvedItemImages = (off.items || []).map((it) => {
                  if (it.image && it.image.trim() !== '') return { name: it.productName, qty: it.quantity, img: it.image };
                  const matchedProd = products.find(p => p.id === it.productId || p.name === it.productName);
                  return { 
                    name: it.productName, 
                    qty: it.quantity, 
                    img: matchedProd?.image || FALLBACK_PRODUCT_IMAGE
                  };
                });
                const primaryFallbackImage = resolvedItemImages[0]?.img || FALLBACK_PRODUCT_IMAGE;

                return (
                  <div 
                    key={`home-offer-${off.id}`} 
                    onClick={() => setCurrentTab('offers')} 
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group overflow-hidden"
                  >
                    <div>
                      {/* Offer Media Box */}
                      <div className="h-52 bg-gradient-to-b from-slate-50 to-rose-50/30 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-slate-100 p-3 relative group-hover:border-rose-200 transition-all">
                        {/* Badges on top */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>{off.badge || 'عرض توفير'}</span>
                          </span>
                          {discountPercent > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-2xs">
                              خصم {discountPercent}%
                            </span>
                          )}
                          {off.isFreeShipping && (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>شحن مجاني 🚚</span>
                            </span>
                          )}
                          {!off.isAvailable && (
                            <span className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs">
                              غير متوفر حالياً
                            </span>
                          )}
                        </div>

                        {/* Bundle pieces counter pill */}
                        {totalPieces > 0 && (
                          <div className="absolute bottom-2.5 right-2.5 z-10">
                            <span className="bg-[#111827]/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                              باقة {totalPieces} قطع
                            </span>
                          </div>
                        )}

                        {/* Images Display */}
                        {directImage ? (
                          <img 
                            src={directImage} 
                            alt={off.title} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : resolvedItemImages.length > 1 ? (
                          <div className="grid grid-cols-2 gap-2 w-full h-full items-center justify-center">
                            {resolvedItemImages.slice(0, 4).map((itImg, idx) => (
                              <div key={idx} className="h-full bg-white/95 rounded-xl p-1.5 flex flex-col items-center justify-center border border-slate-100 shadow-2xs overflow-hidden">
                                <img 
                                  src={itImg.img} 
                                  alt={itImg.name} 
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                                  referrerPolicy="no-referrer"
                                  className="max-h-14 object-contain group-hover:scale-105 transition-transform" 
                                />
                                <span className="text-[9px] font-extrabold text-slate-700 truncate w-full text-center mt-0.5">
                                  {itImg.qty}× {itImg.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <img 
                            src={primaryFallbackImage} 
                            alt={off.title} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2" 
                          />
                        )}
                      </div>

                      {/* Title & Short Description */}
                      <h3 className="font-black text-slate-900 text-sm md:text-base mb-1.5 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {off.title}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 mb-3.5 leading-relaxed font-medium">
                        {off.description}
                      </p>
                      
                      {/* Mini Items Checklist */}
                      <div className="text-[11px] text-slate-700 bg-slate-50/90 p-3 rounded-2xl border border-slate-150/80 mb-4 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">محتويات هذه الباقة:</span>
                        {(off.items || []).slice(0, 4).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] sm:text-[11px]">
                            <span className="font-bold truncate flex items-center gap-1 text-slate-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{it.quantity}× {it.productName}</span>
                            </span>
                            <span className="text-slate-400 font-mono text-[9px] shrink-0 mr-1.5">
                              ({it.unitPrice * it.quantity} ج)
                            </span>
                          </div>
                        ))}
                        {(off.items || []).length > 4 && (
                          <span className="text-[10px] font-bold text-amber-600 block text-left">
                            + {(off.items || []).length - 4} منتجات أخرى
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Add to Cart Action */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          {off.originalPrice > off.offerPrice && (
                            <span className="text-xs text-slate-400 line-through ml-2 font-mono">
                              {off.originalPrice} ج
                            </span>
                          )}
                          <span className="text-lg font-black text-rose-600 font-mono">
                            {off.offerPrice} <span className="text-xs font-sans">جنيه</span>
                          </span>
                        </div>
                        {savingsVal > 0 && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            وفّري {savingsVal} جنيه
                          </span>
                        )}
                      </div>

                      <button
                        id={`home-offer-add-btn-${off.id}`}
                        disabled={!off.isAvailable}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddOfferToCart(off, e);
                        }}
                        className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs ${
                          !off.isAvailable
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow-md'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{!off.isAvailable ? 'الباقة غير متوفرة' : 'أضف الباقة للسلة'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED PRODUCTS SHOWCASE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 shrink-0">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>تشكيلة مختارة بعناية فائقة</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#111827]">
              المنتجات الأكثر طلباً وتميزاً
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              أفضل تركيبات المنظفات والمعقمات التي تمنحك أقصى درجات النظافة وحازت على ثقة عملائنا
            </p>
          </div>

          <button 
            onClick={() => setCurrentTab('products')}
            className="text-amber-600 hover:text-amber-700 text-xs sm:text-sm font-extrabold hover:underline cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>عرض كافة المنتجات ({products.length})</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs animate-pulse">
                <div className="h-44 bg-slate-200 rounded-xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-200 rounded-xl" />
              </div>
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product) => {
              const categoryObj = categories.find(c => c.key === product.category);
              return (
                <div 
                  key={`featured-${product.id}`} 
                  onClick={() => onSelectProduct ? onSelectProduct(product) : setCurrentTab('products')}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                >
                  <div>
                    {/* Image Box */}
                    <div className="h-48 sm:h-52 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-slate-100 p-3 relative group-hover:bg-amber-50/20 transition-colors">
                      {/* Availability Tag */}
                      <span className={`absolute top-2.5 right-2.5 z-10 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs ${
                        product.isAvailable 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {product.isAvailable ? 'متوفر' : 'غير متوفر'}
                      </span>

                      {/* Category tag */}
                      {categoryObj && (
                        <span className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-150">
                          {categoryObj.name}
                        </span>
                      )}

                      <img 
                        src={product.image || FALLBACK_PRODUCT_IMAGE} 
                        alt={product.name} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-2 group-hover:scale-108 transition-transform duration-500"
                      />

                      {/* Quick Inspect Hover Overlay Button */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectProduct) onSelectProduct(product);
                            else setCurrentTab('products');
                          }}
                          className="w-full bg-[#111827]/90 hover:bg-[#111827] text-white py-1.5 rounded-xl text-[11px] font-bold backdrop-blur-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة تفاصيل المنتج</span>
                        </button>
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <h3 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-amber-600 transition-colors line-clamp-1 mb-1">
                      {product.name}
                    </h3>
                    
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3 font-medium">
                      {product.description}
                    </p>

                    {/* Volume / Size indicator if available */}
                    {product.volume && (
                      <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md mb-3">
                        الحجم: {product.volume}
                      </span>
                    )}
                  </div>

                  {/* Price & Add to Cart Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">السعر</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        {product.price.toFixed(2)} <span className="text-xs font-sans text-amber-600 font-bold">جنيه</span>
                      </span>
                    </div>

                    <button
                      disabled={!product.isAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAddToCart) {
                          onAddToCart(product, e);
                        } else {
                          setCurrentTab('products');
                        }
                      }}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        !product.isAvailable
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#111827] hover:bg-amber-600 text-white hover:shadow-md'
                      }`}
                      title={product.isAvailable ? 'أضف المنتج للسلة' : 'غير متوفر'}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{product.isAvailable ? 'أضف للسلة' : 'نفد'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 text-center col-span-full p-8 bg-white rounded-3xl border border-slate-200">
              جاري تجهيز قائمة المنتجات المميزة...
            </p>
          )}
        </div>
      </section>

      {/* 5. WHY CHOOSE GOLDCLEAN (Trust-Building Section) */}
      <section className="bg-white border-y border-slate-200/80 py-12 md:py-16 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-amber-600 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full text-xs font-black mb-3 inline-block">
              لماذا تختارين جولد كلين؟
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111827] mb-2">
              الجودة، الأمان، والتوفير في مكان واحد
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              نلتزم بتقديم تجربة تسوق موثوقة تضمن لكِ أعلى مواصفات النظافة العالمية مباشرة إلى باب بيتك
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#F8FAFC] hover:bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs border border-amber-200">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                شحن سريع وموثوق
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                توصيل محكم ومباشر لباب منزلك لكافة المحافظات والدول العربية مع تغليف آمن يمنع التسريب.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F8FAFC] hover:bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs border border-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                جودة معتمدة وفعالة
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                تركيبات أصلية ١٠٠٪ فائقة التركيز وخالية من المواد الضارة لضمان أمان عائلتك وحماية أسطحك.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F8FAFC] hover:bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs border border-blue-200">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                الدفع عند الاستلام
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                تسوقي بأمان تام، حيث يمكنك معاينة طلبك والتأكد من سلامته وجودته قبل دفع القيمة نقداً للمندوب.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#F8FAFC] hover:bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100/70 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs border border-rose-200">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                أسعار المصنع المباشرة
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                وفّري تكلفة الوسطاء واحصلي على أرقى منتجات النظافة بأسعار تنافسية وباقات توفير شهرية ضخمة.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. MANUFACTURING & BRAND SHOWCASE STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 shrink-0">
        <div className="bg-gradient-to-br from-[#111827] via-slate-900 to-[#111827] rounded-3xl p-6 sm:p-10 md:p-12 text-white relative overflow-hidden shadow-xl border border-slate-800">
          {/* Subtle Decorative Ambient Lines */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مصنع جولد كلين للمنظفات — صناعة بمعايير عالمية</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight">
                تركيبات متطورة تمنحك الثقة في كل استخدام
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
                نفخر بامتلاكنا خطوط إنتاج حديثة ومعامل مراقبة جودة تضمن نقاء المواد الفعالة ورائحة تدوم طويلاً، لنوفر لكِ بيئة صحية خالية من الجراثيم ومظهر براق يسر الناظرين.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button 
                onClick={() => setCurrentTab('products')}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>تسوق كافة المنتجات الآن</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => {
                  setCurrentTab('about');
                  window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer');
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>تعرّف على مصنعنا وشهاداتنا</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PREMIUM FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-16 md:pb-8 shrink-0 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            
            {/* Col 1: Brand Info */}
            <div className="text-right">
              <div 
                className="flex items-center gap-2 cursor-pointer mb-4" 
                onClick={() => setCurrentTab('home')}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-xs font-sans">
                  G
                </div>
                <span className="text-lg font-black tracking-tight text-amber-500 font-sans">
                  GOLD<span className="text-[#111827]">CLEAN</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                متجر ومصنع جولد كلين للمنظفات الفاخرة والمعقمات. نقدم أرقى حلول التنظيف المنزلي والصناعي بتركيزات فعالة وأسعار التوفير من المصنع مباشرة.
              </p>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">منتجات مرخصة ومطابقة للمواصفات</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="text-right">
              <h4 className="font-black text-slate-900 text-sm mb-4 border-r-3 border-amber-500 pr-2">
                روابط سريعة
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <button 
                    onClick={() => setCurrentTab('home')} 
                    className="hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    الصفحة الرئيسية
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { setActiveCategory('all'); setCurrentTab('products'); }} 
                    className="hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    تشكيلة المنتجات
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentTab('offers')} 
                    className="hover:text-rose-600 transition-colors cursor-pointer text-rose-600 flex items-center gap-1"
                  >
                    <span>باقات وعروض التوفير</span>
                    <span className="text-[10px]">🔥</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentTab('about');
                      window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer');
                    }} 
                    className="hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    عن المصنع والشركة
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentTab('complaints')} 
                    className="hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    الشكاوى والمقترحات
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Product Categories */}
            <div className="text-right">
              <h4 className="font-black text-slate-900 text-sm mb-4 border-r-3 border-amber-500 pr-2">
                فئات المنظفات
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat.id || cat.key}>
                    <button
                      onClick={() => { setActiveCategory(cat.key); setCurrentTab('products'); }}
                      className="hover:text-amber-600 transition-colors cursor-pointer truncate max-w-full text-right"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="text-slate-400 text-xs">جاري تحميل الفئات...</li>
                )}
              </ul>
            </div>

            {/* Col 4: Trust & Shopping Assurance */}
            <div className="text-right">
              <h4 className="font-black text-slate-900 text-sm mb-4 border-r-3 border-amber-500 pr-2">
                ضمانات التسوق
              </h4>
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>الدفع بعد الاستلام والمعاينة</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    لا حاجة لبطاقات ائتمانية، ادفعي نقداً عند وصول المندوب لباب بيتك.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>توصيل سريع وآمن</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    نغطي جميع محافظات جمهورية مصر العربية والدول العربية.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Developer Bar */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-right">
            <p>
              جميع الحقوق محفوظة © {new Date().getFullYear()} <strong className="text-slate-800">GoldClean - جولد كلين للمنظفات الفاخرة</strong>.
            </p>

            {/* Developer Credit */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs">
              <Code className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>تطوير:</span>
              <strong className="text-slate-900 font-bold">Jalal Mahmoud</strong>
              <span className="text-slate-300 mx-1">•</span>
              <a 
                href="mailto:jalalmahmoud8000@gmail.com" 
                className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold transition-colors"
                title="تواصل مع المطور عبر البريد الإلكتروني"
                dir="ltr"
              >
                <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                <span>jalalmahmoud8000@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
