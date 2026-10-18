'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Sparkles, ShoppingBag, Trash2, Truck, Minus, Plus } from 'lucide-react';
import { CartItem, Offer } from '../../lib/types/store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  offers: Offer[];
  hasFreeShippingOffer: boolean;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  subtotal: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  offers,
  hasFreeShippingOffer,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  subtotal
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity cursor-pointer"
        id="cart-overlay"
      />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed inset-y-0 right-0 w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
        id="cart-drawer"
        dir="rtl"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">سلة المشتريات</h3>
                <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {cart.reduce((c, i) => c + i.quantity, 0)} {cart.reduce((c, i) => c + i.quantity, 0) === 1 ? 'منتج' : 'منتجات'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">منظفات مصنع جولد كلين - الدفع عند الاستلام</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            title="إغلاق السلة ومتابعة التسوق"
          >
            <span className="text-xs font-bold hidden sm:inline">إغلاق</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert banner to inform user about their item addition */}
        {cart.length > 0 && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 bg-blue-50/90 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">تمت إضافة منتجك إلى السلة! يمكنك مراجعة طلبك أو إغلاق القائمة ومواصلة التسوق.</span>
            </div>
            <button
              onClick={onClose}
              className="text-blue-700 hover:text-blue-950 font-bold underline text-[11px] shrink-0 cursor-pointer mr-2"
            >
              متابعة التسوق
            </button>
          </div>
        )}

        {/* Items content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="font-extrabold text-slate-700 text-base">سلة التسوق فارغة</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                تصفح منظفات ومطهرات جولد كلين الفاخرة وأضف ما يناسبك لتظهر هنا مباشرة.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id} 
                className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs relative group transition-all"
              >
                <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                  <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{item.product.name}</h5>
                      <button 
                        onClick={() => onRemoveItem(item.product.id)} 
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="حذف من السلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.product.volume && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {item.product.volume}
                        </span>
                      )}
                      {item.product.code && (
                        <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                          كود: {item.product.code}
                        </span>
                      )}
                      {item.isOffer && (item.offerDetails?.isFreeShipping || offers.find(o => o.id === (item.offerDetails?.offerId || item.product.id.replace('offer-', '')))?.isFreeShipping) && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5" />
                          <span>شحن مجاني</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-bold">
                        سعر القطعة: {item.product.price} جنيه
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    {/* Quantity selector */}
                    <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-2 py-1">
                      <button 
                        onClick={() => onUpdateQty(item.product.id, -1)} 
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-900 px-2 min-w-[20px] text-center font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.product.id, 1)} 
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Item total */}
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-blue-700 font-mono">{(item.product.price * item.quantity).toFixed(2)} جنيه</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer checkout box */}
        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/70 space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي عدد القطع بالسلة</span>
                <span className="font-bold">{cart.reduce((c, i) => c + i.quantity, 0)} قطعة</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>مصاريف الشحن والتوصيل</span>
                {hasFreeShippingOffer ? (
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[11px] flex items-center gap-1 shadow-2xs">
                    <Truck className="w-3.5 h-3.5" />
                    <span>شحن مجاني بالكامل 🎁</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    معاينة عند كتابة العنوان
                  </span>
                )}
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-3 border-t border-slate-200 text-sm">
                <span>المجموع الإجمالي للمنتجات</span>
                <span className="text-blue-600 font-black text-base font-mono">{subtotal.toFixed(2)} جنيه</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button 
                id="drawer-proceed-checkout-btn"
                onClick={onProceedToCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <Truck className="w-4 h-4" />
                <span>تأكيد الطلب وإدخال العنوان (الدفع عند الاستلام) ←</span>
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer text-center"
              >
                متابعة التسوق وإضافة منتجات أخرى
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
