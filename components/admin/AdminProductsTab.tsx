'use client';

import React from 'react';
import { PlusCircle, Sparkles, Edit, Trash2 } from 'lucide-react';
import { Product, Category } from '../../lib/types/store';

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
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <span className="font-bold text-slate-800 text-sm block">قائمة مستودع المنتجات الحالي</span>
          <span className="text-[10px] text-slate-400">إضافة وتعديل وحذف منظفات متجر Gold Clean</span>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              name: '',
              code: '',
              description: '',
              price: 25,
              category: 'kitchen',
              image: '',
              volume: '750 مل',
              isAvailable: true,
              seoTitle: '',
              seoDescription: '',
              seoKeywords: ''
            });
            setIsProductFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Product adding form */}
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
              <label className="block text-[10px] text-slate-500 mb-1">السعر النهائي بالجنيه المصري *</label>
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
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
            >
              إلغاء التعديل
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
            >
              {editingProduct ? 'تحديث المنتج' : 'نشر المنتج'}
            </button>
          </div>
        </form>
      )}

      {/* Display Products Shelf */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="p-4 bg-white border border-slate-200/60 rounded-2xl flex gap-3 justify-between items-center hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h6 className="font-bold text-slate-800 text-xs">{p.name}</h6>
                  {p.code && (
                    <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                      كود: {p.code}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  السعر: {p.price} جنيه • متوفر: {p.isAvailable ? 'نعم' : 'لا'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => handleEditProduct(p)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/50 cursor-pointer"
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
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 cursor-pointer"
                  title="مسح من كشوف المتجر"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
