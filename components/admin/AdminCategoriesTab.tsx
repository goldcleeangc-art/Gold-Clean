'use client';

import React from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Category, Product } from '../../lib/types/store';

interface AdminCategoriesTabProps {
  categories: Category[];
  products: Product[];
  categoryForm: { name: string; key: string };
  setCategoryForm: React.Dispatch<React.SetStateAction<{ name: string; key: string }>>;
  isCategoryFormOpen: boolean;
  setIsCategoryFormOpen: (open: boolean) => void;
  categoryToDelete: string | null;
  setCategoryToDelete: (id: string | null) => void;
}

export default function AdminCategoriesTab({
  categories,
  products,
  categoryForm,
  setCategoryForm,
  isCategoryFormOpen,
  setIsCategoryFormOpen,
  categoryToDelete,
  setCategoryToDelete
}: AdminCategoriesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">إدارة فئات المنتجات</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">يمكنك إضافة فئات وتصنيفات جديدة وتخصيصها أو تعديلها كمشرف.</p>
        </div>
        <button 
          id="admin-new-cat"
          onClick={() => {
            setIsCategoryFormOpen(!isCategoryFormOpen);
            setCategoryForm({ name: '', key: '' });
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة فئة جديدة</span>
        </button>
      </div>

      {/* Add Category Form */}
      {isCategoryFormOpen && (
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            if (!categoryForm.name || !categoryForm.key) {
              alert('جميع الحقول مطلوبة.');
              return;
            }
            const cleanKey = categoryForm.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (!cleanKey) {
              alert('الرجاء كتابة اسم فئة مميز بالأحرف الإنجليزية فقط.');
              return;
            }
            
            // Check if category key already exists
            const keyExists = categories.some(cat => cat.key === cleanKey);
            if (keyExists) {
              alert('اسم فئة مكرر أو مستخدم بالفعل. الرجاء اختيار مفتاح فئة فريد.');
              return;
            }

            try {
              await addDoc(collection(db, 'categories'), {
                name: categoryForm.name.trim(),
                key: cleanKey
              });
              setIsCategoryFormOpen(false);
              setCategoryForm({ name: '', key: '' });
            } catch (err) {
              console.error(err);
              alert('خطأ أثناء إضافة الفئة لقاعدة البيانات.');
            }
          }}
          className="p-6 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-4 shadow-xs"
        >
          <h5 className="font-extrabold text-amber-950 text-sm">✨ إدراج فئة منتجات جديدة</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">اسم الفئة بالعربية *</label>
              <input 
                type="text" required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="منظفات سيارات، مغاسل..."
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">رمز الفئة بالإنجليزية (Slug/Key) *</label>
              <input 
                type="text" required
                value={categoryForm.key}
                onChange={(e) => setCategoryForm({ ...categoryForm, key: e.target.value })}
                placeholder="e.g. cars"
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 text-xs text-left"
                dir="ltr"
              />
              <p className="text-[10px] text-slate-400 mt-1">يستخدم كرمز فني لتصنيف وتصفية المنتجات داخلياً (مثال: cars).</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t border-amber-100">
            <button 
              type="button" 
              onClick={() => setIsCategoryFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
            >
              إضافة الفئة
            </button>
          </div>
        </form>
      )}

      {/* Display Categories Shelf */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 bg-white border border-slate-200/60 rounded-2xl flex gap-3 justify-between items-center hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h6 className="font-bold text-slate-800 text-xs">{cat.name}</h6>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  رمز الفئة: <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded">{cat.key}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {categoryToDelete === cat.id ? (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                  <button 
                    onClick={async () => {
                      const productsLinked = products.some(p => p.category === cat.key);
                      const isDuplicate = categories.filter(c => c.key === cat.key).length > 1;
                      
                      if (productsLinked && !isDuplicate) {
                        alert('تنبيه: لا يمكن حذف هذه الفئة لأن هناك بعض المنتجات ما زالت مرتبطة بها. الرجاء تعديل الفئة لتلك المنتجات أولاً.');
                        setCategoryToDelete(null);
                        return;
                      }
                      try {
                        if (cat.id) {
                          await deleteDoc(doc(db, 'categories', cat.id));
                        }
                      } catch (err) {
                        console.error(err);
                        alert('خطأ أثناء حذف الفئة.');
                      }
                      setCategoryToDelete(null);
                    }}
                    className="px-2 py-1 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer"
                  >
                    تأكيد
                  </button>
                  <button 
                    onClick={() => setCategoryToDelete(null)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setCategoryToDelete(cat.id || null)}
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
