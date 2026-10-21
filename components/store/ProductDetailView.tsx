'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ShoppingCart, 
  Share2, 
  Check, 
  Star, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  MessageCircle, 
  Plus, 
  Minus, 
  Copy, 
  Home, 
  ShoppingBag, 
  ChevronLeft 
} from 'lucide-react';
import { Product, CartItem } from '../../lib/types/store';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProductDetailViewProps {
  product: Product;
  categoryName: string;
  relatedProducts: Product[];
}

export default function ProductDetailView({
  product,
  categoryName,
  relatedProducts
}: ProductDetailViewProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const [cartCount, setCartCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);

  // Read current cart count from localStorage
  useEffect(() => {
    const updateCountFromStorage = () => {
      try {
        const raw = localStorage.getItem('clean_minimal_cart');
        if (raw) {
          const items: CartItem[] = JSON.parse(raw);
          const total = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        console.error('Error reading cart:', e);
      }
    };

    updateCountFromStorage();
    window.addEventListener('storage', updateCountFromStorage);
    return () => window.removeEventListener('storage', updateCountFromStorage);
  }, []);

  // Determine user rating if already given
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raterId = auth.currentUser?.uid || localStorage.getItem('goldclean_device_id');
    if (raterId && currentProduct.ratingsMap && currentProduct.ratingsMap[raterId]) {
      setUserRating(currentProduct.ratingsMap[raterId]);
    }
  }, [currentProduct]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!currentProduct.isAvailable) return;

    try {
      const raw = localStorage.getItem('clean_minimal_cart');
      const items: CartItem[] = raw ? JSON.parse(raw) : [];

      const existingIndex = items.findIndex(item => item.product.id === currentProduct.id);
      if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({
          product: currentProduct,
          quantity: quantity
        });
      }

      localStorage.setItem('clean_minimal_cart', JSON.stringify(items));
      const newTotal = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
      setCartCount(newTotal);

      // Meta Pixel Track AddToCart
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_name: currentProduct.name,
          content_ids: [currentProduct.id],
          content_type: 'product',
          value: currentProduct.price * quantity,
          currency: 'EGP'
        });
      }

      showToast(`تمت إضافة ${quantity} من "${currentProduct.name}" إلى سلة التسوق`);
    } catch (e) {
      console.error('Error adding to cart:', e);
      showToast('حدث خطأ أثناء إضافة المنتج للسلة.');
    }
  };

  // Direct WhatsApp Quick Order
  const handleWhatsAppOrder = () => {
    const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '201000000000';
    const totalOrderPrice = (currentProduct.price * quantity).toFixed(2);
    const codeSnippet = currentProduct.code ? ` (كود: ${currentProduct.code})` : '';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const message = `مرحباً متجر Gold Clean، أود طلب المنتج التالي:\n- المنتج: ${currentProduct.name}${codeSnippet}\n- الحجم: ${currentProduct.volume || 'الافتراضي'}\n- الكمية: ${quantity}\n- السعر الإجمالي: ${totalOrderPrice} جنيه\n- الرابط: ${currentUrl}\n\nيرجى تزويدي بتفاصيل التوصيل وتأكيد الطلب.`;
    
    const url = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Share / Copy Link
  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentProduct.name,
          text: `اكتشف ${currentProduct.name} من متجر Gold Clean:`,
          url: currentUrl
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      showToast('تم نسخ رابط المنتج إلى الحافظة بنجاح!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Interactive Product Rating
  const handleRate = async (star: number) => {
    if (isRatingSubmitting) return;
    setIsRatingSubmitting(true);

    try {
      let raterId = auth.currentUser?.uid;
      if (!raterId) {
        raterId = localStorage.getItem('goldclean_device_id') || '';
        if (!raterId) {
          raterId = 'dev_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('goldclean_device_id', raterId);
        }
      }

      const newMap = { ...(currentProduct.ratingsMap || {}) };
      newMap[raterId] = star;

      const values = Object.values(newMap);
      const newCount = values.length;
      const newAverage = values.reduce((a, b) => a + b, 0) / newCount;
      const finalRating = Number(newAverage.toFixed(1));

      const productRef = doc(db, 'products', currentProduct.id);
      await updateDoc(productRef, {
        ratingsMap: newMap,
        rating: finalRating,
        reviewsCount: newCount
      });

      setCurrentProduct(prev => ({
        ...prev,
        ratingsMap: newMap,
        rating: finalRating,
        reviewsCount: newCount
      }));
      setUserRating(star);
      showToast('شكراً لك! تم تسجيل تقييمك للمنتج.');
    } catch (e) {
      console.error('Rating error:', e);
      showToast('تعذر حفظ التقييم حالياً، يرجى المحاولة لاحقاً.');
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border border-slate-700/50"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 -mr-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="العودة للمتجر الرئيسي"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">العودة للمتجر</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-amber-600 transition-colors">
                Gold Clean
              </span>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60 shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="مشاركة المنتج"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden md:inline">{copiedLink ? 'تم النسخ' : 'مشاركة'}</span>
            </button>

            <Link
              href="/?tab=cart"
              className="relative p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-102"
              title="سلة التسوق"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/?tab=products" className="hover:text-blue-600 transition-colors font-medium">
            المنتجات
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-600 font-medium">{categoryName}</span>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold truncate max-w-[200px]">{currentProduct.name}</span>
        </nav>

        {/* Product Showcase Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Visual Column */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-6 md:p-10 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-l border-slate-200/80">
              
              {/* Badges on Top */}
              <div className="w-full flex items-center justify-between mb-4">
                {currentProduct.isAvailable ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    متوفر في المخزن
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                    نفذت الكمية حالياً
                  </span>
                )}

                {currentProduct.volume && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-xs text-white shadow-2xs">
                    الحجم: {currentProduct.volume}
                  </span>
                )}
              </div>

              {/* Main Product Image */}
              <div className="w-full max-w-sm aspect-square relative flex items-center justify-center p-4">
                <img
                  src={currentProduct.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=1000'}
                  alt={currentProduct.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-lg transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* SKU code tag */}
              {currentProduct.code && (
                <div className="mt-4 text-[11px] font-mono text-slate-400 bg-white px-3 py-1 rounded-md border border-slate-200">
                  كود المنتج: <strong className="text-slate-700">{currentProduct.code}</strong>
                </div>
              )}
            </div>

            {/* Details & Actions Column */}
            <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-between">
              <div>
                
                {/* Category & Rating */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                    {categoryName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-800">
                      {currentProduct.rating ? currentProduct.rating.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({currentProduct.reviewsCount || Object.keys(currentProduct.ratingsMap || {}).length || 0} تقييم)
                    </span>
                  </div>
                </div>

                {/* Main Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-4 leading-tight">
                  {currentProduct.name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-slate-100">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600">
                    {currentProduct.price.toFixed(2)}
                  </span>
                  <span className="text-base font-bold text-slate-500">
                    جنيه مصري
                  </span>
                  <span className="text-xs text-slate-400 mr-2">
                    (شامل ضريبة القيمة المضافة)
                  </span>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-800 mb-2.5">
                    وصف المنتج ومميزاته:
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    {currentProduct.description}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-bold text-slate-700">الكمية المطلوبة:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1 || !currentProduct.isAvailable}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center font-bold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(50, prev + 1))}
                      disabled={!currentProduct.isAvailable}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    الإجمالي: <strong className="text-blue-600 font-bold">{(currentProduct.price * quantity).toFixed(2)}</strong> جنيه
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-8">
                  
                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!currentProduct.isAvailable}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer outline-none focus:ring-4 focus:ring-blue-100
                      ${!currentProduct.isAvailable 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99]'}`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{!currentProduct.isAvailable ? 'المنتج غير متوفر حالياً' : 'إضافة إلى سلة المشتريات'}</span>
                  </button>

                  {/* Direct WhatsApp Order */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="py-4 px-6 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 cursor-pointer"
                    title="طلب سريع ومباشر عبر واتساب"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>طلب سريع عبر واتساب</span>
                  </button>
                </div>

                {/* Value Props / Guarantee */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">شحن سريع لباب البيت</div>
                      <div className="text-[10px] text-slate-400">توصيل لكافة المحافظات عبر بوسطة</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">جودة مصنعية أصلية</div>
                      <div className="text-[10px] text-slate-400">تركيز عالي وضمان رضا 100%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">دفع عند الاستلام</div>
                      <div className="text-[10px] text-slate-400">معاينة الشحنة قبل الاستلام</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Customer Rating Section */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                ما رأيك بجودة هذا المنتج؟
              </h3>
              <p className="text-xs text-slate-500">
                شاركنا تجربتك وتقييمك لمساعدة العملاء الآخرين في اختيار أفضل منظف.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={isRatingSubmitting}
                  className="p-1 hover:scale-120 transition-transform focus:outline-none cursor-pointer disabled:opacity-50"
                  title={`تقييم ${star} من 5 نجوم`}
                >
                  <Star 
                    className={`w-7 h-7 transition-colors ${
                      star <= userRating 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-200 hover:text-amber-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>
          {userRating > 0 && (
            <p className="text-xs text-emerald-600 font-bold mt-3 text-center sm:text-right">
              ✓ تم تسجيل تقييمك ({userRating} من 5). شكراً لمشاركتنا رأيك!
            </p>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                  منتجات مميزة من نفس الفئة
                </h2>
                <p className="text-xs text-slate-500">
                  المزيد من منظفات {categoryName} عالية التركيز
                </p>
              </div>

              <Link
                href="/?tab=products"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/products/${rel.id}`}
                  className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 bg-slate-50 rounded-xl mb-3 flex items-center justify-center p-2 relative overflow-hidden">
                      <img
                        src={rel.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=400'}
                        alt={rel.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {rel.volume && (
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          {rel.volume}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {rel.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {rel.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-blue-600">
                      {rel.price.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">جنيه</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                      التفاصيل ←
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Bottom Sticky Action Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center gap-3 md:hidden z-40 shadow-lg">
        <div className="text-right">
          <div className="text-[10px] text-slate-400">السعر النهائي:</div>
          <div className="text-base font-black text-blue-600 leading-none">
            {(currentProduct.price * quantity).toFixed(2)} <span className="text-[10px] font-normal">جنيه</span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!currentProduct.isAvailable}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>أضف للسلة</span>
        </button>

        <button
          onClick={handleWhatsAppOrder}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center justify-center"
          title="طلب عبر واتساب"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
