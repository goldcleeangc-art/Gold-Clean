'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types & Helpers
import { 
  Category, 
  Product, 
  Offer, 
  OfferItem, 
  Order, 
  ShippingInfo, 
  ADMIN_EMAILS, 
  isUserMasterAdmin, 
  formatOrderDate, 
  getOrderDateObj 
} from '@/lib/types/store';

// Firebase & Auth
import { db, auth, googleProvider } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Shipping utilities
import {
  cleanProductNameForWorkers,
  sanitizeEgyptianPhone
} from '@/lib/shipping';

// Admin Components & Modals
import MerchantPortal from '@/components/admin/MerchantPortal';
import { StatsMetrics } from '@/components/admin/AdminStatsTab';
import DeleteOrdersModal from '@/components/admin/DeleteOrdersModal';
import FailedSyncModal from '@/components/admin/FailedSyncModal';
import PackingSlipModal from '@/components/admin/PackingSlipModal';

export default function AdminPage() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'user' | 'manager' | 'admin'>('user');
  const [isMerchantAuthenticated, setIsMerchantAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Navigation Tab
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'offers' | 'categories' | 'stats' | 'complaints' | 'users'>('orders');
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState<number>(0);

  // Data Collections
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Orders Filters & Search
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'bosta_unsynced' | 'bosta_synced'>('all');
  const [adminOrderSearch, setAdminOrderSearch] = useState<string>('');
  const [orderDatePreset, setOrderDatePreset] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom'>('all');
  const [orderStartDate, setOrderStartDate] = useState<string>('');
  const [orderEndDate, setOrderEndDate] = useState<string>('');
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const [ordersPerPage, setOrdersPerPage] = useState<number>(10);

  // Bulk Operations State
  const [isBulkPreparing, setIsBulkPreparing] = useState<boolean>(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState<boolean>(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [isResendingPageOrders, setIsResendingPageOrders] = useState<boolean>(false);
  const [resendPageProgress, setResendPageProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedBillCode, setCopiedBillCode] = useState<string | null>(null);

  // Modals State
  const [failedSyncOrders, setFailedSyncOrders] = useState<Array<{
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerCity: string;
    customerAddress: string;
    totalPrice: number;
    error: string;
  }> | null>(null);
  const [isFailedOrdersModalOpen, setIsFailedOrdersModalOpen] = useState<boolean>(false);

  const [isDeleteByDateModalOpen, setIsDeleteByDateModalOpen] = useState<boolean>(false);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState<'exact' | 'before' | 'on_or_before'>('exact');
  const [deleteStatusFilter, setDeleteStatusFilter] = useState<string>('all');
  const [isDeletingOrders, setIsDeletingOrders] = useState<boolean>(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  const [packingSlipOrder, setPackingSlipOrder] = useState<Order | null>(null);
  const [copiedPackingOrderId, setCopiedPackingOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Products Tab State
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
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

  // Offers Tab State
  const [isOfferFormOpen, setIsOfferFormOpen] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [selectedProductForOffer, setSelectedProductForOffer] = useState<string>('');
  const [selectedQuantityForOffer, setSelectedQuantityForOffer] = useState<number>(1);
  const [offerForm, setOfferForm] = useState<{
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
  }>({
    title: '',
    code: '',
    description: '',
    badge: 'عرض توفير مميز',
    image: '',
    isAvailable: true,
    isFreeShipping: false,
    items: [],
    originalPrice: 0,
    offerPrice: 0,
    savings: 0
  });

  // Categories Tab State
  const [categoryForm, setCategoryForm] = useState({ name: '', key: '' });
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Stats Tab State
  const [statsDatePreset, setStatsDatePreset] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'single' | 'custom'>('all');
  const [statsSingleDate, setStatsSingleDate] = useState<string>('');
  const [statsStartDate, setStatsStartDate] = useState<string>('');
  const [statsEndDate, setStatsEndDate] = useState<string>('');
  const [statsStatusMode, setStatsStatusMode] = useState<'valid' | 'all' | 'delivered'>('valid');
  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
  const [statsOrdersCurrentPage, setStatsOrdersCurrentPage] = useState<number>(1);
  const [statsOrdersPerPage, setStatsOrdersPerPage] = useState<number>(10);
  const [statsExpandedOrderId, setStatsExpandedOrderId] = useState<string | null>(null);

  // Google Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const isAdminEmail = isUserMasterAdmin(currentUser.email);
        
        getDoc(userRef).then((snap) => {
          let finalRole: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
          if (snap.exists()) {
            finalRole = snap.data().role || finalRole;
          }
          if (isAdminEmail) {
            finalRole = 'admin';
          }
          return setDoc(userRef, {
            email: currentUser.email || '',
            name: currentUser.displayName || 'عميل Gold Clean',
            photoURL: currentUser.photoURL || '',
            role: finalRole,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }).catch(err => {
          console.error("Error setting user document:", err);
        });

        const unsubRole = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentFetchedRole = data.role || 'user';
            setUserRole(currentFetchedRole);
            if (currentFetchedRole === 'manager' || currentFetchedRole === 'admin') {
              setIsMerchantAuthenticated(true);
            } else {
              setIsMerchantAuthenticated(false);
            }
          } else {
            const defaultRole: 'admin' | 'user' = isAdminEmail ? 'admin' : 'user';
            setUserRole(defaultRole);
            if (defaultRole === 'admin') {
              setIsMerchantAuthenticated(true);
            }
          }
        }, (error) => {
          const defaultRole: 'admin' | 'user' = isAdminEmail ? 'admin' : 'user';
          setUserRole(defaultRole);
          if (defaultRole === 'admin') {
            setIsMerchantAuthenticated(true);
          }
        });

        setCheckingAuth(false);
        return () => unsubRole();
      } else {
        setUserRole('user');
        setIsMerchantAuthenticated(false);
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      const res = await signInWithPopup(auth, googleProvider);
      const currentUser = res.user;
      const isAdminEmail = isUserMasterAdmin(currentUser.email);
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      let role: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
      if (snap.exists()) {
        role = snap.data().role || role;
      }
      if (isAdminEmail) {
        role = 'admin';
      }
      await setDoc(userRef, {
        email: currentUser.email || '',
        name: currentUser.displayName || 'عميل Gold Clean',
        photoURL: currentUser.photoURL || '',
        role: role,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUserRole(role);
      if (role === 'manager' || role === 'admin') {
        setIsMerchantAuthenticated(true);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(err.message || 'حدث خطأ أثناء تسجيل الدخول بجوجل');
    }
  };

  // Sync Products & Categories & Offers
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubProd = onSnapshot(productsRef, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      setProducts(list);
    });

    const categoriesRef = collection(db, 'categories');
    const unsubCat = onSnapshot(categoriesRef, (snapshot) => {
      const list: Category[] = [];
      const seenKeys = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Category, 'id'>;
        if (!seenKeys.has(data.key)) {
          seenKeys.add(data.key);
          list.push({ id: docSnap.id, ...data });
        }
      });
      setCategories(list);
    });

    const offersRef = collection(db, 'offers');
    const unsubOffers = onSnapshot(offersRef, (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Offer, 'id'>) });
      });
      setOffers(list);
      setOffersLoading(false);
    });

    return () => {
      unsubProd();
      unsubCat();
      unsubOffers();
    };
  }, []);

  // Listen to pending complaints count
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
      const q = query(collection(db, 'complaints'), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snapshot) => {
        setPendingComplaintsCount(snapshot.size);
      }, (err) => {
        console.warn('Error fetching pending complaints count:', err);
      });
      return () => unsub();
    }
  }, [userRole]);

  // Sync Orders when authenticated
  useEffect(() => {
    if (isMerchantAuthenticated) {
      const ordersRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Order, 'id'>)
          });
        });
        list.sort((a, b) => {
          const getMillis = (item: Order) => {
            if (!item.createdAt) return 0;
            if (typeof item.createdAt?.toDate === 'function') return item.createdAt.toDate().getTime();
            if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
            if (item.createdAt?._seconds) return item.createdAt._seconds * 1000;
            const parsed = new Date(item.createdAt).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };
          return getMillis(b) - getMillis(a);
        });
        setAllOrders(list);
      }, (error) => {
        console.error("Error listening to all orders:", error);
        if (error.code === 'permission-denied') {
          setIsMerchantAuthenticated(false);
        }
      });
      return () => unsubscribe();
    }
  }, [isMerchantAuthenticated]);

  // Sync Users when admin
  useEffect(() => {
    if (userRole === 'admin' && isMerchantAuthenticated) {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        setAllUsers(list);
      }, (error) => {
        console.error("Error listening to users:", error);
      });
      return () => unsubscribe();
    }
  }, [userRole, isMerchantAuthenticated]);

  // Bulk Move Pending to Preparing
  const handleBulkMovePendingToPreparing = async () => {
    const pendingOrders = allOrders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) {
      alert('لا توجد أي طلبات معلقة (Pending) حالياً.');
      return;
    }

    if (!confirm(`هل تريد تحويل جميع الطلبات المعلقة (${pendingOrders.length} طلب) إلى حالة "جاري التجهيز 📦"؟`)) return;

    setIsBulkPreparing(true);
    let successCount = 0;
    try {
      for (const order of pendingOrders) {
        if (!order.id) continue;
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'preparing'
        });
        successCount++;
      }
      alert(`🎉 تم بنجاح تحويل (${successCount}) طلب إلى "جاري التجهيز 📦".`);
    } catch (err: any) {
      console.error('Error updating pending orders to preparing:', err);
      alert('حدث خطأ أثناء تحديث حالة الطلبات.');
    } finally {
      setIsBulkPreparing(false);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    if (userRole !== 'admin') {
      alert('صلاحية المدير مطلوبة');
      return;
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      alert(`تم بنجاح تعديل صلاحيات المستخدم ليكون ${newRole === 'manager' ? 'مشرفاً' : 'مستخدماً عادياً'}`);
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء تعديل الصلاحيات');
    }
  };

  // Product CRUD
  const handleGenerateSeo = async () => {
    if (!productForm.name || !productForm.description) {
      alert('يرجى إدخال اسم ووصف المنتج أولاً');
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: productForm.name, description: productForm.description }),
      });
      const rawResponse = await response.text();
      let data: { error?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string } = {};
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        data = { error: rawResponse || 'Failed to generate SEO data' };
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate SEO data');
      }
      setProductForm({
        ...productForm,
        seoTitle: data.seoTitle || productForm.seoTitle,
        seoDescription: data.seoDescription || productForm.seoDescription,
        seoKeywords: data.seoKeywords || productForm.seoKeywords,
      });
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Failed to generate SEO data';
      alert(`حدث خطأ أثناء توليد بيانات SEO: ${message}`);
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        code: productForm.code?.trim() || '',
        price: Number(productForm.price),
        isAvailable: Boolean(productForm.isAvailable),
        rating: editingProduct ? editingProduct.rating : 0,
        reviewsCount: editingProduct ? editingProduct.reviewsCount : 0,
        image: productForm.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'
      };

      if (editingProduct) {
        const ref = doc(db, 'products', editingProduct.id);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
      }

      setIsProductFormOpen(false);
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
        seoKeywords: ''
      });
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء حفظ معلومات المنتج.');
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      code: prod.code || '',
      description: prod.description,
      price: prod.price,
      category: prod.category,
      image: prod.image,
      volume: prod.volume,
      isAvailable: prod.isAvailable,
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      seoKeywords: prod.seoKeywords || ''
    });
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (pId: string) => {
    try {
      await deleteDoc(doc(db, 'products', pId));
    } catch (e) {
      console.error(e);
    }
  };

  // Offer CRUD
  const handleAddProductToOfferDraft = () => {
    if (!selectedProductForOffer) {
      alert('يرجى اختيار منتج من القائمة أولاً');
      return;
    }
    const product = products.find(p => p.id === selectedProductForOffer);
    if (!product) return;

    const qty = Math.max(1, selectedQuantityForOffer || 1);
    const existingIndex = offerForm.items.findIndex(it => it.productId === product.id);
    let updatedItems = [...offerForm.items];

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += qty;
    } else {
      updatedItems.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code || '',
        quantity: qty,
        unitPrice: product.price,
        image: product.image,
        volume: product.volume
      });
    }

    const calculatedOriginalPrice = updatedItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const calculatedOfferPrice = offerForm.offerPrice > 0 ? offerForm.offerPrice : Math.round(calculatedOriginalPrice * 0.84);
    const calculatedSavings = Math.max(0, calculatedOriginalPrice - calculatedOfferPrice);

    setOfferForm({
      ...offerForm,
      items: updatedItems,
      originalPrice: calculatedOriginalPrice,
      offerPrice: calculatedOfferPrice,
      savings: calculatedSavings
    });

    setSelectedProductForOffer('');
    setSelectedQuantityForOffer(1);
  };

  const handleUpdateDraftItemQty = (productId: string, diff: number) => {
    const updatedItems = offerForm.items.map(it => {
      if (it.productId === productId) {
        const newQty = it.quantity + diff;
        return { ...it, quantity: newQty < 1 ? 1 : newQty };
      }
      return it;
    });

    const calculatedOriginalPrice = updatedItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const calculatedSavings = Math.max(0, calculatedOriginalPrice - offerForm.offerPrice);

    setOfferForm({
      ...offerForm,
      items: updatedItems,
      originalPrice: calculatedOriginalPrice,
      savings: calculatedSavings
    });
  };

  const handleRemoveDraftItem = (productId: string) => {
    const updatedItems = offerForm.items.filter(it => it.productId !== productId);
    const calculatedOriginalPrice = updatedItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
    const calculatedSavings = Math.max(0, calculatedOriginalPrice - offerForm.offerPrice);

    setOfferForm({
      ...offerForm,
      items: updatedItems,
      originalPrice: calculatedOriginalPrice,
      savings: calculatedSavings
    });
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerForm.items.length === 0) {
      alert('يجب إضافة منتج واحد على الأقل في باقة العرض!');
      return;
    }
    if (offerForm.offerPrice <= 0) {
      alert('يرجى تحديد سعر العرض!');
      return;
    }

    try {
      const calculatedSavings = Math.max(0, offerForm.originalPrice - offerForm.offerPrice);
      const payload = {
        title: offerForm.title,
        code: offerForm.code?.trim() || '',
        description: offerForm.description,
        badge: offerForm.badge || 'عرض خاص',
        image: offerForm.image || '',
        isAvailable: Boolean(offerForm.isAvailable),
        isFreeShipping: Boolean(offerForm.isFreeShipping),
        items: offerForm.items,
        originalPrice: Number(offerForm.originalPrice),
        offerPrice: Number(offerForm.offerPrice),
        savings: Number(calculatedSavings),
        updatedAt: serverTimestamp()
      };

      if (editingOffer) {
        const ref = doc(db, 'offers', editingOffer.id);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, 'offers'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      setIsOfferFormOpen(false);
      setEditingOffer(null);
      setOfferForm({
        title: '',
        code: '',
        description: '',
        badge: 'عرض توفير مميز',
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
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء حفظ باقة العرض.');
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      code: offer.code || '',
      description: offer.description,
      badge: offer.badge || 'عرض خاص',
      image: offer.image || '',
      isAvailable: offer.isAvailable,
      isFreeShipping: Boolean(offer.isFreeShipping),
      items: offer.items || [],
      originalPrice: offer.originalPrice,
      offerPrice: offer.offerPrice,
      savings: offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice)
    });
    setSelectedProductForOffer('');
    setSelectedQuantityForOffer(1);
    setIsOfferFormOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteDoc(doc(db, 'offers', offerId));
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء حذف العرض');
    }
  };

  const handleToggleOfferAvailability = async (offerId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'offers', offerId), { isAvailable: !currentStatus });
    } catch (e) {
      console.error(e);
    }
  };

  // Orders Actions
  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyBillCode = (code?: string) => {
    if (!code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedBillCode(code);
      setTimeout(() => setCopiedBillCode(null), 2000);
    }
  };

  const handleSyncOrderWithShipping = async (order: Order, allowRecreate = false) => {
    if (!order.id) return;
    const existingCode = order.shippingInfo?.trackingNumber || order.shippingInfo?.billCode || '';

    if (order.status === 'delivered') {
      alert(`⛔ هذا الطلب تم تسليمه للعميل مسبقاً.\n\nرقم شحنة بوسطة: ${existingCode || 'مسجل'}`);
      return;
    }

    if (existingCode && !allowRecreate) {
      const confirmResend = confirm(
        `⚠️ تنبيه لمنع تكرار الشحنة:\n\n` +
        `هذا الطلب مسجل بالفعل لدى شركة بوسطة برقم الشحنة: ${existingCode}\n\n` +
        `هل تريد بالتأكيد إعادة إرساله لشركة بوسطة لإنشاء بوليصة جديدة؟`
      );
      if (!confirmResend) return;
      allowRecreate = true;
    }

    setSyncingOrderId(order.id);
    try {
      const token = await auth.currentUser?.getIdToken(true).catch(() => auth.currentUser?.getIdToken());
      const res = await fetch('/api/shipping/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: existingCode,
          forceRecreate: allowRecreate,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerCity: order.customerCity,
          customerAddress: order.customerAddress,
          customerEmail: order.customerEmail,
          notes: order.notes,
          items: order.items,
          totalPrice: order.totalPrice,
          weight: order.shippingWeight || 1
        })
      });

      const data = await res.json();
      if (data.success && (data.trackingNumber || data.billCode)) {
        const tracking = data.trackingNumber || data.billCode;
        const updatedShippingInfo: ShippingInfo = {
          billCode: tracking,
          trackingNumber: tracking,
          deliveryId: data.deliveryId || tracking,
          courier: 'Bosta',
          status: data.state || 'created',
          txlogisticId: order.id,
          syncedAt: new Date().toISOString()
        };

        await updateDoc(doc(db, 'orders', order.id), {
          shippingInfo: updatedShippingInfo,
          status: order.status === 'pending' ? 'preparing' : order.status
        });

        alert(`✅ تم إرسال الطلب بنجاح إلى شركة بوسطة!\nرقم الشحنة: ${tracking}`);
      } else {
        const errorMsg = data.error || data.msg || 'حدث خطأ غير معروف';
        if (order.id) {
          await updateDoc(doc(db, 'orders', order.id), {
            'shippingInfo.error': errorMsg,
            'shippingInfo.lastAttemptAt': new Date().toISOString()
          }).catch(() => null);
        }
        alert(`❌ فشل الإرسال لشركة بوسطة:\n${errorMsg}`);
      }
    } catch (err: any) {
      console.error('Error syncing order with Bosta:', err);
      alert(`❌ خطأ في الاتصال بشركة بوسطة: ${err.message || err}`);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleBulkSyncOrdersWithShipping = async () => {
    const unsyncedOrders = allOrders.filter(
      ord => !ord.shippingInfo?.trackingNumber && !ord.shippingInfo?.billCode && ord.status !== 'cancelled' && ord.status !== 'delivered'
    );

    if (unsyncedOrders.length === 0) {
      alert('جميع الطلبات الحالية مسجلة بالفعل لدى شركة بوسطة!');
      return;
    }

    const confirmBulk = confirm(
      `📦 تأكيد الإرسال الجماعي:\n\n` +
      `هل تريد إرسال (${unsyncedOrders.length}) طلب غير مسجل إلى شركة بوسطة لإنشاء بوالص الشحن؟`
    );
    if (!confirmBulk) return;

    setIsBulkSyncing(true);
    setBulkSyncProgress({ current: 0, total: unsyncedOrders.length });

    let successCount = 0;
    const failedList: Array<{
      orderId: string;
      customerName: string;
      customerPhone: string;
      customerCity: string;
      customerAddress: string;
      totalPrice: number;
      error: string;
    }> = [];

    for (let i = 0; i < unsyncedOrders.length; i++) {
      const ord = unsyncedOrders[i];
      setBulkSyncProgress({ current: i + 1, total: unsyncedOrders.length });

      try {
        const token = await auth.currentUser?.getIdToken(true).catch(() => auth.currentUser?.getIdToken());
        const res = await fetch('/api/shipping/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            orderId: ord.id,
            customerName: ord.customerName,
            customerPhone: ord.customerPhone,
            customerCity: ord.customerCity,
            customerAddress: ord.customerAddress,
            customerEmail: ord.customerEmail,
            notes: ord.notes,
            items: ord.items,
            totalPrice: ord.totalPrice,
            weight: ord.shippingWeight || 1
          })
        });

        const data = await res.json();
        if (data.success && (data.trackingNumber || data.billCode)) {
          const tracking = data.trackingNumber || data.billCode;
          const updatedShippingInfo: ShippingInfo = {
            billCode: tracking,
            trackingNumber: tracking,
            deliveryId: data.deliveryId || tracking,
            courier: 'Bosta',
            status: data.state || 'created',
            txlogisticId: ord.id,
            syncedAt: new Date().toISOString()
          };

          if (ord.id) {
            await updateDoc(doc(db, 'orders', ord.id), {
              shippingInfo: updatedShippingInfo,
              status: ord.status === 'pending' ? 'preparing' : ord.status
            });
          }
          successCount++;
        } else {
          const reason = data.error || data.msg || 'فشل غير محدد من بوسطة';
          failedList.push({
            orderId: ord.id || 'N/A',
            customerName: ord.customerName || 'عميل',
            customerPhone: ord.customerPhone || '',
            customerCity: ord.customerCity || '',
            customerAddress: ord.customerAddress || '',
            totalPrice: ord.totalPrice || 0,
            error: reason
          });
          if (ord.id) {
            await updateDoc(doc(db, 'orders', ord.id), {
              'shippingInfo.error': reason,
              'shippingInfo.lastAttemptAt': new Date().toISOString()
            }).catch(() => null);
          }
        }
      } catch (err: any) {
        const reason = err.message || 'خطأ في الاتصال بالخادم';
        failedList.push({
          orderId: ord.id || 'N/A',
          customerName: ord.customerName || 'عميل',
          customerPhone: ord.customerPhone || '',
          customerCity: ord.customerCity || '',
          customerAddress: ord.customerAddress || '',
          totalPrice: ord.totalPrice || 0,
          error: reason
        });
        if (ord.id) {
          await updateDoc(doc(db, 'orders', ord.id), {
            'shippingInfo.error': reason,
            'shippingInfo.lastAttemptAt': new Date().toISOString()
          }).catch(() => null);
        }
      }
    }

    setIsBulkSyncing(false);
    setBulkSyncProgress(null);

    if (failedList.length > 0) {
      setFailedSyncOrders(failedList);
      setIsFailedOrdersModalOpen(true);
    } else {
      alert(`🏁 اكتمل الإرسال لشركة بوسطة بنجاح تام!\n\n✅ تم إرسال جميع الطلبات (${successCount}) وتوليد بوالص الشحن.`);
    }
  };

  const openFailedOrdersReport = () => {
    if (failedSyncOrders && failedSyncOrders.length > 0) {
      setIsFailedOrdersModalOpen(true);
      return;
    }
    const unsynced = allOrders
      .filter(o => !o.shippingInfo?.trackingNumber && !o.shippingInfo?.billCode && o.status !== 'cancelled' && o.status !== 'delivered')
      .map(o => ({
        orderId: o.id || 'N/A',
        customerName: o.customerName || 'عميل',
        customerPhone: o.customerPhone || '',
        customerCity: o.customerCity || '',
        customerAddress: o.customerAddress || '',
        totalPrice: o.totalPrice || 0,
        error: o.shippingInfo?.error || 'لم يتم إصدار بوليصة شحن له حتى الآن'
      }));
    setFailedSyncOrders(unsynced);
    setIsFailedOrdersModalOpen(true);
  };

  // Orders To Delete calculations
  const ordersToDelete = useMemo(() => {
    if (!deleteTargetDate) return [];
    const parts = deleteTargetDate.split('-');
    if (parts.length !== 3) return [];
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return [];

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    return allOrders.filter(ord => {
      if (deleteStatusFilter !== 'all' && ord.status !== deleteStatusFilter) {
        return false;
      }
      const orderDate = getOrderDateObj(ord.createdAt);
      if (!orderDate) return false;
      const time = orderDate.getTime();

      if (deleteMode === 'exact') {
        return time >= startOfDay && time <= endOfDay;
      } else if (deleteMode === 'before') {
        return time < startOfDay;
      } else if (deleteMode === 'on_or_before') {
        return time <= endOfDay;
      }
      return false;
    });
  }, [allOrders, deleteTargetDate, deleteMode, deleteStatusFilter]);

  const handleExecuteDeleteByDate = async () => {
    if (ordersToDelete.length === 0) {
      alert('لا توجد أي طلبات تطابق المعايير المحددة للحذف.');
      return;
    }

    const modeText =
      deleteMode === 'exact'
        ? `التي تمت في يوم (${deleteTargetDate}) تحديداً`
        : deleteMode === 'before'
        ? `التي تمت قبل يوم (${deleteTargetDate})`
        : `التي تمت في يوم (${deleteTargetDate}) وما قبله`;

    const statusMap: Record<string, string> = {
      all: 'بجميع الحالات',
      pending: 'بحالة (معلق)',
      preparing: 'بحالة (جاري التجهيز)',
      shipping: 'بحالة (خرج مع المندوب)',
      delivered: 'بحالة (تم الاستلام)',
      cancelled: 'بحالة (ملغي)'
    };
    const statusText = statusMap[deleteStatusFilter] || `بحالة (${deleteStatusFilter})`;

    const confirmMsg =
      `⚠️ تحذير أمان: حذف نهائي لا يمكن التراجع عنه!\n\n` +
      `أنت على وشك حذف (${ordersToDelete.length}) طلب ${statusText} ${modeText} نهائياً من قاعدة بيانات المتجر (Firebase).\n\n` +
      `هل أنت متأكد تماماً من رغبتك في حذف هذه الطلبات الآن؟`;

    if (!confirm(confirmMsg)) return;

    if (ordersToDelete.length > 5) {
      const doubleCheck = prompt(
        `🔒 تأكيد إضافي لحماية البيانات:\n\nلتأكيد حذف (${ordersToDelete.length}) طلب نهائياً، اكتب كلمة "حذف" في المربع أدناه:`
      );
      if (doubleCheck !== 'حذف') {
        alert('تم إلغاء عملية الحذف.');
        return;
      }
    }

    setIsDeletingOrders(true);
    setDeleteProgress({ current: 0, total: ordersToDelete.length });

    let deletedCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < ordersToDelete.length; i++) {
        const ord = ordersToDelete[i];
        if (ord.id) {
          try {
            await deleteDoc(doc(db, 'orders', ord.id));
            deletedCount++;
          } catch (err) {
            console.error(`Error deleting order ${ord.id}:`, err);
            failedCount++;
          }
        }
        setDeleteProgress({ current: i + 1, total: ordersToDelete.length });
      }

      alert(
        `✅ اكتملت عملية الحذف بنجاح!\n\nتم مسح (${deletedCount}) طلب نهائياً من قاعدة البيانات.` +
        (failedCount > 0 ? `\n(تعذر مسح ${failedCount} طلب بسبب قيود الصلاحيات)` : '')
      );
      setIsDeleteByDateModalOpen(false);
    } catch (globalErr: any) {
      console.error('Bulk order delete error:', globalErr);
      alert(`حدث خطأ أثناء تنفيذ الحذف: ${globalErr.message}`);
    } finally {
      setIsDeletingOrders(false);
      setDeleteProgress(null);
    }
  };

  const handleApplyDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom') => {
    setOrderDatePreset(preset);
    const now = new Date();
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'all') {
      setOrderStartDate('');
      setOrderEndDate('');
    } else if (preset === 'today') {
      const todayStr = formatYMD(now);
      setOrderStartDate(todayStr);
      setOrderEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(Date.now() - 86400000);
      const yestStr = formatYMD(yest);
      setOrderStartDate(yestStr);
      setOrderEndDate(yestStr);
    } else if (preset === 'last_7_days') {
      const past7 = new Date(Date.now() - 6 * 86400000);
      setOrderStartDate(formatYMD(past7));
      setOrderEndDate(formatYMD(now));
    } else if (preset === 'last_30_days') {
      const past30 = new Date(Date.now() - 29 * 86400000);
      setOrderStartDate(formatYMD(past30));
      setOrderEndDate(formatYMD(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setOrderStartDate(formatYMD(firstDay));
      setOrderEndDate(formatYMD(now));
    }
  };

  const handleApplyStatsDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'single' | 'custom') => {
    setStatsDatePreset(preset);
    const now = new Date();
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'all') {
      setStatsStartDate('');
      setStatsEndDate('');
      setStatsSingleDate('');
    } else if (preset === 'today') {
      const todayStr = formatYMD(now);
      setStatsSingleDate(todayStr);
      setStatsStartDate(todayStr);
      setStatsEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(Date.now() - 86400000);
      const yestStr = formatYMD(yest);
      setStatsSingleDate(yestStr);
      setStatsStartDate(yestStr);
      setStatsEndDate(yestStr);
    } else if (preset === 'last_7_days') {
      const past7 = new Date(Date.now() - 6 * 86400000);
      setStatsStartDate(formatYMD(past7));
      setStatsEndDate(formatYMD(now));
      setStatsSingleDate('');
    } else if (preset === 'last_30_days') {
      const past30 = new Date(Date.now() - 29 * 86400000);
      setStatsStartDate(formatYMD(past30));
      setStatsEndDate(formatYMD(now));
      setStatsSingleDate('');
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStatsStartDate(formatYMD(firstDay));
      setStatsEndDate(formatYMD(now));
      setStatsSingleDate('');
    } else if (preset === 'last_month') {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStatsStartDate(formatYMD(firstDayPrevMonth));
      setStatsEndDate(formatYMD(lastDayPrevMonth));
      setStatsSingleDate('');
    } else if (preset === 'single') {
      if (!statsSingleDate) {
        const todayStr = formatYMD(now);
        setStatsSingleDate(todayStr);
        setStatsStartDate(todayStr);
        setStatsEndDate(todayStr);
      } else {
        setStatsStartDate(statsSingleDate);
        setStatsEndDate(statsSingleDate);
      }
    } else if (preset === 'custom') {
      setStatsSingleDate('');
      if (!statsStartDate && !statsEndDate) {
        const todayStr = formatYMD(now);
        const past7 = new Date(Date.now() - 6 * 86400000);
        setStatsStartDate(formatYMD(past7));
        setStatsEndDate(todayStr);
      }
    }
  };

  // Base orders for admin status counts (filtered by date if date range is active)
  const dateScopedOrders = useMemo(() => {
    if (!orderStartDate && !orderEndDate) return allOrders;
    return allOrders.filter(ord => {
      const orderDate = getOrderDateObj(ord.createdAt);
      if (!orderDate) return false;
      const time = orderDate.getTime();
      if (orderStartDate) {
        const parts = orderStartDate.split('-').map(Number);
        if (parts.length === 3) {
          const startMs = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
          if (time < startMs) return false;
        }
      }
      if (orderEndDate) {
        const parts = orderEndDate.split('-').map(Number);
        if (parts.length === 3) {
          const endMs = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
          if (time > endMs) return false;
        }
      }
      return true;
    });
  }, [allOrders, orderStartDate, orderEndDate]);

  // Order status counts for Admin
  const orderCounts = useMemo(() => ({
    all: dateScopedOrders.length,
    pending: dateScopedOrders.filter(o => o.status === 'pending').length,
    preparing: dateScopedOrders.filter(o => o.status === 'preparing').length,
    shipping: dateScopedOrders.filter(o => o.status === 'shipping').length,
    delivered: dateScopedOrders.filter(o => o.status === 'delivered').length,
    cancelled: dateScopedOrders.filter(o => o.status === 'cancelled').length,
    bostaUnsynced: dateScopedOrders.filter(o => !o.shippingInfo?.trackingNumber && !o.shippingInfo?.billCode && o.status !== 'cancelled' && o.status !== 'delivered').length,
    bostaSynced: dateScopedOrders.filter(o => !!(o.shippingInfo?.trackingNumber || o.shippingInfo?.billCode)).length,
  }), [dateScopedOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return dateScopedOrders.filter((ord) => {
      let statusMatch = true;
      if (adminOrderFilter === 'all') {
        statusMatch = true;
      } else if (adminOrderFilter === 'bosta_unsynced') {
        statusMatch = !ord.shippingInfo?.trackingNumber && !ord.shippingInfo?.billCode && ord.status !== 'cancelled' && ord.status !== 'delivered';
      } else if (adminOrderFilter === 'bosta_synced') {
        statusMatch = !!(ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode);
      } else {
        statusMatch = ord.status === adminOrderFilter;
      }
      if (!statusMatch) return false;

      const query = adminOrderSearch.trim().toLowerCase();
      if (!query) return true;
      const nameMatch = ord.customerName?.toLowerCase().includes(query);
      const phoneMatch = ord.customerPhone?.includes(query);
      const idMatch = ord.id?.toLowerCase().includes(query);
      const waybillMatch = (ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode || '').toLowerCase().includes(query);
      return nameMatch || phoneMatch || idMatch || waybillMatch;
    });
  }, [dateScopedOrders, adminOrderFilter, adminOrderSearch]);

  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [adminOrderFilter, adminOrderSearch, orderStartDate, orderEndDate, ordersPerPage]);

  const totalOrders = filteredOrders.length;
  const totalOrderPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const validOrderPage = Math.min(Math.max(1, ordersCurrentPage), totalOrderPages);
  const startIndex = (validOrderPage - 1) * ordersPerPage;
  const endIndex = Math.min(startIndex + ordersPerPage, totalOrders);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex]);

  // Resend / Recreate shipping waybills for paginated orders
  const handleResendPaginatedOrdersToShipping = async () => {
    if (paginatedOrders.length === 0) {
      alert('لا توجد أي طلبات معروضة في الصفحة الحالية لإعادة إرسالها!');
      return;
    }

    const targetOrders = paginatedOrders.filter(
      ord => ord.status !== 'cancelled' && ord.status !== 'delivered'
    );

    if (targetOrders.length === 0) {
      alert('جميع الطلبات المعروضة بالصفحة الحالية إما ملغية أو تم تسليمها بالفعل، ولا يمكن إرسالها لشركة الشحن.');
      return;
    }

    const skippedCount = paginatedOrders.length - targetOrders.length;
    const confirmResend = confirm(
      `🚚 تأكيد إعادة الإرسال لشركة الشحن:\n\n` +
      `هل تريد بالتأكيد إعادة إرسال طلبات الصفحة الحالية (${targetOrders.length} طلب) إلى شركة الشحن (بوسطة)؟\n\n` +
      `سيتم تحديث وإنشاء بوالص الشحن لجميع طلبات الصفحة المعروضة` +
      (skippedCount > 0 ? ` (مع استثناء ${skippedCount} طلب ملغي/مستلم).` : '.')
    );
    if (!confirmResend) return;

    setIsResendingPageOrders(true);
    setResendPageProgress({ current: 0, total: targetOrders.length });

    for (let i = 0; i < targetOrders.length; i++) {
      const ord = targetOrders[i];
      setResendPageProgress({ current: i + 1, total: targetOrders.length });

      try {
        const token = await auth.currentUser?.getIdToken(true).catch(() => auth.currentUser?.getIdToken());
        const existingCode = ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode || '';

        const res = await fetch('/api/shipping/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            orderId: ord.id,
            trackingNumber: existingCode,
            forceRecreate: true,
            customerName: ord.customerName,
            customerPhone: ord.customerPhone,
            customerCity: ord.customerCity,
            customerAddress: ord.customerAddress,
            customerEmail: ord.customerEmail,
            notes: ord.notes,
            items: ord.items,
            totalPrice: ord.totalPrice,
            weight: ord.shippingWeight || 1
          })
        });

        const data = await res.json();
        if (data.success && (data.trackingNumber || data.billCode)) {
          const tracking = data.trackingNumber || data.billCode;
          const updatedShippingInfo: ShippingInfo = {
            billCode: tracking,
            trackingNumber: tracking,
            deliveryId: data.deliveryId || tracking,
            courier: 'Bosta',
            status: data.state || 'created',
            txlogisticId: ord.id,
            syncedAt: new Date().toISOString()
          };

          if (ord.id) {
            await updateDoc(doc(db, 'orders', ord.id), {
              shippingInfo: updatedShippingInfo,
              status: ord.status === 'pending' ? 'preparing' : ord.status
            });
          }
        }
      } catch (err) {
        console.error('Error resending page order to Bosta:', err);
      }
    }

    setIsResendingPageOrders(false);
    setResendPageProgress(null);
    alert('✅ تم الانتهاء من إعادة إرسال طلبات الصفحة لشركة بوسطة.');
  };

  // Stats Orders Calculations
  const statsDateScopedOrders = useMemo(() => {
    if (!statsStartDate && !statsEndDate) return allOrders;
    return allOrders.filter(ord => {
      const orderDate = getOrderDateObj(ord.createdAt);
      if (!orderDate) return false;
      const time = orderDate.getTime();
      if (statsStartDate) {
        const parts = statsStartDate.split('-').map(Number);
        if (parts.length === 3) {
          const startMs = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
          if (time < startMs) return false;
        }
      }
      if (statsEndDate) {
        const parts = statsEndDate.split('-').map(Number);
        if (parts.length === 3) {
          const endMs = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
          if (time > endMs) return false;
        }
      }
      return true;
    });
  }, [allOrders, statsStartDate, statsEndDate]);

  const statsMetrics: StatsMetrics = useMemo(() => {
    const totalCount = statsDateScopedOrders.length;
    const pendingOrders = statsDateScopedOrders.filter(o => o.status === 'pending');
    const preparingOrders = statsDateScopedOrders.filter(o => o.status === 'preparing');
    const shippingOrders = statsDateScopedOrders.filter(o => o.status === 'shipping');
    const deliveredOrders = statsDateScopedOrders.filter(o => o.status === 'delivered');
    const cancelledOrders = statsDateScopedOrders.filter(o => o.status === 'cancelled');
    const validOrders = statsDateScopedOrders.filter(o => o.status !== 'cancelled');

    const totalSalesValid = validOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalSalesAll = statsDateScopedOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalCancelledRevenue = cancelledOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    let displayCount = validOrders.length;
    let displayRevenue = totalSalesValid;
    let displayModeLabel = 'المبيعات المؤكدة (بدون الملغية)';

    if (statsStatusMode === 'all') {
      displayCount = totalCount;
      displayRevenue = totalSalesAll;
      displayModeLabel = 'كافة الطلبات (شاملة الملغية)';
    } else if (statsStatusMode === 'delivered') {
      displayCount = deliveredOrders.length;
      displayRevenue = totalDeliveredRevenue;
      displayModeLabel = 'الطلبات المستلمة والناجحة فقط';
    }

    const avgOrderValue = displayCount > 0 ? displayRevenue / displayCount : 0;

    return {
      totalCount,
      validOrdersCount: validOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      shippingOrdersCount: shippingOrders.length,
      preparingOrdersCount: preparingOrders.length,
      pendingOrdersCount: pendingOrders.length,

      displayCount,
      displayRevenue,
      displayModeLabel,
      avgOrderValue,

      totalDeliveredRevenue,
      totalCancelledRevenue,

      pendingRevenue: pendingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
      preparingRevenue: preparingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
      shippingRevenue: shippingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
    };
  }, [statsDateScopedOrders, statsStatusMode]);

  useEffect(() => {
    setStatsOrdersCurrentPage(1);
  }, [statsStartDate, statsEndDate, statsStatusMode, statsSearchQuery, statsOrdersPerPage]);

  const statsDisplayOrders = useMemo(() => {
    return statsDateScopedOrders.filter(ord => {
      if (statsStatusMode === 'valid' && ord.status === 'cancelled') return false;
      if (statsStatusMode === 'delivered' && ord.status !== 'delivered') return false;

      const q = statsSearchQuery.trim().toLowerCase();
      if (!q) return true;

      const nameMatch = ord.customerName?.toLowerCase().includes(q);
      const phoneMatch = ord.customerPhone?.includes(q);
      const idMatch = ord.id?.toLowerCase().includes(q);
      const cityMatch = ord.customerCity?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || idMatch || cityMatch;
    });
  }, [statsDateScopedOrders, statsStatusMode, statsSearchQuery]);

  const statsTotalPages = Math.max(1, Math.ceil(statsDisplayOrders.length / statsOrdersPerPage));
  const statsValidPage = Math.min(Math.max(1, statsOrdersCurrentPage), statsTotalPages);
  const statsStartIndex = (statsValidPage - 1) * statsOrdersPerPage;
  const statsEndIndex = Math.min(statsStartIndex + statsOrdersPerPage, statsDisplayOrders.length);
  const paginatedStatsOrders = useMemo(() => {
    return statsDisplayOrders.slice(statsStartIndex, statsEndIndex);
  }, [statsDisplayOrders, statsStartIndex, statsEndIndex]);

  const statsPeriodDescription = useMemo(() => {
    if (statsDatePreset === 'today' || (statsStartDate && statsStartDate === statsEndDate && statsStartDate === new Date().toISOString().split('T')[0])) {
      return `اليوم (${statsStartDate})`;
    }
    if (statsDatePreset === 'yesterday') {
      return `أمس (${statsStartDate})`;
    }
    if (statsStartDate && statsEndDate && statsStartDate === statsEndDate) {
      return `يوم (${statsStartDate}) تحديداً`;
    }
    if (statsStartDate && statsEndDate) {
      return `الفترة من (${statsStartDate}) إلى (${statsEndDate})`;
    }
    if (statsStartDate) {
      return `من تاريخ (${statsStartDate}) حتى اليوم`;
    }
    if (statsEndDate) {
      return `حتى تاريخ (${statsEndDate})`;
    }
    return 'كافة الأوقات (سجل المتجر بالكامل)';
  }, [statsDatePreset, statsStartDate, statsEndDate]);

  // Export to Excel Handlers
  const handleExportStatsOrdersToExcel = () => {
    if (statsDateScopedOrders.length === 0) {
      alert('لا توجد أي طلبات تطابق الفترة المحددة لتصديرها.');
      return;
    }

    const formatItemsText = (ord: Order) => {
      return (ord.items || [])
        .map(it => {
          const isOffer = it.isOffer || (typeof it.productId === 'string' && it.productId.startsWith('offer-'));
          const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId);
          const bundle = it.bundleItems && it.bundleItems.length > 0
            ? it.bundleItems
            : (matchingOffer?.items || null);

          if (bundle && Array.isArray(bundle) && bundle.length > 0) {
            const bundleDesc = bundle.map(sub => {
              const subQty = (Number(sub.quantity) || 1) * (Number(it.quantity) || 1);
              return `عدد (${subQty}) ${cleanProductNameForWorkers(sub.productName)}`;
            }).join(' + ');
            return `[${cleanProductNameForWorkers(it.productName)}: ${bundleDesc}]`;
          }

          return `عدد (${it.quantity}) ${cleanProductNameForWorkers(it.productName)}`;
        })
        .join(' | ');
    };

    const statusNamesAr: Record<string, string> = {
      pending: 'معلق في الانتظار',
      preparing: 'جاري التجهيز',
      shipping: 'خرج مع المندوب',
      delivered: 'تم الاستلام والمحاسبة',
      cancelled: 'ملغي'
    };

    const headers = [
      'كود الطلب',
      'تاريخ الطلب',
      'الاسم',
      'الرقم',
      'المحافظة',
      'العنوان',
      'تفاصيل منتجات الطلب',
      'إجمالي المبلغ (ج.م)',
      'حالة الطلب',
      'رقم بوليصة الشحن',
      'شركة الشحن',
      'ملاحظات العميل'
    ];

    const rows = statsDisplayOrders.map(ord => {
      const cleanPhone = ord.customerPhone ? sanitizeEgyptianPhone(ord.customerPhone, ord.customerPhone) : '';
      const itemsDetail = formatItemsText(ord);
      const trackingNum = ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode || '';
      return [
        ord.id || '',
        formatOrderDate(ord.createdAt),
        ord.customerName || '',
        cleanPhone ? `="${cleanPhone}"` : '',
        ord.customerCity || '',
        ord.customerAddress || '',
        itemsDetail || '',
        String(ord.totalPrice ?? 0),
        statusNamesAr[ord.status] || ord.status,
        trackingNum ? `="${trackingNum}"` : '',
        ord.shippingInfo?.courier || '',
        ord.notes || ''
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodLabel = statsStartDate || statsEndDate
      ? `_من_${statsStartDate || 'البداية'}_إلى_${statsEndDate || 'اليوم'}`
      : '_كافة_الفترات';
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_مبيعات_جولد_كلين${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersToExcel = (
    targetStatus: string = 'preparing',
    exportFormat: 'comprehensive' | 'standard_3_cols' = 'standard_3_cols'
  ) => {
    let targetOrders: Order[] = [];
    let filenamePrefix = '';

    if (targetStatus === 'all') {
      targetOrders = (orderStartDate || orderEndDate) ? dateScopedOrders : allOrders;
      filenamePrefix = 'جميع_طلبات_المتجر';
    } else if (targetStatus === 'current_filter') {
      targetOrders = filteredOrders;
      const periodLabel = orderStartDate || orderEndDate
        ? `_من_${orderStartDate || 'البداية'}_إلى_${orderEndDate || 'اليوم'}`
        : '';
      filenamePrefix = `طلبات_مفلترة_${adminOrderFilter}${periodLabel}`;
    } else {
      const baseList = (orderStartDate || orderEndDate) ? dateScopedOrders : allOrders;
      targetOrders = baseList.filter(o => o.status === targetStatus);
      const statusNames: Record<string, string> = {
        preparing: 'جاري_التجهيز',
        pending: 'معلق',
        shipping: 'بالشحن',
        delivered: 'تم_الاستلام',
        cancelled: 'ملغي'
      };
      filenamePrefix = `طلبات_${statusNames[targetStatus] || targetStatus}`;
    }

    if (targetOrders.length === 0) {
      alert(`لا توجد أي طلبات تطابق المعايير أو الفترة المحددة حالياً لتصديرها.`);
      return;
    }

    const formatItemsText = (ord: Order) => {
      return (ord.items || [])
        .map(it => {
          const isOffer = it.isOffer || (typeof it.productId === 'string' && it.productId.startsWith('offer-'));
          const bundle = it.bundleItems && it.bundleItems.length > 0
            ? it.bundleItems
            : (isOffer ? offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId)?.items : null);

          if (bundle && Array.isArray(bundle) && bundle.length > 0) {
            const bundleDesc = bundle.map(sub => {
              const subQty = (Number(sub.quantity) || 1) * (Number(it.quantity) || 1);
              return `عدد (${subQty}) ${cleanProductNameForWorkers(sub.productName)}`;
            }).join(' + ');
            return `[${cleanProductNameForWorkers(it.productName)}: ${bundleDesc}]`;
          }

          return `عدد (${it.quantity}) ${cleanProductNameForWorkers(it.productName)}`;
        })
        .join(' | ');
    };

    let headers: string[] = [];
    let rows: string[][] = [];

    const statusNamesAr: Record<string, string> = {
      pending: 'معلق في الانتظار',
      preparing: 'جاري التجهيز',
      shipping: 'خرج مع المندوب',
      delivered: 'تم الاستلام والمحاسبة',
      cancelled: 'ملغي'
    };

    if (exportFormat === 'comprehensive') {
      headers = [
        'كود الطلب',
        'تاريخ الطلب',
        'الاسم',
        'الرقم',
        'المحافظة',
        'العنوان',
        'تفاصيل منتجات الطلب',
        'إجمالي المبلغ (ج.م)',
        'حالة الطلب',
        'رقم بوليصة الشحن',
        'شركة الشحن',
        'ملاحظات العميل'
      ];

      rows = targetOrders.map(ord => {
        const cleanPhone = ord.customerPhone ? sanitizeEgyptianPhone(ord.customerPhone, ord.customerPhone) : '';
        const itemsDetail = formatItemsText(ord);
        const trackingNum = ord.shippingInfo?.trackingNumber || ord.shippingInfo?.billCode || '';
        return [
          ord.id || '',
          formatOrderDate(ord.createdAt),
          ord.customerName || '',
          cleanPhone ? `="${cleanPhone}"` : '',
          ord.customerCity || '',
          ord.customerAddress || '',
          itemsDetail || '',
          String(ord.totalPrice ?? 0),
          statusNamesAr[ord.status] || ord.status,
          trackingNum ? `="${trackingNum}"` : 'غير مسجل',
          ord.shippingInfo?.courier || 'بوسطة',
          ord.notes || ''
        ];
      });
    } else {
      headers = ['الاسم', 'الرقم', 'تفاصيل منتجات الطلب'];
      rows = targetOrders.map(ord => {
        const cleanPhone = ord.customerPhone ? sanitizeEgyptianPhone(ord.customerPhone, ord.customerPhone) : '';
        const itemsDetail = formatItemsText(ord);
        return [
          ord.customerName || '',
          cleanPhone ? `="${cleanPhone}"` : '',
          itemsDetail || ''
        ];
      });
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodTag = (orderStartDate || orderEndDate)
      ? `_فترة_${orderStartDate || 'البداية'}_إلى_${orderEndDate || 'اليوم'}`
      : '';
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}${periodTag}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800" dir="rtl">
      {/* Admin Top Header Navigation Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <span className="w-8 h-8 rounded-lg bg-amber-500 group-hover:bg-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs transition-colors">G</span>
            <h1 className="text-base font-bold tracking-tight text-amber-500 font-sans">
              GOLD<span className="text-slate-900">CLEAN</span>
              <span className="text-xs text-slate-400 font-normal mr-1.5 font-sans">لوحة الإدارة</span>
            </h1>
          </Link>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            المشرفين والمدراء
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                  {user.displayName ? user.displayName.charAt(0) : 'A'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">{user.displayName?.split(' ')[0]}</span>
                <span className="text-[9px] text-slate-400">{userRole === 'admin' ? 'المدير العام' : 'مشرف المتجر'}</span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
          >
            <span>الرجوع للمتجر 🏪</span>
          </Link>
        </div>
      </header>

      {/* Main Admin Portal */}
      <main className="flex-1 flex overflow-hidden relative">
        <MerchantPortal
          isMerchantAuthenticated={isMerchantAuthenticated}
          user={user}
          handleGoogleSignIn={handleGoogleSignIn}
          userRole={userRole}
          setIsMerchantOpen={() => router.push('/')}
          pendingComplaintsCount={pendingComplaintsCount}
          adminTab={adminTab}
          setAdminTab={setAdminTab}

          // Orders
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
          isBulkMovingPending={isBulkPreparing}
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

          // Products
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

          // Offers
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

          // Categories
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          isCategoryFormOpen={isCategoryFormOpen}
          setIsCategoryFormOpen={setIsCategoryFormOpen}
          categoryToDelete={categoryToDelete}
          setCategoryToDelete={setCategoryToDelete}

          // Stats
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
          statsStartIndex={statsStartIndex}
          statsEndIndex={statsEndIndex}
          statsTotalPages={statsTotalPages}
          statsValidPage={statsValidPage}
          setStatsOrdersCurrentPage={setStatsOrdersCurrentPage}

          // Users
          allUsers={allUsers}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          handleChangeUserRole={handleChangeUserRole}
        />
      </main>

      {/* Delete Orders By Date Modal */}
      <DeleteOrdersModal
        isOpen={isDeleteByDateModalOpen}
        onClose={() => setIsDeleteByDateModalOpen(false)}
        deleteTargetDate={deleteTargetDate}
        setDeleteTargetDate={setDeleteTargetDate}
        deleteMode={deleteMode}
        setDeleteMode={setDeleteMode}
        deleteStatusFilter={deleteStatusFilter}
        setDeleteStatusFilter={setDeleteStatusFilter}
        ordersToDelete={ordersToDelete}
        isDeletingOrders={isDeletingOrders}
        deleteProgress={deleteProgress}
        onExecuteDelete={handleExecuteDeleteByDate}
        formatOrderDate={formatOrderDate}
      />

      {/* Failed Shipping Sync Report Modal */}
      <FailedSyncModal
        isOpen={isFailedOrdersModalOpen}
        onClose={() => setIsFailedOrdersModalOpen(false)}
        failedSyncOrders={failedSyncOrders}
        allOrders={allOrders}
        onSyncOrderWithShipping={handleSyncOrderWithShipping}
        syncingOrderId={syncingOrderId}
      />

      {/* Worker Packing Slip / Checklist Modal */}
      <PackingSlipModal
        order={packingSlipOrder}
        onClose={() => setPackingSlipOrder(null)}
        offers={offers}
        products={products}
        formatOrderDate={formatOrderDate}
      />
    </div>
  );
}
