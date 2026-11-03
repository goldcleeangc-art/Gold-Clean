'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  PlusCircle, 
  Tag, 
  Calendar, 
  Check, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Eye, 
  TrendingDown, 
  Layers, 
  Save, 
  Clock, 
  CheckCircle2, 
  X,
  Package,
  ArrowRight,
  Percent,
  ImageIcon,
  Loader2,
  Gift,
  Boxes,
  Plus,
  Minus
} from 'lucide-react';
import { Product, Category, WhiteFridaySettings, ProductTierOffer, BundleProductItem } from '../../lib/types/store';
import { db } from '../../lib/firebase';
import { doc, updateDoc, setDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import ImageUploadField from './ImageUploadField';
import TieredPricingManager from './TieredPricingManager';

interface AdminWhiteFridayTabProps {
  products: Product[];
  categories: Category[];
  whiteFridaySettings: WhiteFridaySettings;
}

export default function AdminWhiteFridayTab({
  products,
  categories,
  whiteFridaySettings
}: AdminWhiteFridayTabProps) {
  // 1. Settings State (Banner & Announcement)
  const [bannerForm, setBannerForm] = useState<WhiteFridaySettings>(whiteFridaySettings);
  const [isSavingBanner, setIsSavingBanner] = useState<boolean>(false);
  const [bannerSavedSuccess, setBannerSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (whiteFridaySettings) {
      setBannerForm(whiteFridaySettings);
    }
  }, [whiteFridaySettings]);

  // 2. Add existing product state
  const [isAddExistingOpen, setIsAddExistingOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [existingWhiteFridayPrice, setExistingWhiteFridayPrice] = useState<number>(0);
  const [existingBadge, setExistingBadge] = useState<string>('عرض الجمعة البيضاء 🔥');
  const [existingImage, setExistingImage] = useState<string>('');
  const [existingTiers, setExistingTiers] = useState<ProductTierOffer[]>([]);
  const [isAddingExisting, setIsAddingExisting] = useState<boolean>(false);

  // 3. Create brand-new product state
  const [isCreateNewOpen, setIsCreateNewOpen] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    code: '',
    category: categories[0]?.key || 'kitchen',
    regularPrice: 100,
    whiteFridayPrice: 65,
    volume: '1 لتر',
    image: '',
    description: '',
    badge: 'عرض الجمعة البيضاء 🔥',
    tieredPricing: [] as ProductTierOffer[]
  });

  // 4. Edit existing enrolled product state
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editBadge, setEditBadge] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [editTiers, setEditTiers] = useState<ProductTierOffer[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // 5. Product to remove from White Friday
  const [productToRemove, setProductToRemove] = useState<Product | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // 6. Multi-product Combo Bundle State
  const [isComboModalOpen, setIsComboModalOpen] = useState<boolean>(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [isSavingCombo, setIsSavingCombo] = useState<boolean>(false);
  const [comboForm, setComboForm] = useState({
    title: '',
    code: '',
    category: categories[0]?.key || 'kitchen',
    offerPrice: 0,
    badge: 'باقة مجمعة 🎁',
    image: '',
    description: '',
    items: [] as BundleProductItem[]
  });
  const [comboSelectedProdId, setComboSelectedProdId] = useState<string>('');
  const [comboSelectedProdQty, setComboSelectedProdQty] = useState<number>(1);

  // Filter products
  const whiteFridayProducts = products.filter(p => p.isWhiteFriday === true);
  const nonWhiteFridayProducts = products.filter(p => !p.isWhiteFriday);
  // Available catalog products for combo bundling (excluding combo bundles themselves to prevent nesting)
  const regularCatalogProducts = products.filter(p => !p.isBundle);

  // Auto-calculated Combo Metrics
  const comboOriginalPrice = comboForm.items.reduce(
    (sum, it) => sum + (Number(it.price) * Number(it.quantity)),
    0
  );
  const comboSavings = Math.max(0, comboOriginalPrice - Number(comboForm.offerPrice || 0));
  const comboDiscountPct = comboOriginalPrice > 0
    ? Math.max(0, Math.round((comboSavings / comboOriginalPrice) * 100))
    : 0;

  // Selected product object for enrollment
  const currentSelectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate stats
  const totalWfProducts = whiteFridayProducts.length;
  const avgDiscount = totalWfProducts > 0
    ? Math.round(
        whiteFridayProducts.reduce((sum, p) => {
          const orig = p.price || 1;
          const wf = p.whiteFridayPrice || orig;
          const discountPct = Math.max(0, Math.round(((orig - wf) / orig) * 100));
          return sum + discountPct;
        }, 0) / totalWfProducts
      )
    : 0;

  const maxDiscount = totalWfProducts > 0
    ? Math.max(
        ...whiteFridayProducts.map(p => {
          const orig = p.price || 1;
          const wf = p.whiteFridayPrice || orig;
          return Math.max(0, Math.round(((orig - wf) / orig) * 100));
        })
      )
    : 0;

  // Handler: Save Banner Settings
  const handleSaveBannerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanner(true);
    try {
      const settingsRef = doc(db, 'settings', 'white_friday');
      await setDoc(settingsRef, {
        isActive: bannerForm.isActive,
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        badgeText: bannerForm.badgeText.trim(),
        endDate: bannerForm.endDate || '2026-11-30T23:59:59',
        bannerImage: bannerForm.bannerImage?.trim() || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setBannerSavedSuccess(true);
      setTimeout(() => setBannerSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving White Friday banner settings:', err);
      alert('حدث خطأ أثناء حفظ إعدادات البانر. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingBanner(false);
    }
  };

  // Handler: Enroll Existing Product
  const handleEnrollExistingProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !currentSelectedProduct) {
      alert('يرجى اختيار منتج من القائمة.');
      return;
    }
    if (!existingWhiteFridayPrice || existingWhiteFridayPrice <= 0) {
      alert('يرجى تحديد سعر مخفض صحيح للجمعة البيضاء.');
      return;
    }
    if (existingWhiteFridayPrice >= currentSelectedProduct.price) {
      if (!confirm('سعر الجمعة البيضاء أعلى من أو يساوي السعر الأساسي للمنتج. هل ترغب في المتابعة؟')) {
        return;
      }
    }

    setIsAddingExisting(true);
    try {
      const prodRef = doc(db, 'products', selectedProductId);
      const chosenImage = existingImage.trim() || currentSelectedProduct.image;
      const validTiers = existingTiers.filter(t => Number(t.quantity) > 1 && Number(t.price) > 0);
      const updateData: any = {
        isWhiteFriday: true,
        whiteFridayPrice: Number(existingWhiteFridayPrice),
        whiteFridayBadge: existingBadge.trim() || 'عرض الجمعة البيضاء 🔥',
        originalPrice: currentSelectedProduct.price,
        whiteFridayImage: chosenImage,
        tieredPricing: validTiers,
        updatedAt: serverTimestamp()
      };

      if (existingImage.trim() && existingImage.trim() !== currentSelectedProduct.image) {
        updateData.originalImage = currentSelectedProduct.image;
        updateData.image = chosenImage;
      }

      await updateDoc(prodRef, updateData);

      setIsAddExistingOpen(false);
      setSelectedProductId('');
      setExistingWhiteFridayPrice(0);
      setExistingBadge('عرض الجمعة البيضاء 🔥');
      setExistingImage('');
      setExistingTiers([]);
    } catch (err) {
      console.error('Error enrolling product into White Friday:', err);
      alert('حدث خطأ أثناء إضافة المنتج إلى الجمعة البيضاء.');
    } finally {
      setIsAddingExisting(false);
    }
  };

  // Handler: Create Brand New Product
  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      alert('يرجى إدخال اسم المنتج.');
      return;
    }
    if (newProductForm.whiteFridayPrice <= 0) {
      alert('يرجى إدخال سعر صحيح للجمعة البيضاء.');
      return;
    }

    setIsCreatingNew(true);
    try {
      const prodCollection = collection(db, 'products');
      const finalImage = newProductForm.image.trim() || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';
      const validTiers = (newProductForm.tieredPricing || []).filter(t => Number(t.quantity) > 1 && Number(t.price) > 0);
      await addDoc(prodCollection, {
        name: newProductForm.name.trim(),
        code: newProductForm.code.trim() || `WF${Math.floor(Math.random() * 900) + 100}`,
        category: newProductForm.category,
        price: Number(newProductForm.regularPrice) || Number(newProductForm.whiteFridayPrice),
        whiteFridayPrice: Number(newProductForm.whiteFridayPrice),
        isWhiteFriday: true,
        whiteFridayBadge: newProductForm.badge.trim() || 'عرض الجمعة البيضاء 🔥',
        volume: newProductForm.volume.trim() || '1 لتر',
        image: finalImage,
        whiteFridayImage: finalImage,
        tieredPricing: validTiers,
        description: newProductForm.description.trim() || 'منتج عالي التركيز والجودة من مصنع جولد كلين بعرض حصري للجمعة البيضاء.',
        isAvailable: true,
        rating: 5,
        reviewsCount: 1,
        createdAt: serverTimestamp()
      });

      setIsCreateNewOpen(false);
      setNewProductForm({
        name: '',
        code: '',
        category: categories[0]?.key || 'kitchen',
        regularPrice: 100,
        whiteFridayPrice: 65,
        volume: '1 لتر',
        image: '',
        description: '',
        badge: 'عرض الجمعة البيضاء 🔥',
        tieredPricing: []
      });
    } catch (err) {
      console.error('Error creating new White Friday product:', err);
      alert('حدث خطأ أثناء إنشاء المنتج.');
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Handler: Save Edit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSavingEdit(true);
    try {
      const prodRef = doc(db, 'products', editingItem.id);
      const finalImage = editImage.trim() || editingItem.whiteFridayImage || editingItem.image;
      const validTiers = editTiers.filter(t => Number(t.quantity) > 1 && Number(t.price) > 0);
      await updateDoc(prodRef, {
        whiteFridayPrice: Number(editPrice),
        whiteFridayBadge: editBadge.trim(),
        whiteFridayImage: finalImage,
        image: finalImage,
        tieredPricing: validTiers,
        updatedAt: serverTimestamp()
      });
      setEditingItem(null);
      setEditTiers([]);
    } catch (err) {
      console.error('Error updating White Friday product:', err);
      alert('حدث خطأ أثناء تعديل المنتج.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handler: Remove Product or Delete Combo from White Friday
  const handleConfirmRemove = async () => {
    if (!productToRemove) return;
    setIsRemoving(true);
    try {
      if (productToRemove.isBundle) {
        await deleteDoc(doc(db, 'products', productToRemove.id));
      } else {
        const prodRef = doc(db, 'products', productToRemove.id);
        const updateData: any = {
          isWhiteFriday: false,
          updatedAt: serverTimestamp()
        };
        if (productToRemove.originalImage) {
          updateData.image = productToRemove.originalImage;
        }
        await updateDoc(prodRef, updateData);
      }
      setProductToRemove(null);
    } catch (err) {
      console.error('Error removing product from White Friday:', err);
      alert('حدث خطأ أثناء إزالة المنتج من الجمعة البيضاء.');
    } finally {
      setIsRemoving(false);
    }
  };

  // -------------------------------------------------------------
  // Combo Bundle Handlers (Multi-product bundles)
  // -------------------------------------------------------------
  const handleOpenCreateCombo = () => {
    setEditingComboId(null);
    const initialProd = regularCatalogProducts[0] || products[0];
    setComboForm({
      title: '',
      code: `WF-BNDL-${Math.floor(Math.random() * 900) + 100}`,
      category: categories[0]?.key || 'kitchen',
      offerPrice: 0,
      badge: 'باقة مجمعة 🎁',
      image: '',
      description: '',
      items: []
    });
    setComboSelectedProdId(initialProd?.id || '');
    setComboSelectedProdQty(1);
    setIsComboModalOpen(true);
  };

  const handleOpenEditCombo = (prod: Product) => {
    setEditingComboId(prod.id);
    const initialProd = regularCatalogProducts[0] || products[0];
    setComboForm({
      title: prod.name,
      code: prod.code || `WF-BNDL-${Math.floor(Math.random() * 900) + 100}`,
      category: prod.category || categories[0]?.key || 'kitchen',
      offerPrice: prod.whiteFridayPrice || prod.price || 0,
      badge: prod.whiteFridayBadge || 'باقة مجمعة 🎁',
      image: prod.whiteFridayImage || prod.image || '',
      description: prod.description || '',
      items: prod.bundleItems || []
    });
    setComboSelectedProdId(initialProd?.id || '');
    setComboSelectedProdQty(1);
    setIsComboModalOpen(true);
  };

  const handleAddProductToCombo = () => {
    if (!comboSelectedProdId) {
      alert('يرجى اختيار منتج من القائمة أولاً.');
      return;
    }
    const targetProd = products.find(p => p.id === comboSelectedProdId);
    if (!targetProd) return;

    const qty = Math.max(1, Number(comboSelectedProdQty) || 1);
    setComboForm(prev => {
      const existingIdx = prev.items.findIndex(it => it.productId === targetProd.id);
      let newItems: BundleProductItem[];
      if (existingIdx > -1) {
        newItems = prev.items.map((it, idx) => 
          idx === existingIdx ? { ...it, quantity: it.quantity + qty } : it
        );
      } else {
        newItems = [
          ...prev.items,
          {
            productId: targetProd.id,
            productName: targetProd.name,
            productCode: targetProd.code || '',
            quantity: qty,
            price: targetProd.price,
            image: targetProd.image || '',
            volume: targetProd.volume || '1 لتر'
          }
        ];
      }

      // Auto-suggest title if empty
      const updatedTitle = prev.title.trim()
        ? prev.title
        : `باقة: ${newItems.map(i => i.productName).join(' + ')}`;

      // Auto-suggest initial offer price (25% discount off total) if offerPrice is 0
      const newOrigSum = newItems.reduce((s, it) => s + (it.price * it.quantity), 0);
      const updatedOfferPrice = prev.offerPrice > 0 ? prev.offerPrice : Math.round(newOrigSum * 0.75);

      // Auto-fill bundle image from first product if empty
      const updatedImage = prev.image ? prev.image : (newItems[0]?.image || '');

      return {
        ...prev,
        title: updatedTitle,
        offerPrice: updatedOfferPrice,
        image: updatedImage,
        items: newItems
      };
    });
  };

  const handleUpdateComboItemQty = (productId: string, delta: number) => {
    setComboForm(prev => {
      const updated = prev.items
        .map(it => {
          if (it.productId === productId) {
            const nextQty = it.quantity + delta;
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter(it => it.quantity > 0);
      return { ...prev, items: updated };
    });
  };

  const handleRemoveComboItem = (productId: string) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.filter(it => it.productId !== productId)
    }));
  };

  const handleSaveComboBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboForm.title.trim()) {
      alert('يرجى كتابة عنوان أو اسم الباقة المجمعة.');
      return;
    }
    if (comboForm.items.length === 0) {
      alert('يرجى إضافة منتجات إلى الباقة أولاً.');
      return;
    }
    if (comboForm.items.length === 1) {
      if (!confirm('الباقة تحتوي على منتج واحد فقط. يفضل إضافة منتجين مختلفين على الأقل لتكوين باقة مجمعة. هل ترغب في المتابعة؟')) {
        return;
      }
    }
    if (!comboForm.offerPrice || comboForm.offerPrice <= 0) {
      alert('يرجى تحديد سعر مخفض صحيح للباقة.');
      return;
    }

    setIsSavingCombo(true);
    try {
      const finalImage = comboForm.image.trim() || comboForm.items[0]?.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';
      const bundleData = {
        name: comboForm.title.trim(),
        code: comboForm.code.trim() || `WF-BNDL-${Math.floor(Math.random() * 900) + 100}`,
        category: comboForm.category,
        price: comboOriginalPrice,
        whiteFridayPrice: Number(comboForm.offerPrice),
        isWhiteFriday: true,
        whiteFridayBadge: comboForm.badge.trim() || 'باقة مجمعة 🎁',
        image: finalImage,
        whiteFridayImage: finalImage,
        description: comboForm.description.trim() || `باقة مجمعة مميزة للجمعة البيضاء تشمل: ${comboForm.items.map(i => `${i.quantity}× ${i.productName}`).join(' + ')}`,
        volume: `${comboForm.items.reduce((s, it) => s + it.quantity, 0)} عبوات`,
        isAvailable: true,
        isBundle: true,
        bundleItems: comboForm.items,
        rating: 5,
        reviewsCount: 1,
        updatedAt: serverTimestamp()
      };

      if (editingComboId) {
        const prodRef = doc(db, 'products', editingComboId);
        await updateDoc(prodRef, bundleData);
      } else {
        const prodCol = collection(db, 'products');
        await addDoc(prodCol, {
          ...bundleData,
          createdAt: serverTimestamp()
        });
      }

      setIsComboModalOpen(false);
      setEditingComboId(null);
    } catch (err) {
      console.error('Error saving combo bundle:', err);
      alert('حدث خطأ أثناء حفظ الباقة المجمعة.');
    } finally {
      setIsSavingCombo(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl" id="admin-white-friday-tab">
      
      {/* 1. HEADER & KPI CARDS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-black mb-3">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>إدارة موسم الجمعة البيضاء | White Friday Hub</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                قسم عروض وتخفيضات الجمعة البيضاء
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 font-medium leading-relaxed">
                أضف منتجاتك بأسعار وتخفيضات خاصة للجمعة البيضاء، وتحكم الكامل في ظهور البانر الإعلاني والعد التنازلي على واجهة المتجر الرئيسية.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenCreateCombo}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-[1.02] border border-amber-300"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                <span>إنشاء باقة مجمعة (منتجين أو أكثر)</span>
              </button>

              <button
                onClick={() => {
                  setIsAddExistingOpen(true);
                  if (nonWhiteFridayProducts.length > 0) {
                    const firstProd = nonWhiteFridayProducts[0];
                    setSelectedProductId(firstProd.id);
                    setExistingWhiteFridayPrice(Math.round(firstProd.price * 0.7));
                    setExistingImage(firstProd.whiteFridayImage || firstProd.image || '');
                    setExistingTiers(firstProd.tieredPricing || []);
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>إضافة منتج من الكتالوج</span>
              </button>

              <button
                onClick={() => setIsCreateNewOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>إنشاء منتج جديد خاص</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">المنتجات المشاركة</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">
                {totalWfProducts} <span className="text-xs font-normal text-slate-300">منتج</span>
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">متوسط نسبة الخصم</span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5 block">
                {avgDiscount}%
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">أعلى نسبة تخفيض</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                {maxDiscount}%
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">حالة إعلان الرئيسية</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-black mt-1.5 px-2.5 py-0.5 rounded-full ${
                bannerForm.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${bannerForm.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>{bannerForm.isActive ? 'مفعل ويعمل' : 'معطل ومخفي'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BANNER & ANNOUNCEMENT SETTINGS CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-5 border-b border-slate-150 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                إعدادات بانر وإعلان الجمعة البيضاء في الصفحة الرئيسية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تخصيص الرسالة الإعلانية البارزة التي تظهر لزوار المتجر في الصفحة الرئيسية والعد التنازلي.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              {bannerForm.isActive ? 'الإعلان مفعّل في الرئيسية' : 'الإعلان معطل'}
            </span>
            <div 
              onClick={() => setBannerForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                bannerForm.isActive ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                bannerForm.isActive ? '-translate-x-5.5' : 'translate-x-0'
              }`} />
            </div>
          </label>
        </div>

        <form onSubmit={handleSaveBannerSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان الإعلان الرئيسي
              </label>
              <input 
                type="text"
                value={bannerForm.title}
                onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: مهرجان كبرى تخفيضات الجمعة البيضاء 🔥"
                className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص الشارة العلوية (Badge Text)
              </label>
              <input 
                type="text"
                value={bannerForm.badgeText}
                onChange={(e) => setBannerForm(prev => ({ ...prev, badgeText: e.target.value }))}
                placeholder="مثال: عروض الجمعة البيضاء الحصرية"
                className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الوصف الترويجي للإعلان
              </label>
              <input 
                type="text"
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="مثال: وفّري حتى 60% على أرقى باقات ومنظفات جولد كلين مع هدايا حصرية وشحن فوري!"
                className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>تاريخ انتهاء العرض (للعداد)</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input 
                type="datetime-local"
                value={bannerForm.endDate ? bannerForm.endDate.slice(0, 16) : '2026-11-30T23:59'}
                onChange={(e) => setBannerForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none font-sans"
              />
            </div>
          </div>

          {/* Banner Promotional Image (Optional) */}
          <div className="pt-1">
            <ImageUploadField
              label="صورة أو بانر إعلان الجمعة البيضاء (اختياري)"
              value={bannerForm.bannerImage || ''}
              onChange={(val) => setBannerForm(prev => ({ ...prev, bannerImage: val }))}
              placeholder="https://..."
              helpText="صورة بانر ترويجية عالية الجودة تظهر في واجهة المتجر وتخزن كنص في قاعدة البيانات."
              maxWidth={1200}
              maxHeight={600}
              quality={0.75}
            />
          </div>

          {/* Banner Live Preview */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-[#1C1326] to-slate-950 text-white border border-amber-500/30 overflow-hidden relative">
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                معاينة شكل الإعلان في الصفحة الرئيسية
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                {bannerForm.badgeText || 'الجمعة البيضاء'}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
              {bannerForm.bannerImage && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shrink-0">
                  <img src={bannerForm.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-right">
                <h4 className="font-black text-sm text-white">
                  {bannerForm.title || 'عنوان إعلان الجمعة البيضاء'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {bannerForm.subtitle || 'الوصف الترويجي للعرض والخصومات'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {bannerSavedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                تم حفظ وتحديث الإعلان بنجاح!
              </span>
            )}
            <button
              type="submit"
              disabled={isSavingBanner}
              className="bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingBanner ? 'جاري الحفظ...' : 'حفظ إعدادات الإعلان'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. ACTIVE WHITE FRIDAY PRODUCTS LIST */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-150 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                المنتجات الحالية في قسم الجمعة البيضاء ({whiteFridayProducts.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              يمكنك تعديل أسعار وشارات العروض أو استبعاد أي منتج بنقرة واحدة ليعود لسعره الطبيعي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateCombo}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Gift className="w-3.5 h-3.5 text-slate-950" />
              <span>إنشاء باقة مجمعة</span>
            </button>

            <button
              onClick={() => {
                setIsAddExistingOpen(true);
                if (nonWhiteFridayProducts.length > 0) {
                  const firstProd = nonWhiteFridayProducts[0];
                  setSelectedProductId(firstProd.id);
                  setExistingWhiteFridayPrice(Math.round(firstProd.price * 0.7));
                  setExistingImage(firstProd.whiteFridayImage || firstProd.image || '');
                  setExistingTiers(firstProd.tieredPricing || []);
                }
              }}
              className="bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>إضافة منتج إضافي</span>
            </button>
          </div>
        </div>

        {whiteFridayProducts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-3">
              <Flame className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              لا توجد منتجات مضافة لقسم الجمعة البيضاء حتى الآن
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              ابدأ الآن بإنشاء باقة مجمعة من منتجين أو أكثر أو إضافة منتجات من كتالوج المتجر لتظهر للزبائن في قسم الجمعة البيضاء.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={handleOpenCreateCombo}
                className="bg-slate-900 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span>إنشاء باقة مجمعة (منتجين أو أكثر)</span>
              </button>

              <button
                onClick={() => {
                  setIsAddExistingOpen(true);
                  if (nonWhiteFridayProducts.length > 0) {
                    const firstProd = nonWhiteFridayProducts[0];
                    setSelectedProductId(firstProd.id);
                    setExistingWhiteFridayPrice(Math.round(firstProd.price * 0.7));
                    setExistingImage(firstProd.whiteFridayImage || firstProd.image || '');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة منتج من الكتالوج</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whiteFridayProducts.map((prod) => {
              const origPrice = prod.price || 0;
              const wfPrice = prod.whiteFridayPrice || origPrice;
              const discountPct = origPrice > 0 ? Math.max(0, Math.round(((origPrice - wfPrice) / origPrice) * 100)) : 0;
              const savings = Math.max(0, origPrice - wfPrice);

              return (
                <div 
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/80 p-4 shadow-2xs hover:shadow-md transition-all relative flex flex-col justify-between group"
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {prod.isBundle ? (
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Gift className="w-3 h-3 text-slate-950" />
                        <span>باقة مجمعة ({prod.bundleItems?.length || 2} أصناف)</span>
                      </span>
                    ) : (
                      <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Flame className="w-3 h-3" />
                        <span>{discountPct > 0 ? `خصم ${discountPct}%` : 'عرض خاص'}</span>
                      </span>
                    )}

                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {prod.whiteFridayBadge || (prod.isBundle ? 'باقة مجمعة 🎁' : 'الجمعة البيضاء')}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-150 shrink-0">
                      <img 
                        src={prod.whiteFridayImage || prod.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600'} 
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        الحجم: {prod.volume || 'غير محدد'} | كود: <span className="font-mono text-slate-700 font-bold">{prod.code || 'GC'}</span>
                      </p>

                      {/* Pricing Comparison */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-black text-amber-600 font-mono">
                          {wfPrice} ج.م
                        </span>
                        {origPrice > wfPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {origPrice} ج.م
                          </span>
                        )}
                        {savings > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            توفير {savings} ج.م
                          </span>
                        )}
                      </div>

                      {/* Bundle Items Breakdown (if combo bundle) */}
                      {prod.isBundle && prod.bundleItems && prod.bundleItems.length > 0 && (
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs">
                          <span className="text-[10px] font-black text-amber-950 block mb-1">🎁 محتويات الباقة:</span>
                          <div className="space-y-0.5">
                            {prod.bundleItems.map((bi, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                                <span className="line-clamp-1">• {bi.quantity}× {bi.productName}</span>
                                <span className="font-mono text-[10px] text-slate-500 shrink-0 mr-1">{bi.price * bi.quantity} ج.م</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tiered pricing tag (if regular tiered product) */}
                      {prod.tieredPricing && prod.tieredPricing.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span>📦</span>
                            <span>{prod.tieredPricing.length} عروض كميات وباقات</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (prod.isBundle) {
                          handleOpenEditCombo(prod);
                        } else {
                          setEditingItem(prod);
                          setEditPrice(prod.whiteFridayPrice || prod.price);
                          setEditBadge(prod.whiteFridayBadge || 'عرض الجمعة البيضاء 🔥');
                          setEditImage(prod.whiteFridayImage || prod.image || '');
                          setEditTiers(prod.tieredPricing || []);
                        }
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{prod.isBundle ? 'تعديل الباقة المجمعة' : 'تعديل العرض والصورة'}</span>
                    </button>

                    <button
                      onClick={() => setProductToRemove(prod)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title={prod.isBundle ? 'حذف الباقة المجمعة' : 'إزالة من عروض الجمعة البيضاء'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{prod.isBundle ? 'حذف الباقة' : 'إلغاء من العرض'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================= */}

      {/* MODAL 1: ADD EXISTING PRODUCT */}
      {isAddExistingOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Sticky Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-150 bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Flame className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      إضافة منتج من الكتالوج لقسم الجمعة البيضاء
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 hidden sm:inline-block">
                      White Friday
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    اختر منتجاً موجوداً وحدد سعره المخفض وعروض الكميات الترويجية الخاصة به.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsAddExistingOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {nonWhiteFridayProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                جميع المنتجات الحالية في الكتالوج مضافة بالفعل لقسم الجمعة البيضاء!
              </div>
            ) : (
              <>
                {/* Scrollable Form Content */}
                <form 
                  id="add-existing-wf-form" 
                  onSubmit={handleEnrollExistingProduct} 
                  className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar overscroll-contain"
                >
                  {/* Select Product Card */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
                    <label className="block text-xs font-bold text-slate-800">
                      اختر المنتج من قائمة الكتالوج *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedProductId(id);
                        const p = products.find(prod => prod.id === id);
                        if (p) {
                          setExistingWhiteFridayPrice(Math.round(p.price * 0.7));
                          setExistingImage(p.whiteFridayImage || p.image || '');
                          setExistingTiers(p.tieredPricing || []);
                        }
                      }}
                      className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      required
                    >
                      {nonWhiteFridayProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — السعر الحالي: {p.price} ج.م ({p.volume || 'بدون حجم'})
                        </option>
                      ))}
                    </select>

                    {currentSelectedProduct && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <img 
                            src={currentSelectedProduct.image} 
                            alt="" 
                            className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-150 shrink-0 p-1" 
                          />
                          <div className="text-xs">
                            <p className="font-extrabold text-slate-900">{currentSelectedProduct.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              الحجم: {currentSelectedProduct.volume || 'الافتراضي'} • كود: <span className="font-mono text-slate-700 font-bold">{currentSelectedProduct.code || 'GC'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-left bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">السعر الأساسي:</span>
                          <strong className="text-xs font-black text-slate-800 font-mono">{currentSelectedProduct.price} ج.م</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Badge Card */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        سعر الجمعة البيضاء وشارة العرض
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          سعر عرض الجمعة البيضاء المخفض (ج.م) *
                        </label>
                        <div className="relative">
                          <input 
                            type="number"
                            min="1"
                            step="1"
                            value={existingWhiteFridayPrice || ''}
                            onChange={(e) => setExistingWhiteFridayPrice(Number(e.target.value))}
                            placeholder="مثال: 65"
                            className="w-full text-sm font-black font-mono px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-amber-950 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                            required
                          />
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700 pointer-events-none">
                            ج.م
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          شارة العرض الترويجية (Badge)
                        </label>
                        <input 
                          type="text"
                          value={existingBadge}
                          onChange={(e) => setExistingBadge(e.target.value)}
                          placeholder="مثال: خصم 35% 🔥"
                          className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Quick Badge Suggestions */}
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1.5">شارات جاهزة سريعة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['خصم 50% 🔥', 'خصم 40% 🔥', 'عرض حصري ⭐', 'الأكثر طلباً 👑', 'صفقة الجمعة البيضاء'].map(badge => (
                          <button
                            type="button"
                            key={badge}
                            onClick={() => setExistingBadge(badge)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                              existingBadge === badge 
                                ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs' 
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {badge}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculation preview */}
                    {currentSelectedProduct && existingWhiteFridayPrice > 0 && (
                      <div className="p-3 bg-white border border-amber-200/90 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-800 font-black block">معاينة الخصم:</span>
                          <span className="text-[11px] text-emerald-700 font-bold">
                            الزبون سيوفر {Math.max(0, currentSelectedProduct.price - existingWhiteFridayPrice)} جنيه
                          </span>
                        </div>
                        <span className="text-sm font-black text-amber-700 font-mono bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                          خصم {Math.max(0, Math.round(((currentSelectedProduct.price - existingWhiteFridayPrice) / currentSelectedProduct.price) * 100))}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Custom White Friday Offer Image */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
                    <ImageUploadField
                      label="صورة مخصصة لعرض الجمعة البيضاء (اختياري)"
                      value={existingImage}
                      onChange={setExistingImage}
                      originalValue={currentSelectedProduct?.image}
                      onResetToOriginal={() => currentSelectedProduct && setExistingImage(currentSelectedProduct.image)}
                      helpText="يمكنك ترك الصورة الحالية للمنتج أو رفع صورة ترويجية مخصصة لهذا العرض."
                    />
                  </div>

                  {/* Tiered / Volume Pricing Manager */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5">
                    <TieredPricingManager
                      basePrice={existingWhiteFridayPrice || currentSelectedProduct?.price || 0}
                      tiers={existingTiers}
                      onChange={setExistingTiers}
                    />
                  </div>
                </form>

                {/* Sticky Modal Footer */}
                <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span>السعر المخفض: <strong className="text-slate-900 font-mono">{existingWhiteFridayPrice || 0} ج.م</strong></span>
                    <span>•</span>
                    <span>عروض الكميات: <strong className="text-amber-800">{existingTiers.length} باقة</strong></span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsAddExistingOpen(false)}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      form="add-existing-wf-form"
                      disabled={isAddingExisting}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                      {isAddingExisting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>جاري الإضافة...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>تأكيد الإضافة للجمعة البيضاء</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE BRAND-NEW WHITE FRIDAY PRODUCT */}
      {isCreateNewOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Sticky Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-150 bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      إنشاء منتج جديد خاص بالجمعة البيضاء
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 hidden sm:inline-block">
                      منتج حصري
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    أضف منتجاً جديداً بخصم حصري لموسم الجمعة البيضاء مع عروض كميات وصور عالية الجودة.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsCreateNewOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form 
              id="create-new-wf-form" 
              onSubmit={handleCreateNewProduct} 
              className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar overscroll-contain"
            >
              {/* Product General Info Card */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المنتج *
                  </label>
                  <input 
                    type="text"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: مسحوق غسيل جولد كلين فائق التركيز 5 لتر"
                    className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      القسم / الفئة
                    </label>
                    <select
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.key} value={c.key}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      حجم العبوة
                    </label>
                    <input 
                      type="text"
                      value={newProductForm.volume}
                      onChange={(e) => setNewProductForm(prev => ({ ...prev, volume: e.target.value }))}
                      placeholder="مثال: 1 لتر / 5 لتر"
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      السعر الأصلي (قبل الخصم)
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={newProductForm.regularPrice}
                      onChange={(e) => setNewProductForm(prev => ({ ...prev, regularPrice: Number(e.target.value) }))}
                      className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      سعر الجمعة البيضاء المخفض *
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={newProductForm.whiteFridayPrice}
                      onChange={(e) => setNewProductForm(prev => ({ ...prev, whiteFridayPrice: Number(e.target.value) }))}
                      className="w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-amber-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شارة المنتج الترويجية (Badge)
                  </label>
                  <input 
                    type="text"
                    value={newProductForm.badge}
                    onChange={(e) => setNewProductForm(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="مثال: خصم 45% 🔥"
                    className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Image Upload Card */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
                <ImageUploadField
                  label="صورة المنتج / العرض"
                  value={newProductForm.image}
                  onChange={(val) => setNewProductForm(prev => ({ ...prev, image: val }))}
                  placeholder="https://..."
                  helpText="ارفع صورة عالية الجودة من جهازك (JPG/PNG/WebP) أو ضع رابط صورة مباشر."
                  maxWidth={800}
                  maxHeight={800}
                  quality={0.7}
                />
              </div>

              {/* Description Card */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وصف المنتج
                </label>
                <textarea 
                  rows={2}
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مميزات المنتج وجودته العالية..."
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                />
              </div>

              {/* Volume / Tiered Pricing Offers */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5">
                <TieredPricingManager
                  basePrice={newProductForm.whiteFridayPrice || 0}
                  tiers={newProductForm.tieredPricing}
                  onChange={(t) => setNewProductForm(prev => ({ ...prev, tieredPricing: t }))}
                />
              </div>
            </form>

            {/* Sticky Modal Footer */}
            <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>سعر العرض: <strong className="text-slate-900 font-mono">{newProductForm.whiteFridayPrice || 0} ج.م</strong></span>
                <span>•</span>
                <span>عروض الكميات: <strong className="text-amber-800">{newProductForm.tieredPricing?.length || 0} باقة</strong></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsCreateNewOpen(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="create-new-wf-form"
                  disabled={isCreatingNew}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isCreatingNew ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>إنشاء وحفظ في عروض الجمعة البيضاء</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: EDIT WHITE FRIDAY PRICE / BADGE / IMAGE / TIERS */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* 1. STICKY MODAL HEADER */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-150 bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Flame className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      عروض الجمعة البيضاء | تعديل العرض والأسعار
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 hidden sm:inline-block">
                      White Friday
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    إدارة سعر التخفيض، شارات الترويج، صورة العرض، وباقات الكميات المخصصة للمنتج.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setEditingItem(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. SCROLLABLE FORM CONTENT */}
            <form 
              id="edit-white-friday-form" 
              onSubmit={handleSaveEditProduct} 
              className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar overscroll-contain"
            >
              {/* Product Identity Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl p-4 border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                    <img 
                      src={editImage || editingItem.whiteFridayImage || editingItem.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600'} 
                      alt="" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md inline-block mb-1 border border-amber-400/20">
                      المنتج المستهدف
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white line-clamp-1">
                      {editingItem.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      الحجم: <span className="text-slate-300 font-bold">{editingItem.volume || '1 لتر'}</span> • كود: <span className="font-mono text-slate-300 font-bold">{editingItem.code || 'WF'}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl px-3.5 py-2 border border-white/10 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="text-[10px] text-slate-300 font-medium">السعر الأصلي في المتجر:</span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {editingItem.price} ج.م
                  </span>
                </div>
              </div>

              {/* CARD 1: Base Discount Pricing & Badge */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    السعر الأساسي المخفض وشارة العرض
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      سعر عرض الجمعة البيضاء المخفض (ج.م) *
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        value={editPrice || ''}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        placeholder="مثال: 65"
                        className="w-full text-sm font-black font-mono px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-amber-950 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        required
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700 pointer-events-none">
                        ج.م
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      شارة العرض الترويجية (Badge)
                    </label>
                    <input 
                      type="text"
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      placeholder="مثال: خصم 35% 🔥"
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Quick Badge Chips */}
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block mb-1.5">
                    شارات جاهزة سريعة بضغطة زر:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['خصم 50% 🔥', 'خصم 40% 🔥', 'عرض حصري ⭐', 'الأكثر طلباً 👑', 'صفقة الجمعة البيضاء'].map(badge => (
                      <button
                        type="button"
                        key={badge}
                        onClick={() => setEditBadge(badge)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                          editBadge === badge 
                            ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Discount Calculation Preview */}
                {editPrice > 0 && (
                  <div className="p-3 bg-white border border-amber-200/90 rounded-xl shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-800 font-black block">معاينة التوفير الفعلي للزبون:</span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        العميل سيوفر {Math.max(0, editingItem.price - editPrice)} ج.م (من {editingItem.price} ج.م إلى {editPrice} ج.م)
                      </span>
                    </div>
                    <span className="text-sm font-black text-amber-700 font-mono bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                      خصم {Math.max(0, Math.round(((editingItem.price - editPrice) / editingItem.price) * 100))}%
                    </span>
                  </div>
                )}
              </div>

              {/* CARD 2: Promotional Offer Image */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
                <ImageUploadField
                  label="صورة العرض الترويجية في الجمعة البيضاء"
                  value={editImage}
                  onChange={setEditImage}
                  originalValue={editingItem.originalImage || editingItem.image}
                  onResetToOriginal={() => setEditImage(editingItem.originalImage || editingItem.image)}
                  helpText="ارفع بوستر ترويجي أو صورة خاصة بالجمعة البيضاء لتظهر على هذا المنتج في موسم العروض."
                />
              </div>

              {/* CARD 3: Tiered Quantity Offers */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5">
                <TieredPricingManager
                  basePrice={editPrice || editingItem.price || 0}
                  tiers={editTiers}
                  onChange={setEditTiers}
                />
              </div>
            </form>

            {/* 3. STICKY MODAL FOOTER */}
            <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>السعر الأساسي: <strong className="text-slate-900 font-mono">{editPrice || 0} ج.م</strong></span>
                <span>•</span>
                <span>عروض الكميات: <strong className="text-amber-800">{editTiers.length} باقة</strong></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="edit-white-friday-form"
                  disabled={isSavingEdit}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>حفظ التعديلات والتسعير</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM REMOVE */}
      {productToRemove && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">
              {productToRemove.isBundle ? 'حذف الباقة المجمعة نهائياً؟' : 'إلغاء المنتج من عروض الجمعة البيضاء؟'}
            </h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {productToRemove.isBundle ? (
                <>سيتم حذف الباقة المجمعة <strong className="text-slate-800">{productToRemove.name}</strong> نهائياً من العروض والمتجر.</>
              ) : (
                <>سيتم إزالة <strong className="text-slate-800">{productToRemove.name}</strong> من قسم الجمعة البيضاء ويعود لسعره الطبيعي السابق ({productToRemove.price} ج.م) في المتجر.</>
              )}
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setProductToRemove(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isRemoving ? 'جاري الإزالة...' : (productToRemove.isBundle ? 'تأكيد الحذف' : 'تأكيد الإزالة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CREATE / EDIT COMBO BUNDLE (MULTI-PRODUCT) */}
      {isComboModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden" dir="rtl">
          <div className="bg-white rounded-3xl max-w-3xl lg:max-w-4xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* 1. Sticky Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-150 bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Gift className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      {editingComboId ? 'تعديل الباقة المجمعة للجمعة البيضاء' : 'إنشاء باقة مجمعة جديدة (منتجين مختلفين أو أكثر)'}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      باقة مجمعة 🎁
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                    اجمع منتجين أو أكثر في باقة واحدة، مع تحديد سعر الباقة المخفض ورفع صورة ترويجية مخصصة.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { setIsComboModalOpen(false); setEditingComboId(null); }}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <form 
              id="combo-bundle-form" 
              onSubmit={handleSaveComboBundle}
              className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar overscroll-contain"
            >
              {/* CARD 1: Select & Add Products to Bundle */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Boxes className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        1. اختيار المنتجات المكوّنة للباقة
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">
                        اختر أي منتج من كتالوج المتجر وحدد الكمية المطلوبة منه واضغط &quot;إضافة للباقة&quot;
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
                    {comboForm.items.length} أصناف مضافة
                  </span>
                </div>

                {/* Add Product Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      اختر المنتج من الكتالوج:
                    </label>
                    <select
                      value={comboSelectedProdId}
                      onChange={(e) => setComboSelectedProdId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    >
                      {regularCatalogProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ({p.volume || 'بدون حجم'}) — {p.price} ج.م
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      الكمية بالباقة:
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={comboSelectedProdQty}
                      onChange={(e) => setComboSelectedProdQty(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-black font-mono text-center px-2 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddProductToCombo}
                      className="w-full bg-slate-900 hover:bg-amber-600 text-white font-black text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة للباقة</span>
                    </button>
                  </div>
                </div>

                {/* Products List Inside Bundle */}
                {comboForm.items.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">لم تضف منتجات إلى هذه الباقة حتى الآن</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">اختر منتجين أو أكثر من القائمة بالأعلى واضغط &quot;إضافة للباقة&quot;.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">المنتجات الموجودة في الباقة:</span>
                    <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                      {comboForm.items.map((item) => (
                        <div key={item.productId} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-150 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                              <img 
                                src={item.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=200'} 
                                alt="" 
                                className="w-full h-full object-contain" 
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-xs text-slate-900 truncate">{item.productName}</h5>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                الحجم: {item.volume || '1 لتر'} • السعر الفردي: <span className="font-mono text-slate-700 font-bold">{item.price} ج.م</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateComboItemQty(item.productId, -1)}
                                className="px-2 py-1 text-xs hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="إنقاص"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 py-1 text-xs font-black font-mono text-slate-900 bg-white min-w-[28px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateComboItemQty(item.productId, 1)}
                                className="px-2 py-1 text-xs hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="زيادة"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Total for this product */}
                            <div className="text-left min-w-[65px]">
                              <span className="text-[10px] text-slate-400 block">الإجمالي:</span>
                              <span className="text-xs font-black text-slate-800 font-mono">
                                {item.price * item.quantity} ج.م
                              </span>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveComboItem(item.productId)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف هذا الصنف من الباقة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: Bundle Pricing & Discount Calculation */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    2. تسعير الباقة وعرض الخصم
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">
                      إجمالي السعر الأصلي للمنتجات:
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {comboOriginalPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-500">ج.م</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      (محسوب تلقائياً من أسعار المنتجات المضافة × كمياتها)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      سعر بيع الباقة في الجمعة البيضاء (ج.م) *
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        value={comboForm.offerPrice || ''}
                        onChange={(e) => setComboForm(prev => ({ ...prev, offerPrice: Number(e.target.value) }))}
                        placeholder="مثال: 180"
                        className="w-full text-sm font-black font-mono px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-amber-950 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        required
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700 pointer-events-none">
                        ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Savings calculation preview */}
                {comboOriginalPrice > 0 && comboForm.offerPrice > 0 && (
                  <div className="p-3.5 bg-white border border-amber-200/90 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-800 font-black block">معاينة توفير العميل في هذه الباقة:</span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        الزبون سيوفر {comboSavings} جنيه (من {comboOriginalPrice} ج.م إلى {comboForm.offerPrice} ج.م)
                      </span>
                    </div>
                    <span className="text-sm font-black text-amber-700 font-mono bg-amber-50 px-3.5 py-1 rounded-lg border border-amber-200 self-start sm:self-auto">
                      خصم {comboDiscountPct}% 🔥
                    </span>
                  </div>
                )}
              </div>

              {/* CARD 3: Bundle Info (Title, Category, Badge, Description) */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    3. بيانات وشارة الباقة الترويجية
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      عنوان / اسم الباقة المجمعة *
                    </label>
                    <input 
                      type="text"
                      value={comboForm.title}
                      onChange={(e) => setComboForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: باقة النظافة الشاملة: مسحوق غسيل + معطر ملابس"
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      القسم / الفئة
                    </label>
                    <select
                      value={comboForm.category}
                      onChange={(e) => setComboForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.key} value={c.key}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      شارة العرض الترويجية (Badge)
                    </label>
                    <input 
                      type="text"
                      value={comboForm.badge}
                      onChange={(e) => setComboForm(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="مثال: باقة مجمعة 🎁"
                      className="w-full text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Quick Badge Suggestions */}
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block mb-1.5">شارات جاهزة للباقات:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['باقة مجمعة 🎁', 'عرض التوفير الخارق 🔥', 'باقة الجمعة البيضاء ⭐', 'اشتري قطعتين ووفر 👑', 'صفقة الموسم ⚡'].map(badge => (
                      <button
                        type="button"
                        key={badge}
                        onClick={() => setComboForm(prev => ({ ...prev, badge }))}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                          comboForm.badge === badge 
                            ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    وصف الباقة (اختياري)
                  </label>
                  <textarea 
                    rows={2}
                    value={comboForm.description}
                    onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="اكتب وصفاً جذاباً لمكونات وجودة الباقة..."
                    className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* CARD 4: Bundle Promotional Image */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
                <ImageUploadField
                  label="صورة الباقة المجمعة (صورة مجمعة تظهر المنتجات معاً)"
                  value={comboForm.image}
                  onChange={(val) => setComboForm(prev => ({ ...prev, image: val }))}
                  originalValue={comboForm.items[0]?.image}
                  onResetToOriginal={() => comboForm.items[0]?.image && setComboForm(prev => ({ ...prev, image: comboForm.items[0].image || '' }))}
                  helpText="ارفع صورة عالية الجودة تجمع المنتجات في لقطة واحدة لتبدو الباقة احترافية وجذابة للزبائن."
                />
              </div>
            </form>

            {/* 3. Sticky Modal Footer */}
            <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>المكونات: <strong className="text-slate-900 font-mono">{comboForm.items.length} أصناف</strong></span>
                <span>•</span>
                <span>السعر الأصلي: <strong className="text-slate-700 font-mono">{comboOriginalPrice} ج.م</strong></span>
                <span>•</span>
                <span>سعر العرض: <strong className="text-amber-800 font-mono">{comboForm.offerPrice || 0} ج.م</strong></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setIsComboModalOpen(false); setEditingComboId(null); }}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="combo-bundle-form"
                  disabled={isSavingCombo}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isSavingCombo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري حفظ الباقة...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>{editingComboId ? 'حفظ تعديلات الباقة' : 'حفظ الباقة في عروض الجمعة البيضاء'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
