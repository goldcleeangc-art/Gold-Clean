'use client';

import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  CheckCircle, 
  Truck, 
  Check, 
  Edit 
} from 'lucide-react';
import { Offer, Product, OfferItem } from '../../lib/types/store';

export interface OfferFormData {
  title: string;
  code?: string;
  description: string;
  badge: string;
  image: string;
  isAvailable: boolean;
  isFreeShipping: boolean;
  items: OfferItem[];
  originalPrice: number;
  offerPrice: number;
  savings: number;
}

interface AdminOffersTabProps {
  offers: Offer[];
  products: Product[];
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
}

export default function AdminOffersTab({
  offers,
  products,
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
  setOfferToDelete
}: AdminOffersTabProps) {
  return (
    <div className="space-y-6" id="admin-offers-tab">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h4 className="font-extrabold text-slate-900 text-sm">إدارة العروض والباقات الترويجية (Multi-Product Bundles)</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            قم بإنشاء وتجميع باقات عروض تتكون من عدة منتجات مع تحديد كمية كل منتج وحساب قيمة التوفير والخصم تلقائياً للعميل.
          </p>
        </div>
        <button 
          id="admin-new-offer-btn"
          onClick={() => {
            setEditingOffer(null);
            setOfferForm({
              title: '',
              code: '',
              description: '',
              badge: 'عرض توفير مميز 🔥',
              image: '',
              isAvailable: true,
              isFreeShipping: false,
              items: [],
              originalPrice: 0,
              offerPrice: 0,
              savings: 0
            });
            setSelectedProductForOffer('');
            setSelectedQuantityForOffer(1);
            setIsOfferFormOpen(!isOfferFormOpen);
          }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isOfferFormOpen ? 'إغلاق النموذج' : '+ إضافة باقة عرض جديدة'}</span>
        </button>
      </div>

      {/* Offer Builder Form */}
      {isOfferFormOpen && (
        <form onSubmit={handleSaveOffer} className="p-6 bg-white border border-rose-100 rounded-3xl space-y-5 shadow-sm" id="offer-builder-form">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h5 className="font-extrabold text-slate-900 text-sm">
                {editingOffer ? 'تعديل باقة العرض' : 'إنشاء وتكوين باقة عرض جديدة'}
              </h5>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">كل عرض يتكون من عدة منتجات مع كمياتها</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs">عنوان العرض / الباقة *</label>
              <input 
                id="offer-title-input"
                type="text"
                required
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                placeholder="مثال: باقة النظافة الشاملة للمنزل (4 قطع)"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs">كود العرض (Offer Code / SKU)</label>
              <input 
                id="offer-code-input"
                type="text"
                value={offerForm.code || ''}
                onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
                placeholder="مثال: GC-OFFER-01"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs">الشارة الترويجية (Badge)</label>
              <input 
                id="offer-badge-input"
                type="text"
                value={offerForm.badge}
                onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                placeholder="مثال: وفر 160 جنيه 🔥 أو أقوى توفير"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">وصف العرض ومميزاته *</label>
            <textarea 
              id="offer-desc-input"
              required
              rows={2}
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              placeholder="اكتب وصفاً جذاباً لمحتويات الباقة وكيف تساعد العميل في التوفير والحصول على أفضل نظافة..."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">رابط صورة العرض (اختياري - يترك فارغاً لاستخدام صور المنتجات)</label>
            <input 
              id="offer-image-input"
              type="url"
              value={offerForm.image}
              onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
              placeholder="https://..."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* MULTI-PRODUCT ITEM SELECTOR */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">محتويات الباقة (المنتجات والكميات) *</span>
                <span className="text-[10px] text-slate-500">اختر المنظف وحدد الكمية لإضافته إلى الباقة</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  id="offer-product-select"
                  value={selectedProductForOffer}
                  onChange={(e) => setSelectedProductForOffer(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none max-w-[200px]"
                >
                  <option value="">-- اختر منتجاً --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} ج)</option>
                  ))}
                </select>

                <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                  <button 
                    type="button" 
                    onClick={() => setSelectedQuantityForOffer(Math.max(1, selectedQuantityForOffer - 1))}
                    className="text-slate-500 hover:text-slate-900 px-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 font-bold text-xs">{selectedQuantityForOffer}</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedQuantityForOffer(selectedQuantityForOffer + 1)}
                    className="text-slate-500 hover:text-slate-900 px-1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button 
                  id="add-product-to-offer-draft-btn"
                  type="button"
                  onClick={handleAddProductToOfferDraft}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة للباقة</span>
                </button>
              </div>
            </div>

            {/* List of draft bundle items */}
            {offerForm.items.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                لم تقم بإضافة أي منتجات للباقة بعد. يرجى اختيار منتجات أعلاه.
              </div>
            ) : (
              <div className="space-y-2">
                {offerForm.items.map((it) => (
                  <div key={it.productId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      {it.image && (
                        <img src={it.image} alt={it.productName} className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1" />
                      )}
                      <div>
                        <h6 className="font-bold text-slate-800">{it.productName}</h6>
                        <span className="text-[10px] text-slate-400">
                          سعر القطعة: {it.unitPrice} جنيه {it.volume ? `• ${it.volume}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                        <button 
                          type="button" 
                          onClick={() => handleUpdateDraftItemQty(it.productId, -1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs">{it.quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => handleUpdateDraftItemQty(it.productId, 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-left font-bold text-slate-700 min-w-[70px]">
                        {(it.unitPrice * it.quantity).toFixed(2)} ج
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRemoveDraftItem(it.productId)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف من الباقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRICING & SAVINGS CALCULATION ENGINE */}
          <div className="p-5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl border border-amber-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-700" />
              <h6 className="font-extrabold text-slate-900 text-xs">حساب الأسعار والتوفير للباقة</h6>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  السعر الأصلي الإجمالي (Original Price) *
                </label>
                <div className="relative">
                  <input 
                    id="offer-original-price-input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={offerForm.originalPrice}
                    onChange={(e) => {
                      const orig = Number(e.target.value) || 0;
                      const sav = Math.max(0, orig - offerForm.offerPrice);
                      setOfferForm({ ...offerForm, originalPrice: orig, savings: sav });
                    }}
                    className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-xs font-mono font-bold pr-3 pl-14"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">جنيه</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">يُحسب تلقائياً من مجموع أسعار المنتجات المضافة</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  سعر العرض المخفض للعميل (Offer Price) *
                </label>
                <div className="relative">
                  <input 
                    id="offer-discounted-price-input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={offerForm.offerPrice}
                    onChange={(e) => {
                      const off = Number(e.target.value) || 0;
                      const sav = Math.max(0, offerForm.originalPrice - off);
                      setOfferForm({ ...offerForm, offerPrice: off, savings: sav });
                    }}
                    className="w-full bg-white border border-rose-300 p-2.5 rounded-xl text-xs font-mono font-extrabold text-rose-600 pr-3 pl-14 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-600">جنيه</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">مثال: لو السعر الأصلي 1000 وسعر العرض 840</span>
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-extrabold block">قيمة التوفير المحسوبة للعميل:</span>
                  <span className="text-[11px] text-emerald-700">
                    العميل سيوفر <strong className="font-extrabold text-sm">{Math.max(0, offerForm.originalPrice - offerForm.offerPrice)} جنيه</strong> عند شراء هذا العرض
                    {offerForm.originalPrice > 0 && offerForm.offerPrice > 0 && (
                      <span> (خصم {Math.round(((offerForm.originalPrice - offerForm.offerPrice) / offerForm.originalPrice) * 100)}%)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shrink-0 shadow-xs">
                وفر {Math.max(0, offerForm.originalPrice - offerForm.offerPrice)} ج
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="offer-available-check"
                checked={offerForm.isAvailable}
                onChange={(e) => setOfferForm({ ...offerForm, isAvailable: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="offer-available-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                العرض متاح للطلب الفوري في واجهة المتجر
              </label>
            </div>

            {/* Free Shipping Checkbox */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <label htmlFor="offer-free-shipping-check" className="text-xs font-extrabold text-slate-900 cursor-pointer block">
                    شحن مجاني لهذا العرض (Free Shipping) 🚚
                  </label>
                  <span className="text-[11px] text-slate-500">
                    عند تفعيل هذا الخيار، سيتم احتساب الشحن مجاناً (0 جنيه) تلقائياً عند طلب هذا العرض.
                  </span>
                </div>
              </div>
              <input 
                type="checkbox"
                id="offer-free-shipping-check"
                checked={Boolean(offerForm.isFreeShipping)}
                onChange={(e) => setOfferForm({ ...offerForm, isFreeShipping: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => { setIsOfferFormOpen(false); setEditingOffer(null); }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button 
              id="save-offer-submit-btn"
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingOffer ? 'تحديث وحفظ باقة العرض' : 'حفظ ونشر العرض بالمتجر'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Display Existing Offers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-extrabold text-slate-900 text-xs">قائمة العروض المسجلة ({offers.length})</h5>
          <span className="text-[10px] text-slate-400">تظهر هذه العروض في قسم &quot;عروض التوفير&quot; للعملاء</span>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <Sparkles className="w-10 h-10 text-rose-300 mx-auto mb-2" />
            <h5 className="font-bold text-slate-800 text-xs">لا توجد عروض مضافة بعد</h5>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              قم بالضغط على &quot;+ إضافة باقة عرض جديدة&quot; لتكوين عروض حصرية وتحديد الخصومات وقيم التوفير.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="admin-offers-grid">
            {offers.map((off) => {
              const savingsVal = off.savings || Math.max(0, off.originalPrice - off.offerPrice);
              const discountPercent = off.originalPrice > 0 ? Math.round((savingsVal / off.originalPrice) * 100) : 0;
              return (
                <div key={off.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-rose-200 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-rose-100">
                          {off.badge || 'عرض خاص'}
                        </span>
                        {off.isFreeShipping && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>شحن مجاني</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleOfferAvailability(off.id, off.isAvailable)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                          off.isAvailable 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {off.isAvailable ? 'متاح الآن' : 'غير متوفر'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <h5 className="font-extrabold text-slate-900 text-sm">{off.title}</h5>
                      {off.code && (
                        <span className="font-mono text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200 font-bold">
                          كود: {off.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{off.description}</p>

                    {/* Bundle items list */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block">المنتجات في الباقة:</span>
                      <ul className="text-[10px] text-slate-600 space-y-0.5">
                        {off.items.map((it, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span>• {it.quantity}× {it.productName}</span>
                            <span className="text-slate-400 font-mono">({it.unitPrice * it.quantity} ج)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    {/* Price & Savings Display */}
                    <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100/80 mb-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 line-through ml-1">{off.originalPrice} ج</span>
                          <span className="text-sm font-extrabold text-rose-600">{off.offerPrice} جنيه</span>
                        </div>
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                          خصم {discountPercent}%
                        </span>
                      </div>
                      <div className="mt-1 pt-1 border-t border-rose-100 text-[10px] font-bold text-emerald-700">
                        💰 قيمة التوفير: وفر {savingsVal} جنيه
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleEditOffer(off)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="تعديل العرض"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {offerToDelete === off.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                          <button
                            onClick={async () => {
                              await handleDeleteOffer(off.id);
                              setOfferToDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            onClick={() => setOfferToDelete(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setOfferToDelete(off.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          title="حذف العرض"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
