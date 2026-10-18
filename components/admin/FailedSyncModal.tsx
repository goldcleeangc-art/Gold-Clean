'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, X, Copy, RefreshCw } from 'lucide-react';
import { Order } from '../../lib/types/store';

export interface FailedSyncOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  totalPrice: number;
  error: string;
}

interface FailedSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedSyncOrders: FailedSyncOrder[] | null;
  allOrders: Order[];
  onSyncOrderWithShipping: (order: Order, isManual?: boolean) => void;
  syncingOrderId: string | null;
}

export default function FailedSyncModal({
  isOpen,
  onClose,
  failedSyncOrders,
  allOrders,
  onSyncOrderWithShipping,
  syncingOrderId
}: FailedSyncModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 relative z-10 max-h-[92vh] flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-amber-50 via-rose-50/50 to-orange-50/30 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">سجل الطلبات المتعثرة في الشحن</h3>
                <p className="text-slate-500 text-[11px]">قائمة بالطلبات التي لم يتم إصدار بوليصة شحن لها لدى بوسطة مع أسباب التعثر</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {(!failedSyncOrders || failedSyncOrders.length === 0) ? (
              <div className="text-center py-8 text-slate-500 text-sm font-bold">
                لا توجد طلبات متعثرة حالياً، جميع الطلبات مسجلة بنجاح ✅
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-bold flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>إجمالي الطلبات المتعثرة: {failedSyncOrders.length} طلب</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = failedSyncOrders.map((it, idx) => 
                        `${idx + 1}. العميل: ${it.customerName} | هاتف: ${it.customerPhone} | المحافظة: ${it.customerCity}\nالعنوان: ${it.customerAddress}\nالمبلغ: ${it.totalPrice} ج.م | السبب: ${it.error}\nكود الطلب: ${it.orderId}`
                      ).join('\n---\n\n');
                      navigator.clipboard?.writeText(text);
                      alert('تم نسخ تفاصيل جميع الطلبات المتعثرة إلى الحافظة بنجاح!');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-black transition-colors cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ التقرير بالكامل</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {failedSyncOrders.map((ordItem, idx) => {
                    const originalOrder = allOrders.find(o => o.id === ordItem.orderId);
                    return (
                      <div 
                        key={ordItem.orderId || idx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-black text-slate-900 text-sm">{ordItem.customerName}</span>
                            <a
                              href={`tel:${ordItem.customerPhone}`}
                              className="text-xs text-blue-600 font-bold hover:underline dir-ltr inline-block font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            >
                              {ordItem.customerPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                              {ordItem.totalPrice} ج.م
                            </span>
                            {originalOrder && (
                              <button
                                type="button"
                                onClick={() => onSyncOrderWithShipping(originalOrder, true)}
                                disabled={syncingOrderId === originalOrder.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <RefreshCw className={`w-3 h-3 ${syncingOrderId === originalOrder.id ? 'animate-spin' : ''}`} />
                                <span>إعادة إرسال فردي</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-0.5">
                          <div><strong className="text-slate-800">المحافظة:</strong> {ordItem.customerCity}</div>
                          <div><strong className="text-slate-800">العنوان:</strong> {ordItem.customerAddress}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {ordItem.orderId}</div>
                        </div>

                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1 text-rose-900">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>سبب تعثر الإرسال:</span>
                          </div>
                          <div className="font-medium text-rose-700 leading-relaxed">{ordItem.error}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              إغلاق السجل
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
