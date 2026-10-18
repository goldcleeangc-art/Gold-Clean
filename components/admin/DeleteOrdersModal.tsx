'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { Order } from '../../lib/types/store';

interface DeleteOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  deleteTargetDate: string;
  setDeleteTargetDate: (val: string) => void;
  deleteMode: 'exact' | 'before' | 'on_or_before';
  setDeleteMode: (mode: 'exact' | 'before' | 'on_or_before') => void;
  deleteStatusFilter: string;
  setDeleteStatusFilter: (val: string) => void;
  ordersToDelete: Order[];
  isDeletingOrders: boolean;
  deleteProgress: { current: number; total: number } | null;
  onExecuteDelete: () => void;
  formatOrderDate: (date: any) => string;
}

export default function DeleteOrdersModal({
  isOpen,
  onClose,
  deleteTargetDate,
  setDeleteTargetDate,
  deleteMode,
  setDeleteMode,
  deleteStatusFilter,
  setDeleteStatusFilter,
  ordersToDelete,
  isDeletingOrders,
  deleteProgress,
  onExecuteDelete,
  formatOrderDate
}: DeleteOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDeletingOrders) {
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
          onClick={() => !isDeletingOrders && onClose()}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 relative z-10 max-h-[92vh] flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-rose-50 via-rose-50/50 to-orange-50/30 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">حذف الطلبات حسب التاريخ</h3>
                <p className="text-slate-500 text-[11px]">تنظيف وإلغاء الطلبات القديمة أو التجريبية من قاعدة البيانات</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !isDeletingOrders && onClose()}
              disabled={isDeletingOrders}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-white/80 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-right">
            {/* 1. Target Date */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>حدد التاريخ المستهدف:</span>
              </label>
              <input
                type="date"
                value={deleteTargetDate}
                onChange={(e) => setDeleteTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* 2. Choose Mode (Option 1 vs Option 2 vs Option 3) */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                نطاق وتحديد الحذف:
              </label>
              <div className="space-y-2">
                {/* Option 1: On this specific day */}
                <div
                  onClick={() => setDeleteMode('exact')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    deleteMode === 'exact'
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'exact'}
                    onChange={() => setDeleteMode('exact')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      الخيار الأول: في هذا اليوم تحديداً
                    </span>
                    <span className="text-[11px] text-slate-500">
                      حذف الطلبات التي جاءت خلال هذا اليوم فقط (من 00:00 إلى 23:59).
                    </span>
                  </div>
                </div>

                {/* Option 2: Strictly before this day */}
                <div
                  onClick={() => setDeleteMode('before')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    deleteMode === 'before'
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'before'}
                    onChange={() => setDeleteMode('before')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      الخيار الثاني: أي أوردر جاء قبل هذا اليوم
                    </span>
                    <span className="text-[11px] text-slate-500">
                      حذف جميع الطلبات التي تمت قبل بداية هذا التاريخ (مثال: لو اخترت 1 سبتمبر، سيمسح كل طلبات شهر أغسطس وما قبله).
                    </span>
                  </div>
                </div>

                {/* Option 3: On or before this day */}
                <div
                  onClick={() => setDeleteMode('on_or_before')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    deleteMode === 'on_or_before'
                      ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'on_or_before'}
                    onChange={() => setDeleteMode('on_or_before')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      الخيار الثالث: في هذا اليوم وكل ما قبله
                    </span>
                    <span className="text-[11px] text-slate-500">
                      حذف طلبات هذا اليوم نفسه مع كافة الطلبات التي سبقته دفعة واحدة.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Status Filter */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                حالة الطلبات المراد مسحها:
              </label>
              <select
                value={deleteStatusFilter}
                onChange={(e) => setDeleteStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
              >
                <option value="all">جميع الحالات (معلق، جاري التجهيز، ملغي...)</option>
                <option value="pending">الطلبات المعلقة فقط (Pending)</option>
                <option value="cancelled">الطلبات الملغاة فقط (Cancelled)</option>
                <option value="delivered">الطلبات المسلمة فقط (Delivered)</option>
                <option value="preparing">طلبات جاري التجهيز فقط</option>
                <option value="shipping">طلبات خرج مع المندوب فقط</option>
              </select>
            </div>

            {/* 4. Live Preview Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>معاينة الطلبات المطابقة للشروط:</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  ordersToDelete.length > 0
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {ordersToDelete.length} طلب
                </span>
              </div>

              {ordersToDelete.length === 0 ? (
                <p className="text-[11px] text-slate-500 pt-1">
                  {deleteTargetDate ? 'لا توجد أي طلبات تطابق التاريخ والخيارات المحددة أعلاه.' : 'يرجى اختيار التاريخ أولاً لعرض الطلبات المطابقة.'}
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pt-1 pr-1 divide-y divide-slate-100">
                  {ordersToDelete.map((ord) => (
                    <div key={ord.id} className="text-[10px] bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-blue-700 font-mono font-bold">#{ord.id?.slice(0, 8)}</span>
                          <strong className="text-slate-900">{ord.customerName}</strong>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            ord.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            ord.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ord.status === 'pending' ? 'معلق' : ord.status === 'cancelled' ? 'ملغي' : ord.status}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[9px] block mt-0.5">
                          {formatOrderDate(ord.createdAt)}
                        </span>
                      </div>
                      <span className="font-mono text-slate-800 font-bold shrink-0">{ord.totalPrice} ج.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning note */}
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/80 text-[11px] text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <span>⚠️ تنبيه نهائي:</span>
              </p>
              <p className="text-rose-700 leading-relaxed text-[10px]">
                الحذف مباشر ونهائي من قاعدة بيانات Firebase ولا يمكن التراجع عنه. تأكد من مراجعة عدد الطلبات أعلاه قبل التأكيد.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeletingOrders}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={onExecuteDelete}
              disabled={isDeletingOrders || ordersToDelete.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDeletingOrders ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    جاري الحذف ({deleteProgress?.current || 0}/{deleteProgress?.total || ordersToDelete.length})...
                  </span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد حذف ({ordersToDelete.length}) طلب نهائياً</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
