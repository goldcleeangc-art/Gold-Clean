'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Download, 
  Calendar, 
  X, 
  Filter, 
  ShoppingCart, 
  Banknote, 
  TrendingUp, 
  CheckCircle, 
  Package, 
  Truck, 
  AlertCircle, 
  Search 
} from 'lucide-react';
import { Order, formatOrderDate } from '../../lib/types/store';
import { cleanProductNameForWorkers } from '../../lib/shipping';

export interface StatsMetrics {
  displayCount: number;
  validOrdersCount: number;
  cancelledOrdersCount: number;
  displayRevenue: number;
  displayModeLabel: string;
  avgOrderValue: number;
  totalDeliveredRevenue: number;
  pendingOrdersCount: number;
  pendingRevenue: number;
  preparingOrdersCount: number;
  preparingRevenue: number;
  shippingOrdersCount: number;
  shippingRevenue: number;
  deliveredOrdersCount: number;
  totalCancelledRevenue: number;
}

interface AdminStatsTabProps {
  allOrders: Order[];
  statsDateScopedOrders: Order[];
  handleExportStatsOrdersToExcel: () => void;
  statsPeriodDescription: string;
  statsStartDate: string;
  setStatsStartDate: (d: string) => void;
  statsEndDate: string;
  setStatsEndDate: (d: string) => void;
  statsDatePreset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'single' | 'custom';
  handleApplyStatsDatePreset: (preset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'single' | 'custom') => void;
  statsSingleDate: string;
  setStatsSingleDate: (d: string) => void;
  statsStatusMode: 'valid' | 'all' | 'delivered';
  setStatsStatusMode: (m: 'valid' | 'all' | 'delivered') => void;
  statsMetrics: StatsMetrics;
  statsDisplayOrders: Order[];
  statsSearchQuery: string;
  setStatsSearchQuery: (q: string) => void;
  paginatedStatsOrders: Order[];
  statsExpandedOrderId: string | null;
  setStatsExpandedOrderId: (id: string | null) => void;
  setAdminOrderSearch: (s: string) => void;
  setAdminTab: (tab: any) => void;
  statsStartIndex: number;
  statsEndIndex: number;
  statsTotalPages: number;
  statsValidPage: number;
  setStatsOrdersCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function AdminStatsTab({
  allOrders,
  statsDateScopedOrders,
  handleExportStatsOrdersToExcel,
  statsPeriodDescription,
  statsStartDate,
  setStatsStartDate,
  statsEndDate,
  setStatsEndDate,
  statsDatePreset,
  handleApplyStatsDatePreset,
  statsSingleDate,
  setStatsSingleDate,
  statsStatusMode,
  setStatsStatusMode,
  statsMetrics,
  statsDisplayOrders,
  statsSearchQuery,
  setStatsSearchQuery,
  paginatedStatsOrders,
  statsExpandedOrderId,
  setStatsExpandedOrderId,
  setAdminOrderSearch,
  setAdminTab,
  statsStartIndex,
  statsEndIndex,
  statsTotalPages,
  statsValidPage,
  setStatsOrdersCurrentPage
}: AdminStatsTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="font-black text-slate-900 text-sm md:text-base">مؤشرات المبيعات والتقارير المالية</h4>
          </div>
          <p className="text-xs text-slate-500 font-medium pr-10">
            تحليل فوري دقيق لعدد الأوردرات، إجمالي المبالغ، وحالات الطلبات حسب التاريخ أو الفترة المحددة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[11px] border border-slate-200 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>سجل المتجر بالكامل: {allOrders.length} طلبية</span>
          </span>

          <button
            type="button"
            onClick={handleExportStatsOrdersToExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-colors cursor-pointer"
            title="تصدير شيت إكسيل بجميع طلبات الفترة المحددة"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إكسيل الفترة ({statsDateScopedOrders.length}) 📥</span>
          </button>
        </div>
      </div>

      {/* Date & Period Filter Box */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <h5 className="font-extrabold text-xs text-slate-800">فلتر التاريخ والفترة الزمنية:</h5>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
              <span>الفترة النشطة:</span>
              <strong className="font-black">{statsPeriodDescription}</strong>
            </span>
            {(statsStartDate || statsEndDate || statsDatePreset !== 'all') && (
              <button
                type="button"
                onClick={() => handleApplyStatsDatePreset('all')}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'كل الفترات' },
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'أمس' },
            { id: 'last_7_days', label: 'آخر 7 أيام' },
            { id: 'last_30_days', label: 'آخر 30 يوماً' },
            { id: 'this_month', label: 'هذا الشهر' },
            { id: 'last_month', label: 'الشهر السابق' },
            { id: 'single', label: '📅 يوم محدد' },
            { id: 'custom', label: '📆 فترة مخصصة (من - إلى)' }
          ].map((p) => {
            const isActive = statsDatePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyStatsDatePreset(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Pickers for Single Date */}
        {statsDatePreset === 'single' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
            <label className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>اختر التاريخ المستهدف:</span>
            </label>
            <input
              type="date"
              value={statsSingleDate}
              onChange={(e) => {
                const val = e.target.value;
                setStatsSingleDate(val);
                setStatsStartDate(val);
                setStatsEndDate(val);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-sans"
            />
            <div className="flex items-center gap-1.5 mr-auto">
              <button
                type="button"
                onClick={() => handleApplyStatsDatePreset('today')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                تعيين لتاريخ اليوم
              </button>
              <button
                type="button"
                onClick={() => handleApplyStatsDatePreset('yesterday')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                تعيين لتاريخ أمس
              </button>
            </div>
          </div>
        )}

        {/* Pickers for Custom Date Range */}
        {statsDatePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">من تاريخ:</label>
              <input
                type="date"
                value={statsStartDate}
                onChange={(e) => {
                  setStatsStartDate(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">إلى تاريخ:</label>
              <input
                type="date"
                value={statsEndDate}
                onChange={(e) => {
                  setStatsEndDate(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-sans"
              />
            </div>

            {(statsStartDate || statsEndDate) && (
              <span className="text-[11px] text-slate-600 mr-auto font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                📅 من {statsStartDate || 'البداية'} ⬅️ إلى {statsEndDate || 'اليوم'}
              </span>
            )}
          </div>
        )}

        {/* Calculation Scope Filter (Confirmed vs All vs Delivered) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">احتساب المؤشرات الرئيسية:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'valid', label: 'الطلبات المؤكدة (بدون الملغية)' },
              { id: 'all', label: 'كافة الطلبات (شاملة الملغية)' },
              { id: 'delivered', label: 'الطلبات المستلمة فقط' }
            ].map((mode) => {
              const isActive = statsStatusMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setStatsStatusMode(mode.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRIMARY HIGHLIGHT CARDS (عدد الأوردرات وإجمالي المبلغ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: عدد الأوردرات */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 p-5 rounded-2xl border-2 border-blue-200/80 text-right space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="block text-blue-900 text-xs font-black tracking-wide">عدد الأوردرات</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-blue-700 font-mono block">
              {statsMetrics?.displayCount ?? 0} <span className="text-sm font-bold text-blue-600">طلب</span>
            </span>
          </div>
          <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-[10px] text-blue-800 font-semibold">
            <span>المؤكدة: {statsMetrics?.validOrdersCount ?? 0}</span>
            <span>الملغية: {statsMetrics?.cancelledOrdersCount ?? 0}</span>
          </div>
        </div>

        {/* Card 2: إجمالي المبلغ */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 rounded-2xl border-2 border-emerald-200/80 text-right space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="block text-emerald-900 text-xs font-black tracking-wide">إجمالي المبلغ</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-600 font-mono block">
              {(statsMetrics?.displayRevenue ?? 0).toFixed(2)} <span className="text-sm font-bold text-emerald-700">جنيه</span>
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10px] text-emerald-800 font-semibold truncate">
            <span>• {statsMetrics?.displayModeLabel || ''}</span>
          </div>
        </div>

        {/* Card 3: متوسط قيمة الطلب */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 p-5 rounded-2xl border-2 border-purple-200/80 text-right space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="block text-purple-900 text-xs font-black tracking-wide">متوسط قيمة الأوردر</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-700 font-mono block">
              {(statsMetrics?.avgOrderValue ?? 0).toFixed(2)} <span className="text-xs font-bold text-purple-600">جنيه / طلب</span>
            </span>
          </div>
          <div className="pt-2 border-t border-purple-100/80 text-[10px] text-purple-800 font-semibold">
            <span>معدل قيمة السلة للطلب الواحد</span>
          </div>
        </div>

        {/* Card 4: الطلبات المستلمة */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 rounded-2xl border-2 border-amber-200/80 text-right space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="block text-amber-900 text-xs font-black tracking-wide">تم الاستلام والمحاسبة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 font-mono block">
              {(statsMetrics?.totalDeliveredRevenue ?? 0).toFixed(2)} <span className="text-xs font-bold text-amber-700">جنيه</span>
            </span>
          </div>
          <div className="pt-2 border-t border-amber-100/80 text-[10px] text-amber-800 font-semibold">
            <span>{statsMetrics?.deliveredOrdersCount ?? 0} طلب تم تسليمه بنجاح</span>
          </div>
        </div>
      </div>

      {/* DETAILED METRICS BY STATUS BREAKDOWN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <h5 className="font-extrabold text-xs text-slate-800 pb-2 border-b border-slate-100">
          توزيع الطلبات والمبالغ حسب الحالة في الفترة المحددة:
        </h5>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-right">
          {/* Pending */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>⏳ قيد الانتظار</span>
            </div>
            <div className="text-base font-black text-amber-900 font-mono">
              {statsMetrics?.pendingOrdersCount ?? 0} <span className="text-[10px] font-medium text-amber-700">طلب</span>
            </div>
            <div className="text-[10px] font-bold text-amber-700 font-mono">
              {(statsMetrics?.pendingRevenue ?? 0).toFixed(2)} ج.م
            </div>
          </div>

          {/* Preparing */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
              <Package className="w-3 h-3 text-blue-600" />
              <span>⚙️ جاري التجهيز</span>
            </div>
            <div className="text-base font-black text-blue-900 font-mono">
              {statsMetrics?.preparingOrdersCount ?? 0} <span className="text-[10px] font-medium text-blue-700">طلب</span>
            </div>
            <div className="text-[10px] font-bold text-blue-700 font-mono">
              {(statsMetrics?.preparingRevenue ?? 0).toFixed(2)} ج.م
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-purple-800">
              <Truck className="w-3 h-3 text-purple-600" />
              <span>🛵 بالشحن</span>
            </div>
            <div className="text-base font-black text-purple-900 font-mono">
              {statsMetrics?.shippingOrdersCount ?? 0} <span className="text-[10px] font-medium text-purple-700">طلب</span>
            </div>
            <div className="text-[10px] font-bold text-purple-700 font-mono">
              {(statsMetrics?.shippingRevenue ?? 0).toFixed(2)} ج.م
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>✅ تم الاستلام</span>
            </div>
            <div className="text-base font-black text-emerald-900 font-mono">
              {statsMetrics?.deliveredOrdersCount ?? 0} <span className="text-[10px] font-medium text-emerald-700">طلب</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 font-mono">
              {(statsMetrics?.totalDeliveredRevenue ?? 0).toFixed(2)} ج.م
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>❌ ملغي</span>
            </div>
            <div className="text-base font-black text-rose-900 font-mono">
              {statsMetrics?.cancelledOrdersCount ?? 0} <span className="text-[10px] font-medium text-rose-700">طلب</span>
            </div>
            <div className="text-[10px] font-bold text-rose-700 font-mono">
              {(statsMetrics?.totalCancelledRevenue ?? 0).toFixed(2)} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Orders Table for the Filtered Period */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h5 className="font-extrabold text-xs text-slate-900">سجل طلبات الفترة المحددة ({statsDisplayOrders.length})</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">
              قائمة بجميع الطلبيات المحتسبة في هذه الفترة مع التفاصيل ومبالغ الفواتير
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم العميل، الهاتف، أو الكود..."
              value={statsSearchQuery}
              onChange={(e) => setStatsSearchQuery(e.target.value)}
              className="w-full pl-8 pr-9 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
            />
            {statsSearchQuery && (
              <button
                onClick={() => setStatsSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {statsDisplayOrders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-bold">
              لا توجد أي طلبات مسجلة في التاريخ أو الفترة المحددة ({statsPeriodDescription}).
            </p>
            <button
              type="button"
              onClick={() => {
                handleApplyStatsDatePreset('all');
                setStatsSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              إعادة ضبط الفلتر وعرض كافة الطلبات
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-[11px] text-slate-500 font-bold bg-slate-50/80">
                    <th className="py-2.5 px-3">رقم الطلب</th>
                    <th className="py-2.5 px-3">العميل</th>
                    <th className="py-2.5 px-3">المحافظة / المدينة</th>
                    <th className="py-2.5 px-3">تاريخ ووقت الطلب</th>
                    <th className="py-2.5 px-3">الأصناف</th>
                    <th className="py-2.5 px-3">إجمالي المبلغ</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStatsOrders.map((ord) => {
                    const isExpanded = statsExpandedOrderId === ord.id;
                    const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
                      pending: { label: '⏳ معلق', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
                      preparing: { label: '⚙️ تجهيز', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
                      shipping: { label: '🛵 شحن', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
                      delivered: { label: '✅ تم الاستلام', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
                      cancelled: { label: '❌ ملغي', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' }
                    };
                    const currentStatus = statusMap[ord.status] || { label: ord.status, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

                    return (
                      <React.Fragment key={ord.id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            #{ord.id?.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{ord.customerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {ord.customerCity || 'غير محدد'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-medium text-[11px]">
                            {formatOrderDate(ord.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-700">
                            {ord.items?.length || 0} صنف ({ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} قطعة)
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-emerald-700">
                            {(Number(ord.totalPrice) || 0).toFixed(2)} ج.م
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                              {currentStatus.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setStatsExpandedOrderId(isExpanded ? null : ord.id || null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                title="عرض تفاصيل المنتجات والعنوان"
                              >
                                {isExpanded ? 'إخفاء' : 'تفاصيل'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminOrderSearch(ord.id || '');
                                  setAdminTab('orders');
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                                title="الانتقال إلى هذا الطلب في صفحة الطلبات"
                              >
                                عرض بالطلبات ↗
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={8} className="p-3">
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-right">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <span className="font-extrabold text-[11px] text-slate-800">
                                    العنوان: <span className="font-normal text-slate-600">{ord.customerAddress} ({ord.customerCity})</span>
                                  </span>
                                  {ord.notes && (
                                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      ملاحظات: {ord.notes}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 block">محتويات الطلب:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {ord.items.map((item, iIdx) => (
                                      <div key={iIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs space-y-1">
                                        <div className="font-bold text-slate-900 leading-snug">{cleanProductNameForWorkers(item.productName)}</div>
                                        <div className="flex justify-between items-center text-slate-500 text-[10px] pt-1 border-t border-slate-100">
                                          <span className="font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">عدد ({item.quantity})</span>
                                          <span className="font-mono font-bold text-emerald-700">{item.price} ج.م</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                عرض {statsDisplayOrders.length === 0 ? 0 : statsStartIndex + 1} إلى {statsEndIndex} من {statsDisplayOrders.length} طلبية
              </span>

              {statsTotalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatsOrdersCurrentPage(p => Math.max(1, p - 1))}
                    disabled={statsValidPage <= 1}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    السابق
                  </button>
                  <span className="text-xs font-bold text-slate-800 px-2">
                    صفحة {statsValidPage} من {statsTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatsOrdersCurrentPage(p => Math.min(statsTotalPages, p + 1))}
                    disabled={statsValidPage >= statsTotalPages}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
