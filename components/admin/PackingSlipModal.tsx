'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, X, Copy, Printer } from 'lucide-react';
import { Order, Offer, Product } from '../../lib/types/store';
import { cleanProductNameForWorkers, generateOrderPackingSlipText } from '../../lib/shipping';

interface PackingSlipModalProps {
  order: Order | null;
  onClose: () => void;
  offers: Offer[];
  products: Product[];
  formatOrderDate: (date: any) => string;
}

export default function PackingSlipModal({
  order,
  onClose,
  offers,
  products,
  formatOrderDate
}: PackingSlipModalProps) {
  if (!order) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer print:hidden"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 relative z-10 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:p-0"
        dir="rtl"
      >
        {/* Header (hidden in print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm">إذن صرف وتجهيز طلبية للمخزن</h3>
              <p className="text-slate-400 text-[10px]">بيان واضح بالأصناف والكميات لعمال التجهيز والتعبئة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Body */}
        <div className="p-6 space-y-4 overflow-y-auto print:p-2 print:overflow-visible">
          {/* Print Title Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">جولد كلين (Gold Clean)</h2>
              <p className="text-xs text-slate-600 font-bold">إذن تجهيز شحنة ومراجعة البضاعة</p>
            </div>
            <div className="text-left font-mono">
              <div className="text-base font-black text-blue-800">
                #{order.id?.substring(0, 8).toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 font-bold">
                {formatOrderDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 print:bg-white print:border-slate-400">
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">اسم العميل:</span>
              <span className="font-black text-slate-900 text-sm">{order.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">رقم هاتف العميل:</span>
              <span className="font-mono font-black text-slate-900 text-sm dir-ltr inline-block">
                {order.customerPhone}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-bold block text-[10px]">العنوان والمحافظة:</span>
              <span className="font-bold text-slate-800">
                {order.customerCity} - {order.customerAddress}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">شركة الشحن:</span>
              <span className="font-bold text-blue-800">بوسطة (Bosta)</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px]">رقم الشحنة (Tracking):</span>
              <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 print:border-slate-400">
                {order.shippingInfo?.trackingNumber || order.shippingInfo?.billCode || 'قيد التسجيل'}
              </span>
            </div>
          </div>

          {/* Items Packing Checklist */}
          {(() => {
            const physicalList: Array<{ name: string; quantity: number; code?: string }> = [];
            for (const it of (order.items || [])) {
              const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId);
              const bundle = it.bundleItems && it.bundleItems.length > 0 
                ? it.bundleItems 
                : (matchingOffer?.items || null);

              if (bundle && Array.isArray(bundle) && bundle.length > 0) {
                for (const sub of bundle) {
                  const subProd = products.find(p => p.id === sub.productId);
                  const subCode = sub.productCode || subProd?.code || '';
                  const subQty = (Number(sub.quantity) || 1) * (Number(it.quantity) || 1);
                  physicalList.push({
                    name: cleanProductNameForWorkers(sub.productName),
                    quantity: subQty,
                    code: subCode
                  });
                }
              } else {
                const codeDisplay = it.productCode || products.find(p => p.id === it.productId)?.code || '';
                physicalList.push({
                  name: cleanProductNameForWorkers(it.productName),
                  quantity: Number(it.quantity) || 1,
                  code: codeDisplay
                });
              }
            }

            const agg = new Map<string, { name: string; quantity: number; code?: string }>();
            for (const p of physicalList) {
              const exist = agg.get(p.name);
              if (exist) {
                exist.quantity += p.quantity;
              } else {
                agg.set(p.name, { ...p });
              }
            }
            const finalItems = Array.from(agg.values());
            const totalPieces = finalItems.reduce((s, it) => s + it.quantity, 0);

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-200">
                  <span>الأصناف المطلوب تعبئتها في الكرتونة:</span>
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md font-mono text-xs">
                    إجمالي {totalPieces} قطعة
                  </span>
                </div>

                <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden print:border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold print:bg-slate-200">
                      <th className="p-2.5 text-center w-12 border-b border-slate-200 print:border-slate-800">فحص</th>
                      <th className="p-2.5 text-center w-10 border-b border-slate-200 print:border-slate-800">م</th>
                      <th className="p-2.5 border-b border-slate-200 print:border-slate-800">اسم المنتج</th>
                      <th className="p-2.5 text-center w-20 border-b border-slate-200 print:border-slate-800">الكود</th>
                      <th className="p-2.5 text-center w-24 border-b border-slate-200 print:border-slate-800">الكمية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-slate-800">
                    {finalItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-center border-l border-slate-100 print:border-slate-800">
                          <span className="inline-block w-5 h-5 border-2 border-slate-400 rounded-md print:border-slate-800"></span>
                        </td>
                        <td className="p-2.5 text-center text-slate-400 font-mono font-bold border-l border-slate-100 print:border-slate-800">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-black text-slate-900 border-l border-slate-100 print:border-slate-800">
                          {item.name}
                        </td>
                        <td className="p-2.5 text-center font-mono text-[10px] text-slate-500 font-bold border-l border-slate-100 print:border-slate-800">
                          {item.code || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-900 font-black rounded-lg text-sm font-mono border border-blue-200 print:bg-white print:border-slate-800">
                            {item.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Customer Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-950 font-bold">
              <span>ملاحظة العميل: </span>
              <span className="font-normal">{order.notes}</span>
            </div>
          )}

          {/* Collection & Verification Footer */}
          <div className="pt-2 border-t-2 border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold block text-[10px]">المبلغ المطلوب تحصيله (COD):</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {order.totalPrice?.toFixed(2)} ج.م
              </span>
            </div>
            <div className="text-left space-y-1">
              <span className="text-slate-500 font-bold block text-[10px]">توقيع فحص ومطابقة المخزن:</span>
              <span className="text-slate-400 block font-mono text-[11px]">....................................</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() => {
              const slipText = generateOrderPackingSlipText(order, offers, products);
              navigator.clipboard?.writeText(slipText);
              alert('تم نسخ إذن التجهيز بالكامل إلى الحافظة بنجاح!');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ للواتساب</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة إذن التجهيز</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
