'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Percent, 
  Flame, 
  Truck, 
  CheckCircle2, 
  ShoppingCart, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Tag,
  PackageCheck,
  Search,
  X,
  ArrowUpDown,
  RotateCcw,
  ShieldCheck,
  Award,
  BadgePercent,
  Check
} from 'lucide-react';
import { Offer, Product } from '../../lib/types/store';

interface OffersViewProps {
  offers: Offer[];
  products: Product[];
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  onAddOfferToCart: (offer: Offer, e: React.MouseEvent) => void;
  loading?: boolean;
}

const FALLBACK_OFFER_IMAGE = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';

type SortOption = 'default' | 'savings-desc' | 'price-asc' | 'price-desc' | 'discount-desc';
type FilterOption = 'all' | 'free-shipping' | 'available-only';

export default function OffersView({
  offers,
  products,
  setCurrentTab,
  onAddOfferToCart,
  loading = false
}: OffersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  
  // Track expanded bundle contents for each card
  const [expandedOfferIds, setExpandedOfferIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (offerId: string) => {
    setExpandedOfferIds(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  // Find max savings offer to highlight as "Best Value"
  const maxSavingsOfferId = useMemo(() => {
    if (offers.length === 0) return null;
    let maxId = '';
    let maxSav = -1;
    offers.forEach(o => {
      const sav = o.savings || Math.max(0, o.originalPrice - o.offerPrice);
      if (sav > maxSav && o.isAvailable) {
        maxSav = sav;
        maxId = o.id;
      }
    });
    return maxSav > 0 ? maxId : null;
  }, [offers]);

  // Filter offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // Search filter
      const searchMatch = 
        searchTerm.trim() === '' || 
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.items || []).some(it => it.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Option filter
      let optionMatch = true;
      if (filterOption === 'free-shipping') {
        optionMatch = Boolean(offer.isFreeShipping);
      } else if (filterOption === 'available-only') {
        optionMatch = Boolean(offer.isAvailable);
      }

      return searchMatch && optionMatch;
    });
  }, [offers, searchTerm, filterOption]);

  // Sort offers
  const sortedOffers = useMemo(() => {
    const list = [...filteredOffers];
    switch (sortBy) {
      case 'savings-desc':
        return list.sort((a, b) => {
          const savA = a.savings || Math.max(0, a.originalPrice - a.offerPrice);
          const savB = b.savings || Math.max(0, b.originalPrice - b.offerPrice);
          return savB - savA;
        });
      case 'price-asc':
        return list.sort((a, b) => a.offerPrice - b.offerPrice);
      case 'price-desc':
        return list.sort((a, b) => b.offerPrice - a.offerPrice);
      case 'discount-desc':
        return list.sort((a, b) => {
          const savA = a.savings || Math.max(0, a.originalPrice - a.offerPrice);
          const pctA = a.originalPrice > 0 ? (savA / a.originalPrice) : 0;
          const savB = b.savings || Math.max(0, b.originalPrice - b.offerPrice);
          const pctB = b.originalPrice > 0 ? (savB / b.originalPrice) : 0;
          return pctB - pctA;
        });
      default:
        return list;
    }
  }, [filteredOffers, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== '') count++;
    if (filterOption !== 'all') count++;
    return count;
  }, [searchTerm, filterOption]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterOption('all');
    setSortBy('default');
  };

  const freeShippingOffersCount = useMemo(() => {
    return offers.filter(o => o.isFreeShipping && o.isAvailable).length;
  }, [offers]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative pb-20 md:pb-12" dir="rtl" id="offers-view">
      
      {/* =========================================================================
          1. OFFERS HERO SECTION
         ========================================================================= */}
      <section className="relative bg-white pt-8 sm:pt-12 pb-12 sm:pb-14 border-b border-slate-200/80 overflow-hidden shrink-0">
        {/* Soft luxury ambient glow */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-24 -top-24 w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-[400px] h-[400px] bg-amber-100/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Right: Headlines & Description */}
            <div className="max-w-2xl text-right">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-black mb-4 shadow-2xs">
                <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>عروض وتخفيضات المصنع الحصرية 🔥</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#111827] mb-3 leading-[1.25] tracking-tight">
                وفّر أكثر مع باقات التوفير المتكاملة
              </h1>

              {/* Persuasive description */}
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed font-medium">
                اختر باقتك المفضلة المجهزة خصيصاً لتلبية احتياجات منزلك الشهرية بأعلى جودة نظافة وأكبر نسبة خصم مقارنة بالشراء الفردي.
              </p>

              {/* Trust Indicators Pill Row */}
              <div className="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-slate-100 text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>توفير حقيقي من سعر المصنع</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>شحن مجاني على باقات مختارة</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>معاينة المنتجات قبل الدفع</span>
                </div>
              </div>
            </div>

            {/* Left: Dynamic Counter Cards */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                  <Percent className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">الباقات المتاحة</span>
                  <span className="text-xl font-black text-rose-600 font-mono">
                    {offers.filter(o => o.isAvailable).length} باقة
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">شحن مجاني</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {freeShippingOffersCount} باقات
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. OFFERS TOOLBAR & FILTERS
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 shrink-0">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterOption('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterOption === 'all'
                  ? 'bg-[#111827] text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              كافة الباقات ({offers.length})
            </button>

            {freeShippingOffersCount > 0 && (
              <button
                onClick={() => setFilterOption('free-shipping')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterOption === 'free-shipping'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/60'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>شحن مجاني فقط ({freeShippingOffersCount})</span>
              </button>
            )}

            <button
              onClick={() => setFilterOption('available-only')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterOption === 'available-only'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              المتوفرة حالياً
            </button>
          </div>

          {/* Search & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Quick Search in Offers */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث في الباقات والعروض..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-7 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-medium transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
              <select
                id="offers-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
              >
                <option value="default">الترتيب الافتراضي</option>
                <option value="savings-desc">الأعلى توفيراً 💰</option>
                <option value="discount-desc">أعلى نسبة خصم %</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </section>

      {/* =========================================================================
          3. PROMOTIONAL OFFERS GRID
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-2xs animate-pulse flex flex-col">
                <div className="h-52 bg-slate-100 rounded-2xl mb-4" />
                <div className="h-5 bg-slate-100 rounded-md w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4" />
                <div className="h-20 bg-slate-100 rounded-2xl mb-4" />
                <div className="mt-auto h-12 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : sortedOffers.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">لم يتم العثور على باقات مطابقة</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {searchTerm 
                ? `لا توجد باقات توفير تطابق بحثك عن "${searchTerm}". حاول استخدام كلمات بحث مختلفة.`
                : 'يقوم فريق جولد كلين بتجهيز باقات توفير جديدة قريباً. يمكنك تصفح المنتجات الفردية الآن.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeFiltersCount > 0 ? (
                <button
                  onClick={handleResetFilters}
                  className="bg-[#111827] hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الفلاتر</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentTab('products')}
                  className="bg-[#111827] hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>تصفح المنتجات الفردية</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Real Offers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" id="storefront-offers-grid">
            {sortedOffers.map((offer) => {
              const savingsVal = offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice);
              const discountPercent = offer.originalPrice > 0 ? Math.round((savingsVal / offer.originalPrice) * 100) : 0;
              const totalPieces = (offer.items || []).reduce((sum, item) => sum + item.quantity, 0);
              const isBestValue = offer.id === maxSavingsOfferId;
              const isExpanded = Boolean(expandedOfferIds[offer.id]);
              const itemsList = offer.items || [];
              const hasManyItems = itemsList.length > 3;
              const displayedItems = isExpanded || !hasManyItems ? itemsList : itemsList.slice(0, 3);

              // Resolve direct image or multi-product collage
              const directImage = offer.image && offer.image.trim() !== '' ? offer.image : null;
              const resolvedItemImages = itemsList.map((it) => {
                if (it.image && it.image.trim() !== '') return { name: it.productName, qty: it.quantity, img: it.image };
                const matchedProd = products.find(p => p.id === it.productId || p.name === it.productName);
                return { 
                  name: it.productName, 
                  qty: it.quantity, 
                  img: matchedProd?.image || FALLBACK_OFFER_IMAGE
                };
              });
              const primaryFallbackImage = resolvedItemImages[0]?.img || FALLBACK_OFFER_IMAGE;

              return (
                <motion.div
                  layout
                  key={offer.id}
                  id={`offer-card-${offer.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden relative shadow-2xs hover:shadow-xl hover:-translate-y-1 ${
                    isBestValue 
                      ? 'border-amber-300 ring-2 ring-amber-400/20' 
                      : 'border-slate-200/90 hover:border-amber-300'
                  }`}
                >
                  <div>
                    {/* A. Image Presentation Area */}
                    <div className="relative bg-slate-50 p-4 border-b border-slate-100 overflow-hidden">
                      
                      {/* Top Badges (Clean, uncrowded layout) */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap">
                        {/* Discount Badge */}
                        {discountPercent > 0 && (
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                            <BadgePercent className="w-3.5 h-3.5" />
                            <span>خصم {discountPercent}%</span>
                          </span>
                        )}

                        {/* Free Shipping Badge */}
                        {offer.isFreeShipping && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>شحن مجاني</span>
                          </span>
                        )}

                        {/* Custom Badge or Best Value */}
                        {isBestValue && (
                          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>الأعلى توفيراً</span>
                          </span>
                        )}

                        {offer.badge && !isBestValue && (
                          <span className="bg-[#111827] text-amber-400 text-[10px] font-black px-2 py-1 rounded-lg shadow-2xs">
                            {offer.badge}
                          </span>
                        )}
                      </div>

                      {/* Total Pieces Badge (Bottom Left of Image) */}
                      {totalPieces > 0 && (
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="bg-[#111827]/85 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-2xs font-mono">
                            باقة {totalPieces} قطع
                          </span>
                        </div>
                      )}

                      {/* Image Container with Proper Aspect Ratio */}
                      <div className="h-48 sm:h-52 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden p-3 relative group-hover:bg-amber-50/10 transition-colors">
                        {directImage ? (
                          <img 
                            src={directImage} 
                            alt={offer.title} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_OFFER_IMAGE; }}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : resolvedItemImages.length > 1 ? (
                          <div className="grid grid-cols-2 gap-2 w-full h-full items-center justify-center">
                            {resolvedItemImages.slice(0, 4).map((itImg, idx) => (
                              <div key={idx} className="h-full bg-slate-50/90 rounded-xl p-1.5 flex flex-col items-center justify-center border border-slate-100 overflow-hidden shadow-2xs">
                                <img 
                                  src={itImg.img} 
                                  alt={itImg.name} 
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_OFFER_IMAGE; }}
                                  referrerPolicy="no-referrer"
                                  className="max-h-12 sm:max-h-14 object-contain group-hover:scale-105 transition-transform" 
                                />
                                <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center mt-0.5">
                                  {itImg.qty}× {itImg.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <img 
                            src={primaryFallbackImage} 
                            alt={offer.title} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_OFFER_IMAGE; }}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        )}
                      </div>
                    </div>

                    {/* B. Offer Information Under Image */}
                    <div className="p-5 pb-3">
                      
                      {/* Availability Tag */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <PackageCheck className="w-3 h-3 text-slate-500" />
                          <span>عرض مجمع</span>
                        </span>

                        {!offer.isAvailable && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            نفدت الكمية حالياً
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-black text-slate-900 text-base sm:text-lg mb-1.5 group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
                        {offer.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4 font-medium">
                        {offer.description}
                      </p>

                      {/* C. Bundle Contents (Included Products Rows) */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 mb-2">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60">
                          <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                            <span>محتويات هذه الباقة ({itemsList.length}):</span>
                          </span>
                        </div>

                        {/* Items Rows */}
                        <div className="space-y-1.5">
                          {displayedItems.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-700 py-0.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-amber-700 text-[10px] font-black font-mono flex items-center justify-center shrink-0 shadow-2xs">
                                  {it.quantity}×
                                </span>
                                <span className="font-semibold text-slate-800 truncate text-[11px]">
                                  {it.productName}
                                </span>
                                {it.volume && (
                                  <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                                    ({it.volume})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0 mr-1">
                                {(it.unitPrice * it.quantity).toFixed(0)} ج
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Expandable interaction for bundles with many items */}
                        {hasManyItems && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(offer.id);
                            }}
                            className="w-full mt-2 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>
                              {isExpanded 
                                ? 'طي قائمة المحتويات' 
                                : `عرض كافة المحتويات (+${itemsList.length - 3} منتجات)`}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* D. Card Footer: High-Priority Pricing, Savings & Add-To-Cart */}
                  <div className="p-5 pt-0 space-y-3">
                    
                    {/* Pricing Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">سعر العرض</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-[#111827] font-mono">
                            {offer.offerPrice.toFixed(0)}
                          </span>
                          <span className="text-xs font-bold text-amber-600 font-sans">جنيه</span>
                          {offer.originalPrice > offer.offerPrice && (
                            <span className="text-xs text-slate-400 line-through font-mono mr-1.5">
                              {offer.originalPrice.toFixed(0)} ج
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Savings Pill */}
                      {savingsVal > 0 && (
                        <div className="text-left">
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs inline-block font-mono">
                            وفّري {savingsVal} جنيه 💰
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Free Shipping Strip */}
                    {offer.isFreeShipping && (
                      <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/80 flex items-center justify-center gap-1.5 text-emerald-900 text-[11px] font-bold shadow-2xs">
                        <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>مؤهلة للشحن والتوصيل المجاني بالكامل 🚚</span>
                      </div>
                    )}

                    {/* Add to Cart CTA Button */}
                    <button
                      id={`offer-add-btn-${offer.id}`}
                      disabled={!offer.isAvailable}
                      onClick={(e) => onAddOfferToCart(offer, e)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                        !offer.isAvailable
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/20 hover:scale-[1.01]'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{!offer.isAvailable ? 'الباقة غير متوفرة حالياً' : 'أضف باقة العرض إلى السلة'}</span>
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
