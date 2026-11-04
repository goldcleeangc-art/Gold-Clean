'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Truck, 
  ShieldCheck, 
  ShoppingBag, 
  Check, 
  Link2, 
  ShoppingCart,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  Tag,
  Sparkles,
  Star,
  Eye,
  RotateCcw,
  Shirt,
  Droplets,
  Sparkle,
  ChevronLeft,
  Filter,
  CheckCircle2,
  Award,
  Banknote,
  Sliders,
  Flame
} from 'lucide-react';
import { Product, Category } from '../../lib/types/store';

interface ProductsViewProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  priceRange: number;
  setPriceRange: (price: number) => void;
  loading: boolean;
  filteredProducts: Product[];
  allProducts?: Product[];
  setCurrentTab?: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onCopyLink: (id: string) => void;
  copiedLinkId: string | null;
}

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'name-asc';

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

export default function ProductsView({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  priceRange,
  setPriceRange,
  loading,
  filteredProducts,
  allProducts = [],
  setCurrentTab,
  onSelectProduct,
  onAddToCart,
  onCopyLink,
  copiedLinkId
}: ProductsViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Derive maximum product price safely
  const maxAvailablePrice = useMemo(() => {
    const source = allProducts.length > 0 ? allProducts : filteredProducts;
    if (source.length === 0) return 500;
    const max = Math.max(...source.map(p => p.price || 0));
    return Math.ceil(max / 50) * 50 || 500;
  }, [allProducts, filteredProducts]);

  // Derive product count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = allProducts.length > 0 ? allProducts : filteredProducts;
    source.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts, filteredProducts]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'all') count++;
    if (searchTerm.trim() !== '') count++;
    if (priceRange > 0) count++;
    return count;
  }, [activeCategory, searchTerm, priceRange]);

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchTerm('');
    setPriceRange(0);
  };

  // Sort products: White Friday products ALWAYS appear before regular products!
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    const sortByWf = (a: Product, b: Product) => {
      // 1. Primary sort: Checked White Friday products appear before unchecked products
      const aWf = Boolean(a.isWhiteFriday);
      const bWf = Boolean(b.isWhiteFriday);
      if (aWf && !bWf) return -1;
      if (!aWf && bWf) return 1;

      // 2. If both are White Friday, pinned products come first
      const aPinned = Boolean(a.isWhiteFridayPinned);
      const bPinned = Boolean(b.isWhiteFridayPinned);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      return 0;
    };

    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => {
          const wfDiff = sortByWf(a, b);
          if (wfDiff !== 0) return wfDiff;
          const priceA = (a.isWhiteFriday && typeof a.whiteFridayPrice === 'number' && a.whiteFridayPrice > 0) ? a.whiteFridayPrice : a.price;
          const priceB = (b.isWhiteFriday && typeof b.whiteFridayPrice === 'number' && b.whiteFridayPrice > 0) ? b.whiteFridayPrice : b.price;
          return priceA - priceB;
        });
      case 'price-desc':
        return list.sort((a, b) => {
          const wfDiff = sortByWf(a, b);
          if (wfDiff !== 0) return wfDiff;
          const priceA = (a.isWhiteFriday && typeof a.whiteFridayPrice === 'number' && a.whiteFridayPrice > 0) ? a.whiteFridayPrice : a.price;
          const priceB = (b.isWhiteFriday && typeof b.whiteFridayPrice === 'number' && b.whiteFridayPrice > 0) ? b.whiteFridayPrice : b.price;
          return priceB - priceA;
        });
      case 'rating-desc':
        return list.sort((a, b) => {
          const wfDiff = sortByWf(a, b);
          if (wfDiff !== 0) return wfDiff;
          return (b.rating || 0) - (a.rating || 0);
        });
      case 'name-asc':
        return list.sort((a, b) => {
          const wfDiff = sortByWf(a, b);
          if (wfDiff !== 0) return wfDiff;
          return (a.name || '').localeCompare(b.name || '', 'ar');
        });
      default:
        return list.sort(sortByWf);
    }
  }, [filteredProducts, sortBy]);

  const currentCategoryName = useMemo(() => {
    if (activeCategory === 'all') return 'كافة المنتجات';
    const found = categories.find(c => c.key === activeCategory);
    return found ? found.name : 'الفئة المحددة';
  }, [activeCategory, categories]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F8FAFC]" dir="rtl" id="products-catalog-page">
      
      {/* =========================================================================
          1. RIGHT SIDEBAR FILTERS (Desktop)
         ========================================================================= */}
      <aside 
        className="w-72 lg:w-80 bg-white border-l border-slate-200/90 p-5 lg:p-6 hidden md:flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-2xs" 
        id="sidebar-filters"
      >
        {/* Sidebar Header & Clear Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111827]">تصفية المنظفات</h3>
              <p className="text-[10px] text-slate-400 font-medium">حدّد خياراتك المفضلة</p>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="إعادة ضبط كافة الفلاتر"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* 1. Search Filter */}
        <div>
          <label htmlFor="sidebar-search" className="block font-bold text-xs text-slate-800 mb-2">
            البحث في المنتجات
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              id="sidebar-search"
              type="text" 
              placeholder="ابحث باسم المنتج أو التركيبة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl py-2.5 pr-9 pl-7 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Categories Selectable List */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold text-xs text-slate-800">التصنيفات المتاحة</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {categories.length + 1} فئات
            </span>
          </div>

          <div className="space-y-1 text-xs">
            {/* All Products Item */}
            <button 
              id="sidebar-cat-btn-all"
              onClick={() => setActiveCategory('all')}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all text-right cursor-pointer group ${
                activeCategory === 'all' 
                  ? 'bg-amber-50 text-amber-800 font-extrabold border border-amber-200/90 shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeCategory === 'all' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">كافة المعروضات</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                activeCategory === 'all' ? 'bg-amber-200/70 text-amber-900 font-bold' : 'text-slate-400 bg-slate-100'
              }`}>
                {allProducts.length > 0 ? allProducts.length : filteredProducts.length}
              </span>
            </button>

            {/* Dynamic Categories */}
            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat.key, cat.name);
              const isSelected = activeCategory === cat.key;
              const count = categoryCounts[cat.key] || 0;

              return (
                <button 
                  key={cat.key}
                  id={`sidebar-cat-btn-${cat.key}`}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all text-right cursor-pointer group ${
                    isSelected 
                      ? 'bg-amber-50 text-amber-800 font-extrabold border border-amber-200/90 shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-amber-200/70 text-amber-900 font-bold' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Price Filter */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="input-filter-price" className="font-bold text-xs text-slate-800">
              السعر الأقصى
            </label>
            {priceRange > 0 && (
              <button 
                onClick={() => setPriceRange(0)} 
                className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer"
              >
                إلغاء الحد
              </button>
            )}
          </div>

          <div className="relative mb-3">
            <input 
              id="input-filter-price"
              type="number"
              min="0"
              max={maxAvailablePrice}
              value={priceRange || ''}
              onChange={(e) => setPriceRange(Number(e.target.value) || 0)}
              placeholder="مثال: 150"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-3 pl-14 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-bold"
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-amber-600 pointer-events-none">
              جنيه
            </span>
          </div>

          {/* Quick Price Slider */}
          <div className="space-y-1.5">
            <input 
              type="range"
              min="0"
              max={maxAvailablePrice}
              step="10"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>0 ج</span>
              {priceRange > 0 ? (
                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  حتى {priceRange} ج
                </span>
              ) : (
                <span>الكل (بلا حد)</span>
              )}
              <span>{maxAvailablePrice} ج</span>
            </div>
          </div>
        </div>

        {/* 4. Trust & Delivery Box */}
        <div className="mt-auto bg-gradient-to-br from-amber-50/50 to-slate-50 p-4 rounded-2xl border border-amber-200/60 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>ضمان مصنع GoldClean</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            جميع منتجاتنا مصنعة بأعلى مواصفات النقاء وتخضع لاختبارات التعقيم الصارمة.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>شحن مباشر وسريع لباب البيت</span>
          </div>
        </div>

      </aside>

      {/* =========================================================================
          2. MAIN PRODUCTS CATALOG (Header + Toolbar + Grid)
         ========================================================================= */}
      <section 
        className="flex-1 flex flex-col overflow-y-auto" 
        dir="rtl" 
        id="product-grid-section"
      >
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col flex-1">
          
          {/* A. Compact Page Header & Breadcrumbs */}
          <div className="mb-6 pb-5 border-b border-slate-200/80">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <button 
                onClick={() => setCurrentTab ? setCurrentTab('home') : null}
                className="hover:text-amber-600 transition-colors cursor-pointer"
              >
                الرئيسية
              </button>
              <span>/</span>
              <span className="text-slate-700 font-semibold">منتجاتنا</span>
              {activeCategory !== 'all' && (
                <>
                  <span>/</span>
                  <span className="text-amber-600 font-bold">{currentCategoryName}</span>
                </>
              )}
            </div>

            {/* Header Title & Subtitle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#111827] flex items-center gap-2.5">
                  <span>منتجات جولد كلين</span>
                  <span className="text-xs sm:text-sm font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-mono">
                    {sortedProducts.length} منتج
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  استكشف باقة منظفات ومعقمات فائقة التركيز بأعلى جودة لحماية ونظافة منزلك
                </p>
              </div>

              {/* Mobile Filter Button */}
              <div className="md:hidden w-full sm:w-auto mt-2 sm:mt-0 flex items-center gap-2">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="flex-1 sm:flex-initial bg-[#111827] hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>تصفية المنتجات</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* B. Products Toolbar (Sort, View Mode, Result Count) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Right: Results Count & Category Label */}
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-900">{currentCategoryName}</span>
              <span className="text-slate-300">•</span>
              <span>عرض {sortedProducts.length} منتج</span>
            </div>

            {/* Left: Sorting & View Mode Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              
              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                <label htmlFor="products-sort-select" className="text-slate-500 text-[11px] font-semibold hidden sm:inline">
                  ترتيب حسب:
                </label>
                <select
                  id="products-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all cursor-pointer"
                >
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="price-asc">السعر: من الأقل للأعلى</option>
                  <option value="price-desc">السعر: من الأعلى للأقل</option>
                  <option value="rating-desc">الأعلى تقييماً ★</option>
                  <option value="name-asc">الاسم: أ - ي</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-white text-amber-600 shadow-2xs font-bold' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-white text-amber-600 shadow-2xs font-bold' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="عرض طولي"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* C. Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-500">الفلاتر المطبقة:</span>

              {activeCategory !== 'all' && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                  <span>الفئة: {currentCategoryName}</span>
                  <button 
                    onClick={() => setActiveCategory('all')} 
                    className="hover:text-rose-600 cursor-pointer p-0.5"
                    title="إزالة الفئة"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {searchTerm.trim() !== '' && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                  <span>بحث: &ldquo;{searchTerm}&rdquo;</span>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="hover:text-rose-600 cursor-pointer p-0.5"
                    title="إزالة البحث"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {priceRange > 0 && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                  <span>السعر: حتى {priceRange} جنيه</span>
                  <button 
                    onClick={() => setPriceRange(0)} 
                    className="hover:text-rose-600 cursor-pointer p-0.5"
                    title="إزالة حد السعر"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer mr-2"
              >
                مسح الكل
              </button>
            </div>
          )}

          {/* D. Product Grid or List */}
          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-2xs animate-pulse flex flex-col">
                  <div className="h-52 bg-slate-100 rounded-2xl mb-4" />
                  <div className="h-4 bg-slate-100 rounded-md w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4" />
                  <div className="mt-auto h-10 bg-slate-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col justify-center items-center text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-3xl my-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">لم يتم العثور على أي منتجات مطابقة!</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
                لم نجد أي منظفات توافق الفلاتر أو كلمة البحث الحالية. يرجى تجربة كلمات أخرى أو إعادة ضبط التصفية.
              </p>
              <button 
                onClick={handleResetFilters}
                className="px-6 py-3 bg-[#111827] hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>إعادة ضبط الفلاتر ورؤية كافة المنتجات</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" id="products-catalog-grid">
              {sortedProducts.map((product) => {
                const isOut = !product.isAvailable;
                const categoryObj = categories.find(c => c.key === product.category);

                return (
                  <motion.div
                    layout
                    key={product.id}
                    id={`product-card-${product.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative ${
                      product.isWhiteFriday
                        ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/25 via-white to-white ring-1 ring-amber-300/40'
                        : 'border border-slate-200/80 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      {/* Product Image Area */}
                      <div 
                        className="h-48 sm:h-52 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:bg-amber-50/20 transition-colors border border-slate-100"
                        onClick={() => onSelectProduct(product)}
                      >
                        {/* Status Badges */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-start">
                          {product.isWhiteFriday && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] px-2.5 py-1 rounded-lg font-black border border-amber-400/60 shadow-2xs flex items-center gap-1">
                              <Flame className="w-3 h-3 text-slate-950 fill-slate-950" />
                              <span>{product.whiteFridayBadge || 'عرض الجمعة البيضاء 🔥'}</span>
                            </span>
                          )}

                          {isOut ? (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-rose-200 shadow-2xs">
                              نفد من المخزون
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-emerald-200 shadow-2xs">
                              متوفر بالمخزن
                            </span>
                          )}
                        </div>

                        {/* Category Tag Top Left */}
                        {categoryObj && (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-150">
                            {categoryObj.name}
                          </span>
                        )}

                        {/* Product Volume Badge */}
                        {product.volume && (
                          <span className="absolute bottom-2.5 left-2.5 bg-[#111827]/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md font-bold z-10 font-mono">
                            {product.volume}
                          </span>
                        )}

                        <img 
                          src={product.image || FALLBACK_PRODUCT_IMAGE} 
                          alt={product.name} 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-108"
                        />

                        {/* Quick View Overlay Button */}
                        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProduct(product);
                            }}
                            className="w-full bg-[#111827]/90 hover:bg-[#111827] text-white py-2 rounded-xl text-[11px] font-bold backdrop-blur-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة تفاصيل المنتج</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div>
                        {/* Rating if available */}
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mb-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{product.rating.toFixed(1)}</span>
                            {product.reviewsCount > 0 && (
                              <span className="text-slate-400 text-[10px]">({product.reviewsCount})</span>
                            )}
                          </div>
                        )}

                        <h3 
                          className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer"
                          onClick={() => onSelectProduct(product)}
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Pricing & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">السعر</span>
                        {product.isWhiteFriday && typeof product.whiteFridayPrice === 'number' && product.whiteFridayPrice > 0 && product.whiteFridayPrice < product.price ? (
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-amber-600 font-mono">
                              {product.whiteFridayPrice.toFixed(2)} <span className="text-xs font-sans font-bold">ج.م</span>
                            </span>
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                            {product.price.toFixed(2)} <span className="text-xs font-sans text-amber-600 font-bold">جنيه</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Share link button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onCopyLink(product.id); }}
                          className="p-2.5 rounded-xl flex items-center justify-center transition-colors bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer border border-slate-200/60"
                          title="نسخ رابط المنتج"
                        >
                          {copiedLinkId === product.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
                        </button>

                        {/* Add to Cart button */}
                        <button 
                          id={`add-btn-${product.id}`}
                          disabled={isOut}
                          onClick={(e) => onAddToCart(product, e)}
                          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            isOut 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-[#111827] hover:bg-amber-600 text-white hover:shadow-md'
                          }`}
                          title={isOut ? 'المنتج غير متوفر' : 'أضف إلى السلة'}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isOut ? 'نفد' : 'أضف للسلة'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-4" id="products-catalog-list">
              {sortedProducts.map((product) => {
                const isOut = !product.isAvailable;
                const categoryObj = categories.find(c => c.key === product.category);

                return (
                  <motion.div
                    layout
                    key={product.id}
                    id={`product-card-${product.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-center gap-5 group ${
                      product.isWhiteFriday
                        ? 'border-2 border-amber-400 bg-gradient-to-r from-amber-50/25 via-white to-white ring-1 ring-amber-300/40'
                        : 'border border-slate-200/80 hover:border-amber-300'
                    }`}
                  >
                    {/* List Image Box */}
                    <div 
                      className="w-full sm:w-44 h-40 bg-slate-50 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 cursor-pointer border border-slate-100 group-hover:bg-amber-50/20 transition-colors"
                      onClick={() => onSelectProduct(product)}
                    >
                      <img 
                        src={product.image || FALLBACK_PRODUCT_IMAGE} 
                        alt={product.name} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE; }}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      {product.volume && (
                        <span className="absolute bottom-2 left-2 bg-[#111827]/80 text-white text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">
                          {product.volume}
                        </span>
                      )}
                    </div>

                    {/* List Content */}
                    <div className="flex-1 flex flex-col justify-between w-full">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {product.isWhiteFriday && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <Flame className="w-3 h-3 text-slate-950 fill-slate-950" />
                              <span>{product.whiteFridayBadge || 'عروض الجمعة البيضاء 🔥'}</span>
                            </span>
                          )}

                          {categoryObj && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200/60">
                              {categoryObj.name}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isOut ? 'نفد من المخزون' : 'متوفر بالمخزن'}
                          </span>
                        </div>

                        <h3 
                          className="font-black text-base text-slate-900 group-hover:text-amber-600 transition-colors cursor-pointer mb-1.5"
                          onClick={() => onSelectProduct(product)}
                        >
                          {product.name}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">السعر</span>
                          {product.isWhiteFriday && typeof product.whiteFridayPrice === 'number' && product.whiteFridayPrice > 0 && product.whiteFridayPrice < product.price ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-lg font-black text-amber-600 font-mono">
                                {product.whiteFridayPrice.toFixed(2)} <span className="text-xs font-sans font-bold">ج.م</span>
                              </span>
                              <span className="text-xs text-slate-400 line-through font-mono">
                                {product.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-slate-900 font-mono">
                              {product.price.toFixed(2)} <span className="text-xs font-sans text-amber-600 font-bold">جنيه</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectProduct(product)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
                          >
                            التفاصيل
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); onCopyLink(product.id); }}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/60 cursor-pointer"
                            title="نسخ رابط المنتج"
                          >
                            {copiedLinkId === product.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
                          </button>

                          <button 
                            id={`add-btn-${product.id}`}
                            disabled={isOut}
                            onClick={(e) => onAddToCart(product, e)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isOut 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-[#111827] hover:bg-amber-600 text-white shadow-xs hover:shadow-md'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isOut ? 'نفد' : 'أضف للسلة'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* =========================================================================
          3. MOBILE FILTER DRAWER (Modal on Small Screens)
         ========================================================================= */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-base text-slate-900">تصفية المنتجات</h3>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-5">
                <label className="block font-bold text-xs text-slate-800 mb-2">البحث باسم المنتج</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-9 pl-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Mobile Categories */}
              <div className="mb-5">
                <label className="block font-bold text-xs text-slate-800 mb-2">الفئات المتاحة</label>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                      activeCategory === 'all' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>كافة المعروضات</span>
                    <span className="text-[10px] font-mono text-slate-400">{allProducts.length || filteredProducts.length}</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                        activeCategory === c.key ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{categoryCounts[c.key] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div className="mb-6">
                <label className="block font-bold text-xs text-slate-800 mb-2">السعر الأقصى</label>
                <input
                  type="number"
                  min="0"
                  max={maxAvailablePrice}
                  value={priceRange || ''}
                  onChange={(e) => setPriceRange(Number(e.target.value) || 0)}
                  placeholder="أدخل السعر..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono mb-2"
                />
                <input
                  type="range"
                  min="0"
                  max={maxAvailablePrice}
                  step="10"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>0 ج</span>
                  <span>{priceRange > 0 ? `حتى ${priceRange} ج` : 'الكل'}</span>
                  <span>{maxAvailablePrice} ج</span>
                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  إعادة ضبط
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md"
                >
                  عرض النتائج ({sortedProducts.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
