'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Notebook, 
  Package, 
  Sparkles, 
  LayoutGrid, 
  TrendingUp, 
  MessageSquareWarning, 
  Users 
} from 'lucide-react';

import AdminOrdersTab, { OrderCounts } from './AdminOrdersTab';
import AdminProductsTab, { ProductFormData } from './AdminProductsTab';
import AdminOffersTab, { OfferFormData } from './AdminOffersTab';
import AdminCategoriesTab from './AdminCategoriesTab';
import AdminStatsTab, { StatsMetrics } from './AdminStatsTab';
import AdminUsersTab from './AdminUsersTab';
import AdminComplaintsTab from './AdminComplaintsTab';
import { Order, Product, Offer, Category } from '../../lib/types/store';

interface MerchantPortalProps {
  isMerchantAuthenticated: boolean;
  user: any;
  handleGoogleSignIn: () => Promise<void>;
  userRole: 'admin' | 'manager' | 'user';
  setIsMerchantOpen: (open: boolean) => void;
  pendingComplaintsCount: number;
  adminTab: 'orders' | 'products' | 'offers' | 'categories' | 'stats' | 'complaints' | 'users';
  setAdminTab: (tab: 'orders' | 'products' | 'offers' | 'categories' | 'stats' | 'complaints' | 'users') => void;

  // Orders Tab
  allOrders: Order[];
  filteredOrders: Order[];
  paginatedOrders: Order[];
  offers: Offer[];
  products: Product[];
  adminOrderSearch: string;
  setAdminOrderSearch: (s: string) => void;
  adminOrderFilter: 'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'bosta_unsynced' | 'bosta_synced';
  setAdminOrderFilter: (f: any) => void;
  orderCounts: OrderCounts;
  handleExportOrdersToExcel: (targetStatus?: string, exportFormat?: 'comprehensive' | 'standard_3_cols') => void;
  orderDatePreset: any;
  setOrderDatePreset: (p: any) => void;
  orderStartDate: string;
  setOrderStartDate: (d: string) => void;
  orderEndDate: string;
  setOrderEndDate: (d: string) => void;
  handleApplyDatePreset: (preset: any) => void;
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

  // Products Tab
  categories: Category[];
  isProductFormOpen: boolean;
  setIsProductFormOpen: (open: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isGeneratingSeo: boolean;
  handleGenerateSeo: () => Promise<void>;
  handleSaveProduct: (e: React.FormEvent) => Promise<void>;
  handleEditProduct: (prod: Product) => void;
  handleDeleteProduct: (pId: string) => Promise<void>;
  productToDelete: string | null;
  setProductToDelete: (id: string | null) => void;

  // Offers Tab
  isOfferFormOpen: boolean;
  setIsOfferFormOpen: (open: boolean) => void;
  editingOffer: Offer | null;
  setEditingOffer: (o: Offer | null) => void;
  offerForm: OfferFormData;
  setOfferForm: React.Dispatch<React.SetStateAction<OfferFormData>>;
  selectedProductForOffer: string;
  setSelectedProductForOffer: (id: string) => void;
  selectedQuantityForOffer: number;
  setSelectedQuantityForOffer: (q: number) => void;
  handleAddProductToOfferDraft: () => void;
  handleUpdateDraftItemQty: (productId: string, diff: number) => void;
  handleRemoveDraftItem: (productId: string) => void;
  handleSaveOffer: (e: React.FormEvent) => Promise<void>;
  handleEditOffer: (offer: Offer) => void;
  handleDeleteOffer: (offerId: string) => Promise<void>;
  handleToggleOfferAvailability: (offerId: string, currentStatus: boolean) => Promise<void>;
  offerToDelete: string | null;
  setOfferToDelete: (id: string | null) => void;

  // Categories Tab
  categoryForm: { name: string; key: string };
  setCategoryForm: React.Dispatch<React.SetStateAction<{ name: string; key: string }>>;
  categoryToDelete: string | null;
  setCategoryToDelete: (id: string | null) => void;
  isCategoryFormOpen: boolean;
  setIsCategoryFormOpen: (open: boolean) => void;

  // Stats Tab
  statsDateScopedOrders: Order[];
  handleExportStatsOrdersToExcel: () => void;
  statsPeriodDescription: string;
  statsStartDate: string;
  setStatsStartDate: (d: string) => void;
  statsEndDate: string;
  setStatsEndDate: (d: string) => void;
  statsDatePreset: any;
  handleApplyStatsDatePreset: (preset: any) => void;
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
  statsStartIndex: number;
  statsEndIndex: number;
  statsTotalPages: number;
  statsValidPage: number;
  setStatsOrdersCurrentPage: React.Dispatch<React.SetStateAction<number>>;

  // Users Tab
  allUsers: any[];
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  handleChangeUserRole: (userId: string, newRole: string) => Promise<void>;
}

export default function MerchantPortal({
  isMerchantAuthenticated,
  user,
  handleGoogleSignIn,
  userRole,
  setIsMerchantOpen,
  pendingComplaintsCount,
  adminTab,
  setAdminTab,

  // Orders
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
  handleDeleteOrder,

  // Products
  categories,
  isProductFormOpen,
  setIsProductFormOpen,
  editingProduct,
  setEditingProduct,
  productForm,
  setProductForm,
  isGeneratingSeo,
  handleGenerateSeo,
  handleSaveProduct,
  handleEditProduct,
  handleDeleteProduct,
  productToDelete,
  setProductToDelete,

  // Offers
  isOfferFormOpen,
  setIsOfferFormOpen,
  editingOffer,
  setEditingOffer,
  offerForm,
  setOfferForm,
  selectedProductForOffer,
  setSelectedProductForOffer,
  selectedQuantityForOffer,
  setSelectedQuantityForOffer,
  handleAddProductToOfferDraft,
  handleUpdateDraftItemQty,
  handleRemoveDraftItem,
  handleSaveOffer,
  handleEditOffer,
  handleDeleteOffer,
  handleToggleOfferAvailability,
  offerToDelete,
  setOfferToDelete,

  // Categories
  categoryForm,
  setCategoryForm,
  categoryToDelete,
  setCategoryToDelete,
  isCategoryFormOpen,
  setIsCategoryFormOpen,

  // Stats
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
  statsStartIndex,
  statsEndIndex,
  statsTotalPages,
  statsValidPage,
  setStatsOrdersCurrentPage,

  // Users
  allUsers,
  userSearchQuery,
  setUserSearchQuery,
  handleChangeUserRole
}: MerchantPortalProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden" dir="rtl" id="admin-page-dashboard">
      {!isMerchantAuthenticated ? (
        // Unauthenticated Screen - Clean Centered Grid Layout
        <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2 text-right">
              <h3 className="font-extrabold text-sm text-slate-900">بوابة المندوب والمشرف المعتمدة</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                يتم منح الصلاحيات تلقائياً وحصرياً للمشرفين والمدراء المعتمدين والموثقين في قاعدة بيانات المتجر لتعديل الحالات والقطع.
              </p>
            </div>

            {user ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-3 text-right">
                <p className="text-[11px] text-rose-800 leading-relaxed font-bold">
                  أنت مسجل الدخول ببريدك الإلكتروني: {user.email} <br />
                  ولكن هذا الحساب ليس لديه صلاحيات &quot;المندوب المشرف&quot; في قاعدة البيانات.
                </p>
                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  تسجيل الدخول كمدير بـ Gmail
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                 <button 
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.12-4.53-1.19-7.06z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>تسجيل الدخول السريع بجوجل</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Authenticated Dashboard Layout with Sidebar Tabs
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden text-xs">
          {/* Right sidebar panel for admin tabs (RTL) */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-slate-200 p-4 shrink-0 flex md:flex-col gap-1.5 overflow-y-auto">
            <div className="hidden md:block pb-4 border-b border-secondary mb-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">لوحة تحكم المتجر الكاملة</span>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-500 animate-spin" />
                <span>إدارة المشرف والمندوب</span>
              </h2>
            </div>

            {[
              { id: 'orders', label: 'إدارة طلبات المشترين', icon: Notebook },
              { id: 'products', label: 'المنظفات والقطع', icon: Package },
              { id: 'offers', label: 'إدارة العروض والباقات 🔥', icon: Sparkles },
              { id: 'categories', label: 'إدارة الفئات والمقاطع', icon: LayoutGrid },
              { id: 'stats', label: 'مؤشرات المبيعات', icon: TrendingUp },
              { id: 'complaints', label: 'الشكاوى والمقترحات', icon: MessageSquareWarning, badge: pendingComplaintsCount },
              ...(userRole === 'admin' ? [{ id: 'users', label: 'صلاحيات المستخدمين', icon: Users }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-right transition-all font-bold cursor-pointer ${
                  adminTab === tab.id 
                    ? 'bg-amber-50 text-amber-900 border-r-4 border-amber-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon className={`w-4 h-4 ${adminTab === tab.id ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="md:mt-auto pt-3 border-t border-slate-100">
              <button 
                onClick={() => { setIsMerchantOpen(false); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>← الرجوع لشاشة المتجر</span>
              </button>
            </div>
          </div>

          {/* Left/Middle core content space */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
            {adminTab === 'orders' && (
              <AdminOrdersTab
                allOrders={allOrders}
                filteredOrders={filteredOrders}
                paginatedOrders={paginatedOrders}
                offers={offers}
                products={products}
                adminOrderSearch={adminOrderSearch}
                setAdminOrderSearch={setAdminOrderSearch}
                adminOrderFilter={adminOrderFilter}
                setAdminOrderFilter={setAdminOrderFilter}
                orderCounts={orderCounts}
                handleExportOrdersToExcel={handleExportOrdersToExcel}
                orderDatePreset={orderDatePreset}
                setOrderDatePreset={setOrderDatePreset}
                orderStartDate={orderStartDate}
                setOrderStartDate={setOrderStartDate}
                orderEndDate={orderEndDate}
                setOrderEndDate={setOrderEndDate}
                handleApplyDatePreset={handleApplyDatePreset}
                handleBulkMovePendingToPreparing={handleBulkMovePendingToPreparing}
                isBulkMovingPending={isBulkMovingPending}
                handleBulkSyncOrdersWithShipping={handleBulkSyncOrdersWithShipping}
                isBulkSyncing={isBulkSyncing}
                bulkSyncProgress={bulkSyncProgress}
                failedSyncOrders={failedSyncOrders}
                openFailedOrdersReport={openFailedOrdersReport}
                deleteTargetDate={deleteTargetDate}
                setDeleteTargetDate={setDeleteTargetDate}
                setIsDeleteByDateModalOpen={setIsDeleteByDateModalOpen}
                totalOrders={totalOrders}
                totalOrderPages={totalOrderPages}
                validOrderPage={validOrderPage}
                startIndex={startIndex}
                endIndex={endIndex}
                ordersPerPage={ordersPerPage}
                setOrdersPerPage={setOrdersPerPage}
                setOrdersCurrentPage={setOrdersCurrentPage}
                handleResendPaginatedOrdersToShipping={handleResendPaginatedOrdersToShipping}
                isResendingPageOrders={isResendingPageOrders}
                resendPageProgress={resendPageProgress}
                handleUpdateStatus={handleUpdateStatus}
                handleCopyBillCode={handleCopyBillCode}
                copiedBillCode={copiedBillCode}
                handleSyncOrderWithShipping={handleSyncOrderWithShipping}
                syncingOrderId={syncingOrderId}
                copiedPackingOrderId={copiedPackingOrderId}
                setCopiedPackingOrderId={setCopiedPackingOrderId}
                setPackingSlipOrder={setPackingSlipOrder}
                orderToDelete={orderToDelete}
                setOrderToDelete={setOrderToDelete}
                handleDeleteOrder={handleDeleteOrder}
              />
            )}

            {adminTab === 'products' && (
              <AdminProductsTab
                products={products}
                categories={categories}
                isProductFormOpen={isProductFormOpen}
                setIsProductFormOpen={setIsProductFormOpen}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                productForm={productForm}
                setProductForm={setProductForm}
                isGeneratingSeo={isGeneratingSeo}
                handleGenerateSeo={handleGenerateSeo}
                handleSaveProduct={handleSaveProduct}
                handleEditProduct={handleEditProduct}
                handleDeleteProduct={handleDeleteProduct}
                productToDelete={productToDelete}
                setProductToDelete={setProductToDelete}
              />
            )}

            {adminTab === 'offers' && (
              <AdminOffersTab
                offers={offers}
                products={products}
                isOfferFormOpen={isOfferFormOpen}
                setIsOfferFormOpen={setIsOfferFormOpen}
                editingOffer={editingOffer}
                setEditingOffer={setEditingOffer}
                offerForm={offerForm}
                setOfferForm={setOfferForm}
                selectedProductForOffer={selectedProductForOffer}
                setSelectedProductForOffer={setSelectedProductForOffer}
                selectedQuantityForOffer={selectedQuantityForOffer}
                setSelectedQuantityForOffer={setSelectedQuantityForOffer}
                handleAddProductToOfferDraft={handleAddProductToOfferDraft}
                handleUpdateDraftItemQty={handleUpdateDraftItemQty}
                handleRemoveDraftItem={handleRemoveDraftItem}
                handleSaveOffer={handleSaveOffer}
                handleEditOffer={handleEditOffer}
                handleDeleteOffer={handleDeleteOffer}
                handleToggleOfferAvailability={handleToggleOfferAvailability}
                offerToDelete={offerToDelete}
                setOfferToDelete={setOfferToDelete}
              />
            )}

            {adminTab === 'categories' && (
              <AdminCategoriesTab
                categories={categories}
                products={products}
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
                isCategoryFormOpen={isCategoryFormOpen}
                setIsCategoryFormOpen={setIsCategoryFormOpen}
                categoryToDelete={categoryToDelete}
                setCategoryToDelete={setCategoryToDelete}
              />
            )}

            {adminTab === 'stats' && (
              <AdminStatsTab
                allOrders={allOrders}
                statsDateScopedOrders={statsDateScopedOrders}
                handleExportStatsOrdersToExcel={handleExportStatsOrdersToExcel}
                statsPeriodDescription={statsPeriodDescription}
                statsStartDate={statsStartDate}
                setStatsStartDate={setStatsStartDate}
                statsEndDate={statsEndDate}
                setStatsEndDate={setStatsEndDate}
                statsDatePreset={statsDatePreset}
                handleApplyStatsDatePreset={handleApplyStatsDatePreset}
                statsSingleDate={statsSingleDate}
                setStatsSingleDate={setStatsSingleDate}
                statsStatusMode={statsStatusMode}
                setStatsStatusMode={setStatsStatusMode}
                statsMetrics={statsMetrics}
                statsDisplayOrders={statsDisplayOrders}
                statsSearchQuery={statsSearchQuery}
                setStatsSearchQuery={setStatsSearchQuery}
                paginatedStatsOrders={paginatedStatsOrders}
                statsExpandedOrderId={statsExpandedOrderId}
                setStatsExpandedOrderId={setStatsExpandedOrderId}
                setAdminOrderSearch={setAdminOrderSearch}
                setAdminTab={setAdminTab}
                statsStartIndex={statsStartIndex}
                statsEndIndex={statsEndIndex}
                statsTotalPages={statsTotalPages}
                statsValidPage={statsValidPage}
                setStatsOrdersCurrentPage={setStatsOrdersCurrentPage}
              />
            )}

            {adminTab === 'complaints' && (
              <AdminComplaintsTab 
                userRole={userRole} 
                allOrders={allOrders} 
              />
            )}

            {adminTab === 'users' && (
              <AdminUsersTab
                allUsers={allUsers}
                userSearchQuery={userSearchQuery}
                setUserSearchQuery={setUserSearchQuery}
                handleChangeUserRole={handleChangeUserRole}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
