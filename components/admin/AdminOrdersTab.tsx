'use client';

import React from 'react';
import { 
  Search, 
  X, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Truck, 
  RefreshCw, 
  AlertCircle, 
  Trash2, 
  Clock, 
  Check, 
  Copy, 
  ExternalLink, 
  Printer, 
  ChevronsRight, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsLeft, 
  Send, 
  ClipboardList 
} from 'lucide-react';
import { Order, Offer, Product, formatOrderDate } from '../../lib/types/store';
import { cleanProductNameForWorkers, generateOrderPackingSlipText } from '../../lib/shipping';

export interface OrderCounts {
  all: number;
  pending: number;
  preparing: number;
  shipping: number;
  delivered: number;
  cancelled: number;
  bostaUnsynced: number;
  bostaSynced: number;
}

interface AdminOrdersTabProps {
  allOrders: Order[];
  filteredOrders: Order[];
  paginatedOrders: Order[];
  offers: Offer[];
  products: Product[];
  adminOrderSearch: string;
  setAdminOrderSearch: (s: string) => void;
  adminOrderFilter: 'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'bosta_unsynced' | 'bosta_synced';
  setAdminOrderFilter: (f: 'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'bosta_unsynced' | 'bosta_synced') => void;
  orderCounts: OrderCounts;
  handleExportOrdersToExcel: (targetStatus?: string, exportFormat?: 'comprehensive' | 'standard_3_cols') => void;
  orderDatePreset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom';
  setOrderDatePreset: (p: any) => void;
  orderStartDate: string;
  setOrderStartDate: (d: string) => void;
  orderEndDate: string;
  setOrderEndDate: (d: string) => void;
  handleApplyDatePreset: (preset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom') => void;
  handleBulkMovePendingToPreparing: () => Promise<void>;
  isBulkMovingPending: boolean;
  handleBulkSyncOrdersWithShipping: () => Promise<void>;
  isBulkSyncing: boolean;
  bulkSyncProgress: { current: number; total: number } | null;
  failedSyncOrders: any[] | null;
  openFailedOrdersReport: () => void;
  deleteTargetDate: string;
  setDeleteTargetDate: (d: string) => void;
  setIsDeleteByDateModalOpen: (open: boolean) => void;
  totalOrders: number;
  totalOrderPages: number;
  validOrderPage: number;
  startIndex: number;
  endIndex: number;
  ordersPerPage: number;
  setOrdersPerPage: (n: number) => void;
  setOrdersCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  handleResendPaginatedOrdersToShipping: () => Promise<void>;
  isResendingPageOrders: boolean;
  resendPageProgress: { current: number; total: number } | null;
  handleUpdateStatus: (orderId: string, status: any) => Promise<void>;
  handleCopyBillCode: (code?: string) => void;
  copiedBillCode: string | null;
  handleSyncOrderWithShipping: (order: Order, allowRecreate?: boolean) => Promise<void>;
  syncingOrderId: string | null;
  copiedPackingOrderId: string | null;
  setCopiedPackingOrderId: (id: string | null) => void;
  setPackingSlipOrder: (o: Order | null) => void;
  orderToDelete: string | null;
  setOrderToDelete: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
}

export default function AdminOrdersTab({
  allOrders,
  filteredOrders,
  paginatedOrders,
  offers,
  products,
  adminOrderSearch,
  setAdminOrderSearch,
  adminOrderFilter,
  setAdminOrderFilter,
  orderCounts,
  handleExportOrdersToExcel,
  orderDatePreset,
  setOrderDatePreset,
  orderStartDate,
  setOrderStartDate,
  orderEndDate,
  setOrderEndDate,
  handleApplyDatePreset,
  handleBulkMovePendingToPreparing,
  isBulkMovingPending,
  handleBulkSyncOrdersWithShipping,
  isBulkSyncing,
  bulkSyncProgress,
  failedSyncOrders,
  openFailedOrdersReport,
  deleteTargetDate,
  setDeleteTargetDate,
  setIsDeleteByDateModalOpen,
  totalOrders,
  totalOrderPages,
  validOrderPage,
  startIndex,
  endIndex,
  ordersPerPage,
  setOrdersPerPage,
  setOrdersCurrentPage,
  handleResendPaginatedOrdersToShipping,
  isResendingPageOrders,
  resendPageProgress,
  handleUpdateStatus,
  handleCopyBillCode,
  copiedBillCode,
  handleSyncOrderWithShipping,
  syncingOrderId,
  copiedPackingOrderId,
  setCopiedPackingOrderId,
  setPackingSlipOrder,
  orderToDelete,
  setOrderToDelete,
  handleDeleteOrder
}: AdminOrdersTabProps) {
  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
        <div>
          <h4 className="font-extrabold text-sm text-slate-900">الطلبات الواردة من العملاء</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">متابعة وتحديث حالات الطلبات وتواريخها وتصدير البيانات</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-100">
            المعروض: {filteredOrders.length} من إجمالي {allOrders.length} طلبية
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل، الهاتف، أو رقم الطلب..."
            value={adminOrderSearch}
            onChange={(e) => setAdminOrderSearch(e.target.value)}
            className="w-full pl-8 pr-9 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {adminOrderSearch && (
            <button
              onClick={() => setAdminOrderSearch('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons and Excel Export */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 ml-1">تصفية حسب الحالة:</span>
            {[
              { id: 'all', label: 'الكل', count: orderCounts.all },
              { id: 'pending', label: '⏳ معلق', count: orderCounts.pending },
              { id: 'preparing', label: '⚙️ جاري التجهيز', count: orderCounts.preparing },
              { id: 'shipping', label: '🛵 بالشحن', count: orderCounts.shipping },
              { id: 'delivered', label: '✅ تم الاستلام', count: orderCounts.delivered },
              { id: 'cancelled', label: '❌ ملغي', count: orderCounts.cancelled },
              { id: 'bosta_unsynced', label: '🚚 غير مسجل ببوسطة', count: orderCounts.bostaUnsynced },
              { id: 'bosta_synced', label: '📦 مسجل ببوسطة', count: orderCounts.bostaSynced },
            ].map((tab) => {
              const isActive = adminOrderFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminOrderFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleExportOrdersToExcel('preparing')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
              title="تنزيل شيت إكسيل بجميع الطلبات الجاري تجهيزها (الاسم، الرقم، وتفاصيل الطلب)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>سحب إكسيل جاري التجهيز ({orderCounts.preparing}) 📥</span>
            </button>

            {adminOrderFilter !== 'preparing' && (
              <button
                type="button"
                onClick={() => handleExportOrdersToExcel('current_filter')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="تصدير شيت إكسيل للطلبات المعروضة حالياً"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>تصدير المعروض ({filteredOrders.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date Range & Period Filter Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Presets and Title */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 ml-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>تحديد الفترة الزمنية:</span>
            </span>
            {[
              { id: 'all', label: 'كل الفترات' },
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'last_7_days', label: 'آخر 7 أيام' },
              { id: 'last_30_days', label: 'آخر 30 يوماً' },
              { id: 'this_month', label: 'هذا الشهر' },
              { id: 'custom', label: 'فترة مخصصة' }
            ].map((p) => {
              const isActive = orderDatePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyDatePreset(p.id as any)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Excel Export buttons for this period */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleExportOrdersToExcel('current_filter', 'comprehensive')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-colors cursor-pointer"
              title="تصدير شيت إكسيل شامل للطلبات المحددة بالفترة الحالية"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير إكسيل الفترة ({filteredOrders.length}) 📊</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportOrdersToExcel('current_filter', 'standard_3_cols')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-xl border border-emerald-300 transition-colors cursor-pointer"
              title="تصدير شيت الـ 3 أعمدة (الاسم، الرقم، وتفاصيل الطلب) للفترة المحددة"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>إكسيل 3 أعمدة ({filteredOrders.length}) 📥</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers Row */}
        {(orderDatePreset === 'custom' || orderStartDate || orderEndDate) && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600 shrink-0">من تاريخ:</label>
              <input
                type="date"
                value={orderStartDate}
                onChange={(e) => {
                  setOrderStartDate(e.target.value);
                  setOrderDatePreset('custom');
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600 shrink-0">إلى تاريخ:</label>
              <input
                type="date"
                value={orderEndDate}
                onChange={(e) => {
                  setOrderEndDate(e.target.value);
                  setOrderDatePreset('custom');
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            {(orderStartDate || orderEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setOrderStartDate('');
                  setOrderEndDate('');
                  setOrderDatePreset('all');
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح فلتر التاريخ</span>
              </button>
            )}

            {(orderStartDate || orderEndDate) && (
              <span className="text-[10px] text-slate-500 mr-auto font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                الفترة النشطة: {orderStartDate || 'البداية'} ⬅️ {orderEndDate || 'اليوم'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Bar for Orders Management */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/20 border border-slate-200 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-extrabold text-xs text-slate-900">إدارة ومعالجة الطلبات</h5>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                orderCounts.pending > 0
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {orderCounts.pending} طلب معلق
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              تصدير شيتات الإكسيل للطلبات وتحديث الحالات وحذف الطلبات القديمة بالتاريخ
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExportOrdersToExcel('preparing')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            title="تنزيل شيت إكسيل بجميع الطلبات الجاري تجهيزها (الاسم، الرقم، وتفاصيل الطلب)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>سحب إكسيل جاري التجهيز ({orderCounts.preparing}) 📊</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!deleteTargetDate) {
                const todayStr = new Date().toISOString().split('T')[0];
                setDeleteTargetDate(todayStr);
              }
              setIsDeleteByDateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 shadow-2xs transition-colors cursor-pointer"
            title="تنظيف وحذف الطلبات حسب التاريخ (يوم محدد أو كل ما قبله)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>حذف الطلبات بالتاريخ 🗑️</span>
          </button>
        </div>
      </div>

      {/* BOSTA AUTOMATIC SHIPPING BULK SYNC BAR */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-extrabold text-xs text-slate-900">الربط المباشر مع شركة بوسطة (Bosta Express)</h5>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                مفعل وآلي ⚡
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              يتم إنشاء شحنات بوسطة تلقائياً بمجرد إتمام الشراء. يمكنك إعادة المزامنة الجماعية لأي طلبات لم يتم تسجيلها.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {Boolean(failedSyncOrders && failedSyncOrders.length > 0) && (
            <button
              type="button"
              onClick={openFailedOrdersReport}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>تقرير المشاكل ({failedSyncOrders?.length})</span>
            </button>
          )}


          <button
            type="button"
            onClick={handleBulkMovePendingToPreparing}
            disabled={isBulkMovingPending || orderCounts.pending === 0}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="تحويل جميع الطلبات المعلقة (Pending) إلى حالة جاري التجهيز دفعة واحدة لتجهيزها في المخزن"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBulkMovingPending ? 'animate-spin' : ''}`} />
            <span>
              {isBulkMovingPending
                ? 'جاري التحويل...'
                : `نقل كل المعلق إلى جاري التجهيز (${orderCounts.pending}) ⚙️`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleBulkSyncOrdersWithShipping}
            disabled={isBulkSyncing || isBulkMovingPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="فحص وإرسال جميع الطلبات غير المسجلة على بوسطة تلقائياً"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isBulkSyncing
                ? `جاري الإرسال (${bulkSyncProgress?.current || 0}/${bulkSyncProgress?.total || 0})...`
                : 'مزامنة كافة الطلبات غير المسجلة مع بوسطة 🚀'}
            </span>
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-slate-100">
          لا توجد طلبات تطابق الفلتر أو البحث الحالي.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Pagination Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
              <span>عرض الطلبات:</span>
              <strong className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {totalOrders === 0 ? 0 : startIndex + 1} - {endIndex}
              </strong>
              <span>من إجمالي</span>
              <strong className="text-slate-900 font-bold">{totalOrders}</strong>
              <span>طلب</span>
              {totalOrderPages > 1 && (
                <span className="text-slate-400 text-[11px] mr-1">
                  (صفحة {validOrderPage} من {totalOrderPages})
                </span>
              )}
            </div>

            {/* Actions & Items per page selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResendPaginatedOrdersToShipping}
                disabled={isResendingPageOrders || isBulkSyncing || paginatedOrders.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="إعادة إرسال طلبات الصفحة المعروضة حالياً بالترقيم إلى شركة بوسطة لتحديث أو توليد بوالص الشحن"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingPageOrders ? 'animate-spin' : ''}`} />
                <span>
                  {isResendingPageOrders
                    ? `جاري الإرسال (${resendPageProgress?.current}/${resendPageProgress?.total})...`
                    : `إعادة إرسال طلبات الصفحة (${paginatedOrders.length}) لشركة الشحن 🚚`}
                </span>
              </button>

              <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2 mr-1">
                <span className="text-[11px] text-slate-500 font-medium">عدد بالصفحة:</span>
                <select
                  value={ordersPerPage}
                  onChange={(e) => {
                    setOrdersPerPage(Number(e.target.value));
                    setOrdersCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-800 font-bold outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {paginatedOrders.map((ord) => (
            <div key={ord.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs relative space-y-4 hover:border-slate-200 transition-all">
              
              {/* Order Header: ID, Date, and Status Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    #{ord.id?.substring(0, 8).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>تاريخ الطلب: <strong className="text-slate-800 font-bold">{formatOrderDate(ord.createdAt)}</strong></span>
                  </div>
                </div>
                <select 
                  value={ord.status}
                  onChange={(e) => handleUpdateStatus(ord.id!, e.target.value)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 font-bold text-[10px] outline-none bg-slate-50 focus:bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="pending">⏳ معلق في الانتظار</option>
                  <option value="preparing">⚙️ جاري التجهيز</option>
                  <option value="shipping">🛵 خرج مع المندوب</option>
                  <option value="delivered">✅ تم الاستلام والمحاسبة</option>
                  <option value="cancelled">❌ ملغي</option>
                </select>
              </div>

              {/* Customer Information */}
              <div>
                <h5 className="font-bold text-slate-800 text-xs">العميل: {ord.customerName}</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">الهاتف: {ord.customerPhone} • الدولة/المدينة: {ord.customerCountry ? ord.customerCountry + ' - ' : ''}{ord.customerCity}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">العنوان: {ord.customerAddress}</p>
              </div>

              {/* Order Items & Worker Packing Section */}
              <div className="bg-[#FAFBFD] p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                {(() => {
                  const totalPieces = (ord.items || []).reduce((sum, it) => {
                    const isOffer = it.isOffer || (typeof it.productId === 'string' && it.productId.startsWith('offer-'));
                    const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId);
                    const bundle = it.bundleItems && it.bundleItems.length > 0 
                      ? it.bundleItems 
                      : (matchingOffer?.items || null);
                    if (bundle && Array.isArray(bundle) && bundle.length > 0) {
                      const bundleSum = bundle.reduce((bSum, sub) => bSum + (Number(sub.quantity) || 1), 0);
                      return sum + (bundleSum * (Number(it.quantity) || 1));
                    }
                    return sum + (Number(it.quantity) || 1);
                  }, 0);

                  return (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">📦 محتويات الطلب للمخزن والتجهيز:</span>
                        <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                          الإجمالي: {totalPieces} قطعة
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const slip = generateOrderPackingSlipText(ord, products, offers);
                            navigator.clipboard.writeText(slip);
                            setCopiedPackingOrderId(ord.id || null);
                            setTimeout(() => setCopiedPackingOrderId(null), 2000);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="نسخ ملخص تجهيز الطلب كرسالة للعمال"
                        >
                          {copiedPackingOrderId === ord.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>نسخ التجهيز</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPackingSlipOrder(ord)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="فتح نافذة بون التجهيز المخصص للطباعة"
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span>بون التجهيز 🖨️</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <ul className="space-y-1.5 text-xs text-slate-700">
                  {ord.items.map((it, idx) => {
                    const isOffer = it.isOffer || (typeof it.productId === 'string' && it.productId.startsWith('offer-'));
                    const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId);
                    const bundle = it.bundleItems && it.bundleItems.length > 0 
                      ? it.bundleItems 
                      : (matchingOffer?.items || null);
                    const codeDisplay = it.productCode || products.find(p => p.id === it.productId)?.code || matchingOffer?.code;
                    const cleanName = cleanProductNameForWorkers(it.productName);

                    return (
                      <li key={idx} className="flex flex-col text-xs gap-1.5 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-mono font-black text-xs bg-blue-600 text-white px-2 py-0.5 rounded-lg shrink-0">
                              عدد {it.quantity}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {cleanName}
                            </span>
                            {codeDisplay && (
                              <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                كود: {codeDisplay}
                              </span>
                            )}
                            {isOffer && (
                              <span className="bg-rose-50 text-rose-700 font-extrabold text-[9px] px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                                عرض باقة 🔥
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-emerald-700 shrink-0 text-xs">
                            {it.price} ج.م
                          </span>
                        </div>

                        {/* If it is an offer bundle, list individual items for warehouse packers */}
                        {bundle && Array.isArray(bundle) && bundle.length > 0 && (
                          <div className="mr-3 pr-2 border-r-2 border-amber-300 bg-amber-50/50 p-2 rounded-lg space-y-1">
                            <span className="text-[10px] font-black text-amber-900 block">
                              تفاصيل محتويات الباقة للمخزن:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {bundle.map((sub, sIdx) => {
                                const subProd = products.find(p => p.id === sub.productId);
                                const subCode = sub.productCode || subProd?.code;
                                const subQty = (Number(sub.quantity) || 1) * (Number(it.quantity) || 1);

                                return (
                                  <div key={sIdx} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-amber-200 text-slate-800 shadow-2xs">
                                    <span className="font-mono font-black text-[11px] bg-amber-500 text-white px-1.5 py-0.5 rounded shrink-0">
                                      عدد {subQty}
                                    </span>
                                    <span className="font-bold text-[11px] truncate">
                                      {cleanProductNameForWorkers(sub.productName)}
                                    </span>
                                    {subCode && (
                                      <span className="font-mono font-black text-amber-800 bg-amber-100 px-1 rounded text-[9px] mr-auto shrink-0">
                                        {subCode}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {ord.notes && (
                  <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg font-medium">
                    ملاحظات العميل: {ord.notes}
                  </div>
                )}
              </div>

              {/* BOSTA SHIPPING STATUS BOX */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">حالة الشحن مع بوسطة:</span>
                    {ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>تم التسجيل بنجاح</span>
                      </span>
                    ) : ord.shippingInfo?.error ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>تعذر التسجيل التلقائي</span>
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        غير مسجل لدى بوسطة بعد
                      </span>
                    )}
                  </div>

                  {!ord.shippingInfo?.trackingNumber && !ord.shippingInfo?.billCode ? (
                    <button
                      type="button"
                      onClick={() => handleSyncOrderWithShipping(ord, false)}
                      disabled={syncingOrderId === ord.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      title="إرسال الطلب الآن لشركة بوسطة لتوليد بوليصة الشحن"
                    >
                      <Send className={`w-3 h-3 ${syncingOrderId === ord.id ? 'animate-spin' : ''}`} />
                      <span>{syncingOrderId === ord.id ? 'جاري الإرسال...' : 'إرسال لشركة بوسطة 🚀'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSyncOrderWithShipping(ord, true)}
                      disabled={syncingOrderId === ord.id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="إعادة إنشاء بوليصة لدى بوسطة"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${syncingOrderId === ord.id ? 'animate-spin' : ''}`} />
                      <span>إعادة إرسال</span>
                    </button>
                  )}
                </div>

                {!ord.shippingInfo?.trackingNumber && !ord.shippingInfo?.billCode && ord.shippingInfo?.error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-xl text-[10px] space-y-1">
                    <div className="font-bold flex items-center gap-1 text-rose-900">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>تعثر الإرسال الأخير:</span>
                    </div>
                    <div className="font-medium text-rose-700 leading-relaxed">{ord.shippingInfo.error}</div>
                  </div>
                )}

                {ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode ? (
                  <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl text-[10px] space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="space-y-0.5">
                        <span className="text-emerald-800 font-bold block text-[10px]">رقم شحنة بوسطة (Tracking No):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 inline-block shadow-2xs text-[11px]">
                            {ord.shippingInfo.trackingNumber || ord.shippingInfo.billCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyBillCode(ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode)}
                            className="p-1 hover:bg-white text-emerald-700 rounded border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                            title="نسخ رقم الشحنة"
                          >
                            {copiedBillCode === (ord.shippingInfo.trackingNumber || ord.shippingInfo.billCode) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://bosta.co/tracking-shipments?trackingNumber=${encodeURIComponent(ord.shippingInfo.trackingNumber || ord.shippingInfo.billCode || '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                          title="تتبع الشحنة على موقع بوسطة الرسمي"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-600" />
                          <span>تتبع الشحنة</span>
                        </a>

                        {ord.shippingInfo.deliveryId && (
                          <a
                            href={`/api/shipping/awb?deliveryId=${encodeURIComponent(ord.shippingInfo.deliveryId)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="طباعة وتحميل بوليصة الشحن (AWB PDF)"
                          >
                            <Printer className="w-3 h-3" />
                            <span>طباعة البوليصة</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl text-[10px] text-slate-500 flex items-center justify-between">
                    <span>⏳ الشحنة لم تُسجل على بوسطة بعد.</span>
                    <span className="text-[9px] text-slate-400">اضغط &quot;إرسال لشركة بوسطة&quot; لتوليد البوليصة فوراً</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-50">
                <div>
                  <span className="font-extrabold text-blue-600 bg-blue-50/30 px-3 py-1 rounded-lg">الحساب الإجمالي: {(Number(ord.totalPrice) || 0).toFixed(2)} جنيه</span>
                  {ord.shippingCost !== undefined && ord.shippingCost !== null && (
                    <span className="text-[10px] text-slate-400 block mt-1 pr-1">
                      (المنتجات: {(Number(ord.subtotal ?? ((Number(ord.totalPrice) || 0) - (Number(ord.shippingCost) || 0))) || 0).toFixed(2)} ج + الشحن: {Number(ord.shippingCost) === 0 ? 'مجاني 🎁' : `${(Number(ord.shippingCost) || 0).toFixed(2)} ج`} {ord.shippingZone ? `• ${ord.shippingZone}` : ''})
                    </span>
                  )}
                </div>
                <div>
                  {orderToDelete === ord.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100 duration-200">
                      <span className="text-rose-700 font-extrabold text-[9px]">حذف نهائي؟</span>
                      <button 
                        onClick={async () => {
                          if (ord.id) {
                            await handleDeleteOrder(ord.id);
                          }
                          setOrderToDelete(null);
                        }}
                        className="text-white bg-rose-600 hover:bg-rose-700 font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors"
                      >
                        تأكيد
                      </button>
                      <button 
                        onClick={() => setOrderToDelete(null)}
                        className="text-slate-600 bg-slate-200 hover:bg-slate-300 font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setOrderToDelete(ord.id || null)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      title="حذف الطلب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>

          {/* Bottom Pagination Bar */}
          {totalOrderPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                عرض الصفحة <strong className="text-slate-800 font-bold">{validOrderPage}</strong> من إجمالي <strong className="text-slate-800 font-bold">{totalOrderPages}</strong> صفحات — إجمالي <strong className="text-slate-800 font-bold">{totalOrders}</strong> طلب
              </div>

              <button
                type="button"
                onClick={handleResendPaginatedOrdersToShipping}
                disabled={isResendingPageOrders || isBulkSyncing || paginatedOrders.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="إعادة إرسال طلبات الصفحة المعروضة حالياً إلى شركة بوسطة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingPageOrders ? 'animate-spin' : ''}`} />
                <span>
                  {isResendingPageOrders
                    ? `جاري الإرسال (${resendPageProgress?.current}/${resendPageProgress?.total})...`
                    : `إعادة إرسال طلبات الصفحة (${paginatedOrders.length}) لشركة الشحن 🚚`}
                </span>
              </button>

              <div className="flex items-center gap-1.5" dir="rtl">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setOrdersCurrentPage(1)}
                  disabled={validOrderPage === 1}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="الصفحة الأولى"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setOrdersCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validOrderPage === 1}
                  className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                {/* Numeric Page Buttons */}
                {(() => {
                  const pages: (number | string)[] = [];
                  const maxVisible = 5;
                  if (totalOrderPages <= maxVisible) {
                    for (let i = 1; i <= totalOrderPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    let start = Math.max(2, validOrderPage - 1);
                    let end = Math.min(totalOrderPages - 1, validOrderPage + 1);

                    if (validOrderPage <= 2) {
                      end = 4;
                    } else if (validOrderPage >= totalOrderPages - 1) {
                      start = totalOrderPages - 3;
                    }

                    if (start > 2) pages.push('...');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < totalOrderPages - 1) pages.push('...');
                    pages.push(totalOrderPages);
                  }

                  return pages.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = page === validOrderPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setOrdersCurrentPage(Number(page))}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setOrdersCurrentPage(prev => Math.min(totalOrderPages, prev + 1))}
                  disabled={validOrderPage === totalOrderPages}
                  className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setOrdersCurrentPage(totalOrderPages)}
                  disabled={validOrderPage === totalOrderPages}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="الصفحة الأخيرة"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
