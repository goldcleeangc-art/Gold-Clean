'use client';

import React, { useState, useMemo } from 'react';
import { PlusCircle, Sparkles, Edit, Trash2, Layers, Flame, Pin, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { Product, Category, ProductTierOffer } from '../../lib/types/store';
import TieredPricingManager from './TieredPricingManager';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface ProductFormData {
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
  image: string;
  volume: string;
  isAvailable: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  tieredPricing?: ProductTierOffer[];
  isWhiteFriday?: boolean;
  isWhiteFridayPinned?: boolean;
  whiteFridayPrice?: number;
  whiteFridayBadge?: string;
  whiteFridayImage?: string;
}

interface AdminProductsTabProps {
  products: Product[];
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
}

export default function AdminProductsTab({
  products,
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
  setProductToDelete
}: AdminProductsTabProps) {
  const [updatingWfId, setUpdatingWfId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'white_friday' | 'regular'>('all');

  // Toggle White Friday enrollment directly from product card
  const handleToggleWhiteFriday = async (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setUpdatingWfId(prod.id);
      const ref = doc(db, 'products', prod.id);
      const nextWf = !prod.isWhiteFriday;
      const updateData: any = {
        isWhiteFriday: nextWf,
        updatedAt: serverTimestamp()
      };
      if (nextWf) {
        if (!prod.whiteFridayPrice || prod.whiteFridayPrice <= 0) {
          updateData.whiteFridayPrice = prod.price;
        }
        if (!prod.whiteFridayBadge) {
          updateData.whiteFridayBadge = 'عرض الجمعة البيضاء 🔥';
        }
      } else {
        updateData.isWhiteFridayPinned = false;
      }
      await updateDoc(ref, updateData);
    } catch (err) {
      console.error('Error toggling White Friday:', err);
      alert('خطأ أثناء تحديث حالة الجمعة البيضاء للمنتج');
    } finally {
      setUpdatingWfId(null);
    }
  };

  // Toggle Pinned / Priority within White Friday
  const handleTogglePinned = async (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setUpdatingWfId(prod.id);
      const ref = doc(db, 'products', prod.id);
      await updateDoc(ref, {
        isWhiteFridayPinned: !prod.isWhiteFridayPinned,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error toggling pin:', err);
      alert('خطأ أثناء تغيير حالة التثبيت');
    } finally {
      setUpdatingWfId(null);
    }
  };

  // Filter and sort products: White Friday products appear FIRST!
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesQuery = 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesQuery) return false;
        if (filterMode === 'white_friday') return Boolean(p.isWhiteFriday);
        if (filterMode === 'regular') return !p.isWhiteFriday;
        return true;
      })
      .sort((a, b) => {
        // 1. White Friday products always appear before regular products!
        const aWf = Boolean(a.isWhiteFriday);
        const bWf = Boolean(b.isWhiteFriday);
        if (aWf && !bWf) return -1;
        if (!aWf && bWf) return 1;

        // 2. If both are White Friday, pinned products come first!
        const aPinned = Boolean(a.isWhiteFridayPinned);
        const bPinned = Boolean(b.isWhiteFridayPinned);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        // 3. Alphabetical secondary sort
        return (a.name || '').localeCompare(b.name || '', 'ar');
      });
  }, [products, searchQuery, filterMode]);

  const whiteFridayCount = useMemo(() => products.filter(p => p.isWhiteFriday).length, [products]);
  const regularCount = products.length - whiteFridayCount;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <span className="font-bold text-slate-800 text-sm block">قائمة مستودع المنتجات الحالي ({products.length})</span>
          <span className="text-[10px] text-slate-400">
            تحديد منتجات الجمعة البيضاء، وتعديل وحذف منظفات متجر Gold Clean (المنتجات المحددة تظهر تلقائياً في مقدمة المتجر)
          </span>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              name: '',
              code: '',
              description: '',
              price: 25,
              category: categories[0]?.key || 'kitchen',
              image: '',
              volume: '750 مل',
              isAvailable: true,
              seoTitle: '',
              seoDescription: '',
              seoKeywords: '',
              tieredPricing: [],
              isWhiteFriday: false,
              isWhiteFridayPinned: false,
              whiteFridayPrice: 0,
              whiteFridayBadge: 'عرض الجمعة البيضاء 🔥',
              whiteFridayImage: ''
            });
            setIsProductFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Filter and quick search toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('white_friday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'white_friday'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>منتجات الجمعة البيضاء ({whiteFridayCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('regular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'regular'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            منتجات عادية ({regularCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الكود..."
            className="w-full bg-slate-50 border border-slate-200 pl-3 pr-8 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Product adding / editing form */}
      {isProductFormOpen && (
        <form onSubmit={handleSaveProduct} className="p-6 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-4 shadow-xs">
          <h5 className="font-extrabold text-amber-950 text-sm">
            {editingProduct ? '📝 تحديث تعديلات المنظف المحدد' : '✨ إدراج منظف جديد بالمنتجات المستهدفة'}
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">اسم المنظف *</label>
              <input 
                type="text" required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="صابون سائل للمطبخ فائق الرغوة..."
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">كود المنتج (SKU / Code)</label>
              <input 
                type="text"
                value={productForm.code || ''}
                onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                placeholder="مثال: GC-101 أو DSH-500"
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">الفئة *</label>
              <select 
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">السعر الأساسي بالجنيه المصري *</label>
              <input 
                type="number" required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">السعة والمواصفات (مثال: 750 مل) *</label>
              <input 
                type="text" required
                value={productForm.volume}
                onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">حالة التوفر *</label>
              <select 
                value={productForm.isAvailable ? "true" : "false"}
                onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.value === "true" })}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs"
              >
                <option value="true">متوفر للبيع</option>
                <option value="false">نفذت الكمية</option>
              </select>
            </div>
          </div>

          {/* White Friday Checkbox and Settings Section */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={Boolean(productForm.isWhiteFriday)}
                  onChange={(e) => setProductForm({ ...productForm, isWhiteFriday: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span className="font-extrabold text-xs text-amber-950">
                    تحديد هذا المنتج ضمن عروض الجمعة البيضاء 🔥 (يظهر أولاً بالمتجر)
                  </span>
                </div>
              </label>

              {productForm.isWhiteFriday && (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-900 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 select-none">
                  <input 
                    type="checkbox"
                    checked={Boolean(productForm.isWhiteFridayPinned)}
                    onChange={(e) => setProductForm({ ...productForm, isWhiteFridayPinned: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-amber-600 accent-amber-600 cursor-pointer"
                  />
                  <Pin className="w-3 h-3 text-amber-600" />
                  <span>تثبيت في بداية الترتيب (أولوية قصوى)</span>
                </label>
              )}
            </div>

            {productForm.isWhiteFriday && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                <div>
                  <label className="block text-[10px] text-amber-900 font-bold mb-1">
                    سعر عرض الجمعة البيضاء (ج.م) *
                  </label>
                  <input 
                    type="number"
                    value={productForm.whiteFridayPrice || productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, whiteFridayPrice: Number(e.target.value) })}
                    placeholder={String(productForm.price)}
                    className="w-full bg-white border border-amber-300 p-2.5 rounded-lg text-xs font-mono font-bold text-amber-900 outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    السعر الأساسي: {productForm.price} ج.م (يظهر مشطوباً عند تحديد سعر أقل للتخفيض)
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] text-amber-900 font-bold mb-1">
                    شارة العرض (Badge Text)
                  </label>
                  <input 
                    type="text"
                    value={productForm.whiteFridayBadge || ''}
                    onChange={(e) => setProductForm({ ...productForm, whiteFridayBadge: e.target.value })}
                    placeholder="عرض الجمعة البيضاء 🔥"
                    className="w-full bg-white border border-amber-300 p-2.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tiered / Volume Quantity Offers */}
          <TieredPricingManager
            basePrice={productForm.price}
            tiers={productForm.tieredPricing || []}
            onChange={(tiers) => setProductForm({ ...productForm, tieredPricing: tiers })}
          />

          <div>
            <label className="block text-[10px] text-slate-500 mb-1">صورة المنظف (رفع ملف أو رابط ويب)</label>
            <div className="flex gap-2 items-center">
              <label className="flex-1 cursor-pointer bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors py-2.5 px-3 rounded-lg text-center text-[11px] font-bold text-slate-600">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const MAX_WIDTH = 600;
                          const scaleSize = MAX_WIDTH / img.width;
                          canvas.width = MAX_WIDTH;
                          canvas.height = img.height * scaleSize;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                            setProductForm({ ...productForm, image: dataUrl });
                          } else {
                            setProductForm({ ...productForm, image: reader.result as string });
                          }
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                <span>اختر صورة من جهازك</span>
              </label>
              <span className="text-[10px] text-slate-400">أو</span>
              <input 
                type="text"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                placeholder="https://..."
                className="flex-[2] bg-white border border-slate-200 p-2.5 rounded-lg text-[11px] text-left font-mono outline-none focus:ring-1 focus:ring-amber-500"
                dir="ltr"
              />
            </div>
            {productForm.image && (
              <div className="mt-2 flex justify-start">
                <img src={productForm.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1">وصف شامل وفهرس مزايا المنظف *</label>
            <textarea required
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="تركيبة ثنائية القوة والفاعلية للتغلب على بقع الشحوم بفاعلية عالية..."
              className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs leading-relaxed"
              rows={2}
            />
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h6 className="font-bold text-slate-800 text-xs">إعدادات تحسين محركات البحث (SEO) 🔍</h6>
              <button
                type="button"
                onClick={handleGenerateSeo}
                disabled={isGeneratingSeo}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingSeo ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التوليد بذكاء...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>توليد بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">SEO Title (عنوان صفحة المنظف على جوجل)</label>
              <input 
                type="text"
                value={productForm.seoTitle}
                onChange={(e) => setProductForm({ ...productForm, seoTitle: e.target.value })}
                placeholder="مثال: صابون أطباق برائحة الليمون 750 مل | متجر جولد كلين"
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">SEO Description (وصف الميتا في نتائج البحث)</label>
              <textarea
                value={productForm.seoDescription}
                onChange={(e) => setProductForm({ ...productForm, seoDescription: e.target.value })}
                placeholder="اكتب وصفاً جذاباً وقصيراً يظهر كنبذة في جوجل لمضاعفة زيارات متجرك..."
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs leading-relaxed"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">SEO Keywords (الكلمات المفتاحية مفصولة بفواصل)</label>
              <input 
                type="text"
                value={productForm.seoKeywords}
                onChange={(e) => setProductForm({ ...productForm, seoKeywords: e.target.value })}
                placeholder="مثال: صابون أطباق, سائل غسيل, ليمون, جولد كلين, منظف قوي"
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button 
              type="button" 
              onClick={() => { setIsProductFormOpen(false); setEditingProduct(null); }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold cursor-pointer transition-colors text-xs"
            >
              إلغاء التعديل
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer transition-colors text-xs"
            >
              {editingProduct ? 'تحديث المنتج' : 'نشر المنتج'}
            </button>
          </div>
        </form>
      )}

      {/* Display Products Shelf */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <p className="text-slate-500 text-xs font-bold">لا توجد منتجات مطابقة لخيارات الفلترة الحالية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedProducts.map((p) => {
            const isWf = Boolean(p.isWhiteFriday);
            const isPinned = Boolean(p.isWhiteFridayPinned);
            const isUpdating = updatingWfId === p.id;

            return (
              <div 
                key={p.id} 
                className={`p-4 bg-white rounded-2xl flex flex-col justify-between transition-all relative ${
                  isWf 
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/30 to-white shadow-xs' 
                    : 'border border-slate-200/80 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Header / Info */}
                  <div className="flex gap-3 justify-between items-start mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        {isWf && (
                          <div className="absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-2xs">
                            <Flame className="w-2.5 h-2.5 fill-slate-950" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h6 className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{p.name}</h6>
                          {p.code && (
                            <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-bold shrink-0">
                              كود: {p.code}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          السعر الأساسي: <strong className="text-slate-800">{p.price} ج.م</strong> • متوفر: {p.isAvailable ? 'نعم' : 'لا'}
                        </span>
                        {p.tieredPricing && p.tieredPricing.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-1">
                            <Layers className="w-2.5 h-2.5 text-amber-600" />
                            <span>عروض كمية ({p.tieredPricing.length})</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleEditProduct(p)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/50 cursor-pointer transition-colors"
                        title="تعديل تفاصيل المنظف"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {productToDelete === p.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                          <button 
                            onClick={async () => {
                              await handleDeleteProduct(p.id);
                              setProductToDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button 
                            onClick={() => setProductToDelete(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setProductToDelete(p.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                          title="مسح من كشوف المتجر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* White Friday Checkbox & Pin Controls Bar */}
                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <label 
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs border cursor-pointer transition-all select-none ${
                      isWf 
                        ? 'bg-amber-500/15 border-amber-400 text-amber-950 font-black shadow-2xs ring-1 ring-amber-300/40' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                    title="تحديد الخانة لإدراج المنتج ضمن عروض الجمعة البيضاء وظهوره في مقدمة المتجر"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    ) : (
                      <input 
                        type="checkbox"
                        checked={isWf}
                        onChange={() => handleToggleWhiteFriday(p)}
                        className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                      />
                    )}
                    <Flame className={`w-3.5 h-3.5 ${isWf ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                    <span>الجمعة البيضاء</span>
                    {isWf && p.whiteFridayPrice && p.whiteFridayPrice < p.price && (
                      <span className="text-[10px] text-amber-900 font-mono bg-white px-1.5 py-0.2 rounded border border-amber-200">
                        {p.whiteFridayPrice} ج.م
                      </span>
                    )}
                  </label>

                  {/* Pin to Top priority */}
                  {isWf && (
                    <button
                      type="button"
                      onClick={() => handleTogglePinned(p)}
                      disabled={isUpdating}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs font-black'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                      title={isPinned ? 'مثبت في أول الترتيب - اضغط لإلغاء التثبيت' : 'تثبيت في بداية الترتيب قبل المنتجات الأخرى'}
                    >
                      <Pin className={`w-3 h-3 ${isPinned ? 'rotate-45 fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
                      <span>{isPinned ? 'مثبت أولاً 📌' : 'تثبيت'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
