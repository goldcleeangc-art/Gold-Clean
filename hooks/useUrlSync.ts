import { useEffect, useRef } from 'react';
import { Product } from '../lib/types/store';

type TabType = 'home' | 'products' | 'offers' | 'about' | 'complaints';

interface UrlSyncProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  products: Product[];
  selectedProductDetails: Product | null;
  setSelectedProductDetails: (prod: Product | null) => void;
  isProductDetailsOpen: boolean;
  setIsProductDetailsOpen: (open: boolean) => void;
}

export function useUrlSync({
  currentTab,
  setCurrentTab,
  activeCategory,
  setActiveCategory,
  products,
  selectedProductDetails,
  setSelectedProductDetails,
  isProductDetailsOpen,
  setIsProductDetailsOpen
}: UrlSyncProps) {
  const isInitialMount = useRef(true);

  // 1. قراءة التبويب والقسم من الرابط عند فتح الصفحة أول مرة
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const category = params.get('category');
    const productId = params.get('product');

    if (productId) {
      setCurrentTab('products');
    } else if (tab === 'products' || tab === 'offers' || tab === 'about' || tab === 'complaints') {
      setCurrentTab(tab);
    }

    if (category) setActiveCategory(category);
  }, []);

  // 2. تحديث الرابط عند تغير الـ State بعد التحميل الأولي
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const url = new URL(window.location.href);
    let changed = false;

    if (currentTab === 'home') {
      if (url.searchParams.has('tab')) { url.searchParams.delete('tab'); changed = true; }
    } else if (url.searchParams.get('tab') !== currentTab) {
      url.searchParams.set('tab', currentTab); changed = true;
    }

    if (currentTab === 'products' && activeCategory !== 'all') {
      if (url.searchParams.get('category') !== activeCategory) {
        url.searchParams.set('category', activeCategory); changed = true;
      }
    } else if (url.searchParams.has('category')) {
      url.searchParams.delete('category'); changed = true;
    }

    if (isProductDetailsOpen && selectedProductDetails) {
      if (url.searchParams.get('product') !== selectedProductDetails.id) {
        url.searchParams.set('product', selectedProductDetails.id); changed = true;
      }
    } else if (selectedProductDetails && url.searchParams.has('product')) {
      url.searchParams.delete('product'); changed = true;
    }

    if (changed) {
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentTab, activeCategory, isProductDetailsOpen, selectedProductDetails]);

  // 3. فتح نافذة المنتج إذا كان موجوداً في الرابط بمجرد تحميل المنتجات
  useEffect(() => {
    if (typeof window !== 'undefined' && products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('product');
      if (productId && !isProductDetailsOpen) {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          setCurrentTab('products');
          setSelectedProductDetails(prod);
          setIsProductDetailsOpen(true);
        }
      }
    }
  }, [products]);
}