'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingCart, Link2, Check, ExternalLink } from 'lucide-react';
import { Product, Category } from '../../lib/types/store';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  user: any;
  onRateProduct: (product: Product, star: number) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onCopyLink: (id: string) => void;
  copiedLinkId: string | null;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  categories,
  user,
  onRateProduct,
  onAddToCart,
  onCopyLink,
  copiedLinkId
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900 z-50 transition-opacity cursor-pointer"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[700px] max-h-[95vh] bg-white md:rounded-3xl rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
        dir="rtl"
      >
        <div className="relative h-64 md:h-80 bg-slate-50 shrink-0">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=1000'}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur text-slate-600 rounded-full flex items-center justify-center hover:bg-white transition-colors border border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
          
          {!product.isAvailable && (
            <div className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md border border-rose-600">
              نفذت الكمية
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 mb-3 mt-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
              {categories.find(c => c.key === product.category)?.name || 'فئة مخصصة'}
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
              {product.volume}
            </span>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
            {product.name}
          </h2>
          
          <div className="flex items-center gap-4 mb-6">
            {Object.keys(product.ratingsMap || {}).length > 0 ? (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-slate-700">{product.rating}</span>
                <span className="text-xs text-slate-400">({Object.keys(product.ratingsMap || {}).length} تقييم)</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                لا توجد تقييمات بعد
              </span>
            )}
            <div className="text-xl font-black text-blue-600">
              {product.price.toFixed(2)} <span className="text-sm font-normal text-slate-500">جنيه</span>
            </div>
          </div>

          <div className="prose prose-sm md:prose-base text-slate-600 mb-8 max-w-none">
            <h3 className="text-base font-bold text-slate-900 mb-2">وصف المنظف</h3>
            <p className="leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Rating Input UI */}
          <div className="mb-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-3 block">ما رأيك بهذا المنتج؟</h4>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const userRating = user ? (product.ratingsMap?.[user.uid] || 0) : 0;
                return (
                  <button
                    key={star}
                    onClick={() => onRateProduct(product, star)}
                    className="hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star className={`w-8 h-8 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200 drop-shadow-sm'}`} />
                  </button>
                );
              })}
            </div>
            {user && product.ratingsMap?.[user.uid] && (
              <p className="text-xs text-emerald-600 font-bold mt-2">لقد قمت بتقييم هذا المنتج بنجاح</p>
            )}
            {!user && (
              <p className="text-xs text-slate-400 mt-2">سجل دخولك لتقييم المنتج</p>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={() => onCopyLink(product.id)}
              className="px-4 py-3 bg-white text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center cursor-pointer"
              title="نسخ رابط المنتج"
            >
              {copiedLinkId === product.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5" />}
            </button>
            <a
              href={`/products/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-white text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center cursor-pointer"
              title="فتح صفحة المنتج المستقلة"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          <button
            disabled={!product.isAvailable}
            onClick={(e) => onAddToCart(product, e)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer
              ${!product.isAvailable 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {!product.isAvailable ? 'المنتج غير متوفر' : 'أضف إلى سلة التسوق'}
            </span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
