'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Truck, 
  ShieldCheck, 
  ShoppingBag, 
  Check, 
  Link2, 
  Plus 
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
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onCopyLink: (id: string) => void;
  copiedLinkId: string | null;
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
  onSelectProduct,
  onAddToCart,
  onCopyLink,
  copiedLinkId
}: ProductsViewProps) {
  return (
    <>
      {/* SIDEBAR FILTERS */}
      <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 hidden md:flex" dir="rtl" id="sidebar-filters">
        
        {/* Search */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 mb-3.5">تصفية المنظفات</h3>
          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              id="sidebar-search"
              type="text" 
              placeholder="ابحث باسم المنتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">التصنيفات المتاحة</h3>
          <ul className="space-y-1 text-xs">
            <li key="all">
              <button 
                id="sidebar-cat-btn-all"
                onClick={() => setActiveCategory('all')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all text-right cursor-pointer ${
                  activeCategory === 'all' 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeCategory === 'all' ? 'bg-blue-600' : 'bg-transparent border border-slate-300'}`} />
                <span>كافة المعروضات</span>
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.key}>
                <button 
                  id={`sidebar-cat-btn-${cat.key}`}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all text-right cursor-pointer ${
                    activeCategory === cat.key 
                      ? 'bg-blue-50 text-blue-600 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeCategory === cat.key ? 'bg-blue-600' : 'bg-transparent border border-slate-300'}`} />
                  <span>{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Price Input */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">السعر الأقصى</h3>
          <div className="relative">
            <input 
              id="input-filter-price"
              type="number"
              min="0"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value) || 0)}
              placeholder="أدخل السعر الأقصى..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-3 pl-14 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 pointer-events-none">جنيه</span>
          </div>
          {priceRange > 0 && (
            <p className="text-[10px] text-slate-400 mt-1.5">عرض المنتجات حتى {priceRange} جنيه</p>
          )}
        </div>

        {/* Shipping & Support badges */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold block">مزايا الطلب</span>
          <div className="text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>شحن سريع متوفر اليوم</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>دفع آمن بالكامل</span>
            </div>
          </div>
        </div>

      </aside>

      {/* PRODUCTS LIST GRID */}
      <section className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 flex flex-col" dir="rtl" id="product-grid-section">
        
        {/* Header Mobile Search/Category Filter */}
        <div className="flex flex-col md:hidden gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs uppercase font-bold text-slate-400">التصنيفات المتوفرة باللمس</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              الكل
            </button>
            {categories.map(c => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeCategory === c.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading View */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col shadow-sm animate-pulse">
                <div className="h-40 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="mt-auto h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
            <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-800 text-base">لم تعثر على بضائع مناسبة!</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">يرجى إعادة اختيار تصنيفات أخرى أو زيادة ميزانية البحث من شريط التحكم على الجانب.</p>
            <button 
              onClick={() => { setActiveCategory('all'); setPriceRange(0); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              رؤية كافة البضائع
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1" id="products-catalog-grid">
            {filteredProducts.map((product) => {
              const isOut = !product.isAvailable;
              return (
                <motion.div
                  layout
                  key={product.id}
                  id={`product-card-${product.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 flex flex-col shadow-sm transition-all group hover:shadow-md h-full relative"
                >
                  {/* Image Area */}
                  <div 
                    className="h-44 bg-slate-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  >
                    {isOut ? (
                      <span className="absolute top-2 right-2 bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded-lg font-bold z-10">نفذت الكمية</span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-emerald-100 z-10">
                        متوفر في المخزن
                      </span>
                    )}
                    
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md font-bold z-10">
                      {product.volume}
                    </span>

                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-2 transition-transform group-hover:scale-103 relative"
                    />
                  </div>

                  {/* Metadata & Title */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 tracking-wider block mb-1">
                        {categories.find(c => c.key === product.category)?.name || 'فئة مخصصة'}
                      </span>
                      
                      <h4 
                        className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                        onClick={() => onSelectProduct(product)}
                      >
                        {product.name}
                      </h4>
                      
                      <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-slate-400">السعر النهائي</span>
                        <span className="text-base font-bold text-blue-600 block leading-none mt-0.5">
                          {product.price.toFixed(2)} <span className="text-xs font-normal">جنيه</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onCopyLink(product.id); }}
                          className="p-2.5 rounded-xl flex items-center justify-center transition-colors bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          title="نسخ رابط المنتج"
                        >
                          {copiedLinkId === product.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        <button 
                          id={`add-btn-${product.id}`}
                          disabled={isOut}
                          onClick={(e) => onAddToCart(product, e)}
                          className={`p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                            isOut 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-slate-900 hover:bg-blue-600 text-white'
                          }`}
                          title="أضف إلى السلة"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
