'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, MessageSquareWarning } from 'lucide-react';
import { Order } from '../../lib/types/store';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userOrders: Order[];
  isTrackingLoading: boolean;
  userOrdersTab: 'active' | 'cancelled' | 'past';
  setUserOrdersTab: (tab: 'active' | 'cancelled' | 'past') => void;
  onGoToProducts: () => void;
  onFileComplaint: (orderId: string) => void;
  onCancelOrder: (order: Order) => Promise<void>;
}

export default function OrderTrackerModal({
  isOpen,
  onClose,
  userOrders,
  isTrackingLoading,
  userOrdersTab,
  setUserOrdersTab,
  onGoToProducts,
  onFileComplaint,
  onCancelOrder
}: OrderTrackerModalProps) {
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950 cursor-pointer"
          id="tracker-overlay"
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[85vh] flex flex-col text-right border border-slate-100"
          id="tracker-modal"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>صفحة طلباتي ومشترياتي</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">تتبع وإدارة كافة طلباتك السابقة والحالية في Gold Clean</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {userOrders.length === 0 && !isTrackingLoading ? (
            <div className="py-12 text-center max-w-md mx-auto space-y-5">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">لا توجد طلبات مسجلة حالياً</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  عندما تقوم بطلب أي منظفات من المتجر، ستظهر طلبياتك وحالة التوصيل هنا تلقائياً دون الحاجة لتسجيل أي حساب.
                </p>
              </div>
              <button 
                onClick={onGoToProducts}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-transform hover:scale-102 cursor-pointer shadow-xs"
              >
                <span>تصفح المنتجات والتسوق الآن</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Tabs matching requested structure */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold leading-normal text-slate-500">
                {[
                  { 
                    id: 'active', 
                    label: 'الطلبات النشطة', 
                    count: userOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'shipping').length,
                    activeBg: 'bg-blue-600 text-white shadow-sm',
                    inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                  },
                  { 
                    id: 'past', 
                    label: 'الطلبات السابقة', 
                    count: userOrders.filter(o => o.status === 'delivered').length,
                    activeBg: 'bg-emerald-600 text-white shadow-sm',
                    inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                  },
                  { 
                    id: 'cancelled', 
                    label: 'الطلبات الملغية', 
                    count: userOrders.filter(o => o.status === 'cancelled').length,
                    activeBg: 'bg-red-500 text-white shadow-sm',
                    inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setUserOrdersTab(tab.id as any)}
                    className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      userOrdersTab === tab.id ? tab.activeBg : tab.inactiveBg
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                      userOrdersTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Orders Content List */}
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
                {isTrackingLoading ? (
                  <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>جاري تحميل طلباتك من قاعدة البيانات...</span>
                  </div>
                ) : (
                  (() => {
                    const filtered = userOrders.filter(ord => {
                      if (userOrdersTab === 'active') return ord.status === 'pending' || ord.status === 'preparing' || ord.status === 'shipping';
                      if (userOrdersTab === 'cancelled') return ord.status === 'cancelled';
                      return ord.status === 'delivered';
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                          <p className="text-xs text-slate-400 font-bold">لا يوجد طلبات في هذا القسم حالياً</p>
                          <p className="text-[10px] text-slate-400">أي طلبات تنشئها بالمتجر ستظهر هنا تلقائياً بالقسم المخصص لها.</p>
                        </div>
                      );
                    }

                    return filtered.map((order) => {
                      const orderDate = order.createdAt?.seconds 
                        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'قيد المزامنة...';

                      return (
                        <div 
                          key={order.id} 
                          className="p-4 rounded-2xl bg-white border border-slate-150 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3"
                        >
                          {/* Card Header & Status */}
                          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800">طلب رقم: #{order.id?.substring(0, 8).toUpperCase()}</span>
                              <span className="block text-[10px] text-slate-400">{orderDate}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'shipping' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {order.status === 'pending' && 'معلق في الانتظار ⏳'}
                              {order.status === 'preparing' && 'جاري التجهيز 📦'}
                              {order.status === 'shipping' && 'مع المندوب للتسليم 🚚'}
                              {order.status === 'delivered' && 'تم التوصيل بنجاح ✅'}
                              {order.status === 'cancelled' && 'طلب ملغى ❌'}
                            </span>
                          </div>

                          {/* Items list */}
                          <div className="space-y-1.5 pl-2">
                            <span className="block text-[10px] font-bold text-slate-400">المنتجات والمنظفات المطلوبة:</span>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                  <span>{item.productName}</span>
                                  <span className="font-mono text-[11px] font-semibold text-slate-500">الكمية: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer details */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs">
                            <div className="space-y-0.5">
                              <span className="block text-[10px] text-slate-400">الدولة/المدينة: {order.customerCountry ? order.customerCountry + ' - ' : ''}{order.customerCity}</span>
                              <span className="block text-[10px] text-slate-400">العنوان: {order.customerAddress}</span>
                              {order.notes && (
                                <span className="block text-[10px] text-rose-500 font-bold">• ملاحظات: {order.notes}</span>
                              )}
                            </div>
                            <div className="text-left">
                              <span className="block text-[9px] text-slate-400 leading-none">
                                {typeof order.shippingCost === 'number' 
                                  ? (order.shippingCost === 0 ? 'شامل الشحن (شحن مجاني 🎁)' : `شامل الشحن (${order.shippingCost.toFixed(2)} ج)`) 
                                  : 'إجمالي الحساب (COD)'}
                              </span>
                              <span className="text-sm font-black text-blue-600 font-mono inline-block mt-1">{order.totalPrice.toFixed(2)} جنيه</span>
                            </div>
                          </div>

                          {/* Actions: File complaint & Cancellation */}
                          <div className="pt-2.5 border-t border-dashed border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => onFileComplaint(order.id || '')}
                              className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                            >
                              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                              <span>تقديم شكوى أو استفسار على هذا الطلب</span>
                            </button>

                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <div>
                                {orderToCancel === order.id ? (
                                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl duration-200">
                                    <span className="text-rose-700 font-extrabold text-[10px]">تأكيد إلغاء هذا الطلب وإرجاع البضاعة؟</span>
                                    <button 
                                      onClick={async () => {
                                        await onCancelOrder(order);
                                        setOrderToCancel(null);
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                    >
                                      نعم، إلغاء الآن
                                    </button>
                                    <button 
                                      onClick={() => setOrderToCancel(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                    >
                                      تراجع
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setOrderToCancel(order.id || null)}
                                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-extrabold px-3 py-1.5 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                                  >
                                    <span>إلغاء الطلب</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
