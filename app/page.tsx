'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  Check 
} from 'lucide-react';

// Shared types & helpers
import { 
  Category, 
  Product, 
  Offer, 
  OfferItem, 
  CartItem, 
  Order, 
  OrderItem, 
  ShippingInfo, 
  ADMIN_EMAILS, 
  isUserMasterAdmin, 
  formatOrderDate, 
  getOrderDateObj 
} from '../lib/types/store';

// Firebase & Auth
import { db, auth, googleProvider } from '../lib/firebase';
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
  orderBy, 
  serverTimestamp, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Shipping utilities
import {
  calculateShipping,
  calculateCartTotalWeight,
  cleanProductNameForWorkers,
  formatOrderItemsForShipping,
  generateOrderPackingSlipText,
  sanitizeEgyptianPhone
} from '../lib/shipping';

// Specialized components
import Navbar from '../components/layout/Navbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import HomeView from '../components/store/HomeView';
import ProductsView from '../components/store/ProductsView';
import OffersView from '../components/store/OffersView';
import AboutView from '../components/store/AboutView';
import ComplaintsSection from '../components/ComplaintsSection';
import MerchantPortal from '../components/admin/MerchantPortal';
import CartDrawer from '../components/cart/CartDrawer';
import CheckoutModal from '../components/cart/CheckoutModal';
import FlyToCartParticles from '../components/cart/FlyToCartParticles';
import ProductDetailsModal from '../components/modals/ProductDetailsModal';
import AuthModal from '../components/modals/AuthModal';
import OrderTrackerModal from '../components/modals/OrderTrackerModal';
import DeleteOrdersModal from '../components/admin/DeleteOrdersModal';
import FailedSyncModal from '../components/admin/FailedSyncModal';
import PackingSlipModal from '../components/admin/PackingSlipModal';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Google Authentication State
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'user' | 'manager' | 'admin'>('user');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Google Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync or register user in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const isAdminEmail = isUserMasterAdmin(currentUser.email);
        
        getDoc(userRef).then((snap) => {
          let finalRole = isAdminEmail ? 'admin' : 'user';
          if (snap.exists()) {
            finalRole = snap.data().role || finalRole;
          }
          if (isAdminEmail) {
            finalRole = 'admin'; // Always override master admin email
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

        // Listen for user role overrides
        const unsubRole = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentFetchedRole = data.role || 'user';
            setUserRole(currentFetchedRole);
            // If whitelisted as manager or admin, automatically authorize Merchant Dashboard view!
            if (currentFetchedRole === 'manager' || currentFetchedRole === 'admin') {
              setIsMerchantAuthenticated(true);
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
          if (error.code === 'permission-denied') {
            console.warn("Gracefully handling transient permission issue for role overrides, defaulting role to:", defaultRole);
            setUserRole(defaultRole);
            if (defaultRole === 'admin') {
              setIsMerchantAuthenticated(true);
            }
          } else {
            console.error("Error listening to user role overrides:", error);
          }
        });

        // Autofill checkout form
        setCheckoutForm(prev => ({
          ...prev,
          name: currentUser.displayName || prev.name,
        }));

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
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(0);

  // App Navigation View
  const [currentTab, setCurrentTab] = useState<'home' | 'products' | 'offers' | 'about' | 'complaints'>('home');
  const [complaintPrefilledOrderId, setComplaintPrefilledOrderId] = useState<string | null>(null);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState<number>(0);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  
  // Checkout Info
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    country: 'مصر',
    city: '',
    address: '',
    notes: ''
  });
  const [isShippingRatesOpen, setIsShippingRatesOpen] = useState<boolean>(false);
  const [orderInProgress, setOrderInProgress] = useState<boolean>(false);
  const [isBulkPreparing, setIsBulkPreparing] = useState<boolean>(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState<boolean>(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [isResendingPageOrders, setIsResendingPageOrders] = useState<boolean>(false);
  const [resendPageProgress, setResendPageProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedBillCode, setCopiedBillCode] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Failed shipping sync report modal state
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

  // Delete orders by date modal state
  const [isDeleteByDateModalOpen, setIsDeleteByDateModalOpen] = useState<boolean>(false);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState<'exact' | 'before' | 'on_or_before'>('exact');
  const [deleteStatusFilter, setDeleteStatusFilter] = useState<string>('all');
  const [isDeletingOrders, setIsDeletingOrders] = useState<boolean>(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  // Packing slip / worker packing checklist state
  const [packingSlipOrder, setPackingSlipOrder] = useState<Order | null>(null);
  const [copiedPackingOrderId, setCopiedPackingOrderId] = useState<string | null>(null);

  // Tracking orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userOrdersTab, setUserOrdersTab] = useState<'active' | 'cancelled' | 'past'>('active');
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', key: '' });
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState<boolean>(false);

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState<boolean>(true);
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

  // Deletion Custom Confirmation States (Avoid native confirm inside sandbox iframe)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Merchant Portal State
  const [isMerchantOpen, setIsMerchantOpen] = useState<boolean>(false);
  const [isMerchantAuthenticated, setIsMerchantAuthenticated] = useState<boolean>(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'offers' | 'categories' | 'stats' | 'complaints' | 'users'>('orders');
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'bosta_unsynced' | 'bosta_synced'>('all');
  const [adminOrderSearch, setAdminOrderSearch] = useState<string>('');

  // Admin Orders Pagination & Date Period Filter States
  const [orderDatePreset, setOrderDatePreset] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom'>('all');
  const [orderStartDate, setOrderStartDate] = useState<string>('');
  const [orderEndDate, setOrderEndDate] = useState<string>('');
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const [ordersPerPage, setOrdersPerPage] = useState<number>(10);

  // Sales Stats Date Filter & Metrics States
  const [statsDatePreset, setStatsDatePreset] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'single' | 'custom'>('all');
  const [statsSingleDate, setStatsSingleDate] = useState<string>('');
  const [statsStartDate, setStatsStartDate] = useState<string>('');
  const [statsEndDate, setStatsEndDate] = useState<string>('');
  const [statsStatusMode, setStatsStatusMode] = useState<'valid' | 'all' | 'delivered'>('valid');
  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
  const [statsOrdersCurrentPage, setStatsOrdersCurrentPage] = useState<number>(1);
  const [statsOrdersPerPage, setStatsOrdersPerPage] = useState<number>(10);
  const [statsExpandedOrderId, setStatsExpandedOrderId] = useState<string | null>(null);

  // New product editing/adding form
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Success Bubble Notification
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Fly-to-cart Star Animation State
  const [flyingParticles, setFlyingParticles] = useState<Array<{
    id: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  }>>([]);
  const [isCartBouncing, setIsCartBouncing] = useState<boolean>(false);

  // Product Details Modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState<boolean>(false);


  // ----------------------------------------------------
  // URL Routing Sync
  // ----------------------------------------------------
  
  // 1. Sync State -> URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      let changed = false;

      // Sync Tab
      if (currentTab === 'home') {
        if (url.searchParams.has('tab')) {
          url.searchParams.delete('tab');
          changed = true;
        }
      } else {
        if (url.searchParams.get('tab') !== currentTab) {
          url.searchParams.set('tab', currentTab);
          changed = true;
        }
      }

      // Sync Category
      if (currentTab === 'products' && activeCategory !== 'all') {
        if (url.searchParams.get('category') !== activeCategory) {
          url.searchParams.set('category', activeCategory);
          changed = true;
        }
      } else {
        if (url.searchParams.has('category')) {
          url.searchParams.delete('category');
          changed = true;
        }
      }

      // Sync Product Modal
      if (isProductDetailsOpen && selectedProductDetails) {
        if (url.searchParams.get('product') !== selectedProductDetails.id) {
          url.searchParams.set('product', selectedProductDetails.id);
          changed = true;
        }
      } else if (selectedProductDetails) {
        if (url.searchParams.has('product')) {
          url.searchParams.delete('product');
          changed = true;
        }
      }

      if (changed) {
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentTab, activeCategory, isProductDetailsOpen, selectedProductDetails]);

  // 2. Sync URL -> State (Initial Load only for Tab and Category)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const category = params.get('category');
      const productId = params.get('product');
      
      if (productId) {
        setCurrentTab('products');
      } else if (tab === 'products' || tab === 'offers' || tab === 'about' || tab === 'complaints') {
        setCurrentTab(tab as any);
      }
      
      if (category) {
        setActiveCategory(category);
      }
    }
  }, []);

  // Listen to pending complaints count for admin badge
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

  // 3. Sync URL -> State (Initial Load for Product after products are loaded)
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
  // Active Categories listening
  useEffect(() => {
    const categoriesRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const list: Category[] = [];
      const seenKeys = new Set<string>();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Category, 'id'>;
        if (!seenKeys.has(data.key)) {
          seenKeys.add(data.key);
          list.push({
            id: docSnap.id,
            ...data
          });
        } else {
          // Auto-heal by deleting duplicates in the background!
          deleteDoc(doc(db, 'categories', docSnap.id)).catch(console.error);
        }
      });
      setCategories(list);
    }, (error) => {
      console.error("Error listening to categories:", error);
    });

    return () => unsubscribe();
  }, []);

  // Read Products from Firestore
  useEffect(() => {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Product, 'id'>)
        });
      });
      setProducts(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to products:", error);
      setLoading(false);
    });

    // Load Cart
    const savedCart = localStorage.getItem('clean_minimal_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    return () => unsubscribe();
  }, []);

  // Read Offers from Firestore
  useEffect(() => {
    const offersRef = collection(db, 'offers');
    const unsubscribe = onSnapshot(offersRef, (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Offer, 'id'>)
        });
      });
      setOffers(list);
      setOffersLoading(false);
    }, (error) => {
      console.error("Error listening to offers:", error);
      setOffersLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Safe Seeding effect for authenticating Managers
  useEffect(() => {
    const checkAndSeed = async () => {
      const isManager = user?.email === 'jalalmahmoud8000%40gmail.com' || user?.email === 'jalalmahmoud8000@gmail.com' || userRole === 'manager' || userRole === 'admin';
      if (!isManager) return;

      try {
        // Categories seeding
        const categoriesRef = collection(db, 'categories');
        const catSnap = await getDocs(categoriesRef);
        

        // Products seeding
        const productsRef = collection(db, 'products');
        const prodSnap = await getDocs(productsRef);
        
      } catch (error) {
        console.error('Error during manager seeding check:', error);
      }
    };

    if (user || userRole === 'manager' || userRole === 'admin') {
      checkAndSeed();
    }
  }, [user, userRole]);

  // Sync Merchant Portal list
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
        // Sort latest orders first
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

  // Sync App Users for Admin
  useEffect(() => {
    if (userRole === 'admin') {
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
  }, [userRole]);

  // Cart operations helpers
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('clean_minimal_cart', JSON.stringify(newCart));
  };

  const triggerFlyAnimation = (e?: React.MouseEvent) => {
    if (typeof window === 'undefined') return;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (e && typeof e.clientX === 'number' && e.clientX > 0) {
      startX = e.clientX;
      startY = e.clientY;
    } else if (e && e.currentTarget && typeof (e.currentTarget as HTMLElement).getBoundingClientRect === 'function') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    const cartEl = document.getElementById('cart-trigger-btn');
    let targetX = window.innerWidth - 45;
    let targetY = 35;
    if (cartEl) {
      const rect = cartEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const particleId = Date.now() + Math.random();
    setFlyingParticles(prev => [...prev, { id: particleId, startX, startY, targetX, targetY }]);

    // Trigger cart bounce upon particle arrival
    setTimeout(() => {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 450);
    }, 600);

    // Clean up particle
    setTimeout(() => {
      setFlyingParticles(prev => prev.filter(p => p.id !== particleId));
    }, 850);
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    triggerFlyAnimation(e);
    const wasCartEmpty = cart.length === 0;
    const existingIdx = cart.findIndex(item => item.product.id === product.id);
    let newCart = [...cart];
    if (existingIdx > -1) {
      newCart[existingIdx].quantity += 1;
    } else {
      newCart.push({ product, quantity: 1 });
    }
    saveCart(newCart);

    // Toast
    setAddedItemName(product.name);
    setTimeout(() => setAddedItemName(null), 2500);

    // Open cart drawer only when adding the very first item to alert the user
    if (wasCartEmpty) {
      setIsCartOpen(true);
    }

    // Meta Pixel AddToCart event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'EGP'
      });
    }

    // TikTok Pixel AddToCart event
    if (typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.track('AddToCart', {
        content_id: product.id,
        content_name: product.name,
        content_type: 'product',
        quantity: 1,
        price: product.price,
        value: product.price,
        currency: 'EGP'
      });
    }
  };

  const handleAddOfferToCart = (offer: Offer, e?: React.MouseEvent) => {
    triggerFlyAnimation(e);
    const wasCartEmpty = cart.length === 0;
    const offerProductId = `offer-${offer.id}`;
    const offerPseudoProduct: Product = {
      id: offerProductId,
      name: `باقة: ${offer.title}`,
      code: offer.code || '',
      description: offer.description,
      price: offer.offerPrice,
      category: 'offers',
      image: offer.image || (offer.items && offer.items.length > 0 ? offer.items[0].image || '' : ''),
      volume: `${(offer.items || []).reduce((sum, it) => sum + it.quantity, 0)} قطع`,
      isAvailable: offer.isAvailable,
      rating: 5,
      reviewsCount: 1
    };

    const existingIdx = cart.findIndex(item => item.product.id === offerProductId);
    let newCart = [...cart];
    if (existingIdx > -1) {
      newCart[existingIdx].quantity += 1;
    } else {
      newCart.push({
        product: offerPseudoProduct,
        quantity: 1,
        isOffer: true,
        offerDetails: {
          offerId: offer.id,
          items: (offer.items || []).map(it => {
            const prod = products.find(p => p.id === it.productId);
            return {
              ...it,
              productCode: it.productCode || prod?.code || ''
            };
          }),
          originalPrice: offer.originalPrice,
          offerPrice: offer.offerPrice,
          savings: offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice),
          isFreeShipping: Boolean(offer.isFreeShipping)
        }
      });
    }
    saveCart(newCart);

    // Toast
    setAddedItemName(`باقة: ${offer.title}`);
    setTimeout(() => setAddedItemName(null), 2500);

    // Open cart drawer only when adding the very first item to alert the user
    if (wasCartEmpty) {
      setIsCartOpen(true);
    }

    // Meta Pixel AddToCart event for offers
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: `باقة: ${offer.title}`,
        content_ids: [offer.id],
        content_type: 'product',
        value: offer.offerPrice,
        currency: 'EGP'
      });
    }

    // TikTok Pixel AddToCart event for offers
    if (typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.track('AddToCart', {
        content_id: offer.id,
        content_name: `باقة: ${offer.title}`,
        content_type: 'product',
        quantity: 1,
        price: offer.offerPrice,
        value: offer.offerPrice,
        currency: 'EGP'
      });
    }
  };

  const handleCopyLink = (productId: string) => {
    const url = `${window.location.origin}?tab=products&product=${productId}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(productId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleUpdateQty = (productId: string, diff: number) => {
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        const updated = item.quantity + diff;
        return { ...item, quantity: updated < 1 ? 1 : updated };
      }
      return item;
    });
    saveCart(newCart);
  };

  const handleRemoveItem = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    saveCart(newCart);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  // Check if any offer currently in cart has free shipping enabled
  const hasFreeShippingOffer = useMemo(() => {
    return cart.some(item => {
      if (!item.isOffer) return false;
      if (item.offerDetails?.isFreeShipping) return true;
      const offerId = item.offerDetails?.offerId || item.product.id.replace('offer-', '');
      const matchedOffer = offers.find(o => o.id === offerId);
      return matchedOffer?.isFreeShipping === true;
    });
  }, [cart, offers]);

  // Dynamic shipping cost calculation based on chosen city and parcel weight
  const cartTotalWeight = calculateCartTotalWeight(cart);
  const shippingCalculation = checkoutForm.city
    ? calculateShipping(checkoutForm.city, cartTotalWeight)
    : null;
  const rawShippingCost = shippingCalculation ? shippingCalculation.shippingCost : 0;
  const currentShippingCost = hasFreeShippingOffer
    ? 0
    : rawShippingCost;
  const checkoutGrandTotal = getSubtotal() + currentShippingCost;

  // Real-time listener for the logged-in user's or guest device orders
  useEffect(() => {
    setIsTrackingLoading(true);
    if (user) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Order, 'id'>)
          });
        });
        list.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setUserOrders(list);
        setIsTrackingLoading(false);
      }, (error) => {
        console.error("Error listening to user orders:", error);
        setIsTrackingLoading(false);
      });

      return () => unsubscribe();
    } else {
      // For guest visitors, load their local saved orders from Firestore
      const loadGuestOrders = async () => {
        try {
          const guestOrderIds: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
          if (guestOrderIds.length === 0) {
            setUserOrders([]);
            setIsTrackingLoading(false);
            return;
          }
          const loaded: Order[] = [];
          for (const orderId of guestOrderIds) {
            try {
              const snap = await getDoc(doc(db, 'orders', orderId));
              if (snap.exists()) {
                loaded.push({
                  id: snap.id,
                  ...(snap.data() as Omit<Order, 'id'>)
                });
              }
            } catch (err) {
              console.warn("Could not fetch guest order:", orderId);
            }
          }
          loaded.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
          setUserOrders(loaded);
        } catch (e) {
          console.error("Error loading guest orders:", e);
        } finally {
          setIsTrackingLoading(false);
        }
      };
      loadGuestOrders();
    }
  }, [user, successOrder, isTrackerOpen]);

  // Google Auth Sign-In and Sign-Out Handlers
  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      setUser(loggedUser);
      setIsAuthModalOpen(false);
      
      // Save profile to users collection in Firestore
      const userRef = doc(db, 'users', loggedUser.uid);
      const isAdminEmail = isUserMasterAdmin(loggedUser.email);
      
      const snap = await getDoc(userRef);
      let finalRole = isAdminEmail ? 'admin' : 'user';
      if (snap.exists()) {
        finalRole = snap.data().role || finalRole;
      }
      if (isAdminEmail) {
        finalRole = 'admin'; // Always override master admin email
      }

      await setDoc(userRef, {
        email: loggedUser.email || '',
        name: loggedUser.displayName || 'عميل Gold Clean',
        photoURL: loggedUser.photoURL || '',
        role: finalRole,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // If whitelisted manager or admin, log into manager section too
      if (finalRole === 'manager' || finalRole === 'admin') {
        setIsMerchantAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-blocked') {
        setAuthError('بسبب قيود الإطار (iFrame) في البيئة التجريبية، تم منع النافذة المنبثقة من جوجل. لتبسيط وتأكيد خطوتك بأمان الكامل، يرجى الضغط على زر "فتح المتجر في نافذة مستقلة/جديدة" أعلى اليمين في واجهة AI Studio لتجربة خالية تماماً من قيود الأطر وسريعة.');
      } else {
        setAuthError('فشل تسجيل الدخول: ' + (err.message || 'يرجى المحاولة مجدداً'));
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole('user');
      setIsMerchantAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRateProduct = async (product: Product, ratingValue: number) => {
    try {
      const raterId = user ? user.uid : (typeof window !== 'undefined' ? (localStorage.getItem('goldclean_device_id') || (() => {
        const newId = 'dev_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('goldclean_device_id', newId);
        return newId;
      })()) : 'guest_rater');
      
      const productRef = doc(db, 'products', product.id);
      const newMap = { ...(product.ratingsMap || {}) };
      newMap[raterId] = ratingValue;
      
      const values = Object.values(newMap);
      const newCount = values.length;
      const newAverage = values.reduce((a, b) => a + b, 0) / newCount;
      
      const finalRating = Number(newAverage.toFixed(1));
      
      await updateDoc(productRef, {
        ratingsMap: newMap,
        rating: finalRating,
        reviewsCount: newCount
      });
      
      if (selectedProductDetails && selectedProductDetails.id === product.id) {
        setSelectedProductDetails({ ...product, ratingsMap: newMap, rating: finalRating, reviewsCount: newCount });
      }
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء حفظ التقييم');
    }
  };

  // Submit checkout order (open to both guests and admins seamlessly)
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutForm.city) {
      alert('يرجى اختيار المحافظة / المدينة لتحديد قيمة الشحن بدقة قبل تأكيد الطلب.');
      return;
    }
    setOrderInProgress(true);

    try {
      const cleanPhone = sanitizeEgyptianPhone(checkoutForm.phone, checkoutForm.phone);
      const guestEmail = user?.email || (cleanPhone ? `${cleanPhone}@guest.store` : 'guest@goldclean.store');
      const itemsSubtotal = getSubtotal();
      const currentCartWeight = calculateCartTotalWeight(cart);
      const shipCalc = calculateShipping(checkoutForm.city, currentCartWeight);
      const calculatedShipCost = hasFreeShippingOffer 
        ? 0 
        : (shipCalc ? shipCalc.shippingCost : 0);
      const finalGrandTotal = itemsSubtotal + calculatedShipCost;

      const orderPayload: Order = {
        customerName: checkoutForm.name,
        customerPhone: cleanPhone,
        customerCountry: checkoutForm.country || 'مصر',
        customerCity: checkoutForm.city,
        customerAddress: checkoutForm.address,
        notes: checkoutForm.notes,
        items: cart.map(item => {
          let code = item.product.code || '';
          if (!code) {
            const matchingProduct = products.find(p => p.id === item.product.id);
            if (matchingProduct?.code) code = matchingProduct.code;
            const matchingOffer = offers.find(o => `offer-${o.id}` === item.product.id || o.id === item.product.id);
            if (matchingOffer?.code) code = matchingOffer.code;
          }

          let bundleItems: Array<{ productId: string; productName: string; productCode?: string; quantity: number }> | undefined = undefined;
          if (item.isOffer && item.offerDetails?.items && item.offerDetails.items.length > 0) {
            bundleItems = item.offerDetails.items.map(sub => {
              const matchedProd = products.find(p => p.id === sub.productId);
              return {
                productId: sub.productId,
                productName: sub.productName,
                productCode: sub.productCode || matchedProd?.code || '',
                quantity: sub.quantity
              };
            });
          }

          return {
            productId: item.product.id,
            productName: item.product.name,
            productCode: code,
            quantity: item.quantity,
            price: item.product.price,
            isOffer: Boolean(item.isOffer),
            ...(bundleItems && bundleItems.length > 0 ? { bundleItems } : {})
          };
        }),
        subtotal: itemsSubtotal,
        shippingCost: calculatedShipCost,
        shippingZone: hasFreeShippingOffer 
          ? `${shipCalc?.zone.name || 'شحن مجاني'} (عرض شحن مجاني)` 
          : (shipCalc?.zone.name || ''),
        shippingWeight: currentCartWeight,
        totalPrice: finalGrandTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user ? user.uid : 'guest',
        customerEmail: guestEmail
      };

      // 1. Generate unique order reference and ID in memory and record order in Firestore
      const orderDocRef = doc(collection(db, 'orders'));
      const generatedOrderId = orderDocRef.id;

      // 2. Transmit to Bosta Shipping Logistics API (if configured)
      try {
        const shippingRes = await fetch('/api/shipping/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: generatedOrderId,
            customerName: checkoutForm.name,
            customerPhone: cleanPhone,
            customerCity: checkoutForm.city,
            customerAddress: checkoutForm.address,
            customerEmail: guestEmail,
            notes: checkoutForm.notes,
            items: orderPayload.items,
            totalPrice: orderPayload.totalPrice,
            weight: currentCartWeight
          })
        });
        const shippingData = await shippingRes.json();
        if (shippingData && (shippingData.trackingNumber || shippingData.billCode || shippingData.success)) {
          const tracking = shippingData.trackingNumber || shippingData.billCode || '';
          const shippingInfoData: ShippingInfo = {
            billCode: tracking,
            trackingNumber: tracking,
            deliveryId: shippingData.deliveryId || tracking,
            courier: 'Bosta',
            status: shippingData.state || 'created',
            txlogisticId: generatedOrderId,
            syncedAt: new Date().toISOString()
          };
          orderPayload.shippingInfo = shippingInfoData;
        }
      } catch (shippingErr) {
        console.warn('Bosta Shipping API sync during checkout:', shippingErr);
      }

      await setDoc(orderDocRef, orderPayload);

      // Save order reference in localStorage for guest tracking
      if (!user && typeof window !== 'undefined') {
        const guestOrders: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
        if (!guestOrders.includes(generatedOrderId)) {
          guestOrders.unshift(generatedOrderId);
          localStorage.setItem('goldclean_guest_orders', JSON.stringify(guestOrders.slice(0, 30)));
        }
      }

      // Track Meta Pixel Purchase event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          content_type: 'product',
          contents: orderPayload.items.map(it => ({
            id: it.productId,
            quantity: it.quantity,
            item_price: it.price
          })),
          value: orderPayload.totalPrice,
          currency: 'EGP',
          num_items: orderPayload.items.reduce((sum, it) => sum + it.quantity, 0)
        });
      }

      // Track TikTok Pixel CompletePayment event
      if (typeof window !== 'undefined' && (window as any).ttq) {
        (window as any).ttq.track('CompletePayment', {
          content_type: 'product',
          contents: orderPayload.items.map(it => ({
            content_id: it.productId,
            content_name: it.productName,
            quantity: it.quantity,
            price: it.price
          })),
          value: orderPayload.totalPrice,
          currency: 'EGP'
        });
      }

      setSuccessOrder({ ...orderPayload, id: generatedOrderId });
      saveCart([]);
      setCheckoutForm({
        name: user?.displayName || '',
        phone: '',
        country: 'مصر',
        city: '',
        address: '',
        notes: ''
      });
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء رفع الطلب لقاعدة البيانات.');
    } finally {
      setOrderInProgress(false);
    }
  };

  // Move all pending orders to preparing status in bulk
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

  // Merchant Log (Bypassed if logged in via Manager Gmail account)
  const handleMerchantAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'manager' || userRole === 'admin') {
      setIsMerchantAuthenticated(true);
    } else {
      alert('هذا الحساب ليس لديه صلاحيات المندوب المشرف في قاعدة البيانات.');
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

  // Add/Modify products
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

  // Offer CRUD & Multi-Product Bundle Handlers
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

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserCancelOrder = async (order: Order) => {
    if (!order.id) return;
    try {
      // 1. Update order status to 'cancelled'
      await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled' });
      
      alert('تم إلغاء طلبك بنجاح.');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إلغاء الطلب. الرجاء المحاولة مرة أخرى.');
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
      alert(
        `⛔ هذا الطلب تم تسليمه للعميل مسبقاً.\n\n` +
        `رقم شحنة بوسطة: ${existingCode || 'مسجل'}`
      );
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
    let failCount = 0;
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
          failCount++;
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
        failCount++;
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

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return 'تاريخ غير محدد';
    try {
      let date: Date;
      if (typeof createdAt?.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt?.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else if (createdAt?._seconds) {
        date = new Date(createdAt._seconds * 1000);
      } else {
        date = new Date(createdAt);
      }
      if (isNaN(date.getTime())) return 'تاريخ غير محدد';
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'تاريخ غير محدد';
    }
  };

  const getOrderDateObj = (createdAt: any): Date | null => {
    if (!createdAt) return null;
    try {
      let date: Date;
      if (typeof createdAt?.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt?.seconds !== undefined) {
        date = new Date(createdAt.seconds * 1000);
      } else if (createdAt?._seconds !== undefined) {
        date = new Date(createdAt._seconds * 1000);
      } else {
        date = new Date(createdAt);
      }
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Filter orders matching selected date & mode for deletion
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
      // Status filter
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

  // Execute bulk deletion of matched orders
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
        `🔒 تأكيد إضافي لحماية البيانات:\n\n` +
        `لتأكيد حذف (${ordersToDelete.length}) طلب نهائياً، اكتب كلمة "حذف" في المربع أدناه:`
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
        `✅ اكتملت عملية الحذف بنجاح!\n\n` +
        `تم مسح (${deletedCount}) طلب نهائياً من قاعدة البيانات.` +
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

  // Export orders to Excel (CSV with UTF-8 BOM for native Arabic support in Microsoft Excel)
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

    // Helper to format order items with real product names & quantities
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
      // Strictly 3 columns format
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

    // Construct CSV with UTF-8 BOM (\uFEFF)
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

  // Order status counts for Admin (scoped to active date period if filtered)
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

  // Admin filtered orders by status, date range, and search query
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

  // Reset pagination page when filters change
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [adminOrderFilter, adminOrderSearch, orderStartDate, orderEndDate, ordersPerPage]);

  // Orders Pagination calculations
  const totalOrders = filteredOrders.length;
  const totalOrderPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));
  const validOrderPage = Math.min(Math.max(1, ordersCurrentPage), totalOrderPages);
  const startIndex = (validOrderPage - 1) * ordersPerPage;
  const endIndex = Math.min(startIndex + ordersPerPage, totalOrders);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex]);

  // Resend / Recreate shipping waybills for all orders currently displayed on the pagination page
  const handleResendPaginatedOrdersToShipping = async () => {
    if (paginatedOrders.length === 0) {
      alert('لا توجد أي طلبات معروضة في الصفحة الحالية لإعادة إرسالها!');
      return;
    }

    // Exclude delivered and cancelled orders to protect processed orders
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

    let successCount = 0;
    let failCount = 0;
    const failedList: Array<{
      orderId: string;
      customerName: string;
      customerPhone: string;
      customerCity: string;
      customerAddress: string;
      totalPrice: number;
      error: string;
    }> = [];

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
          successCount++;
        } else {
          failCount++;
          const reason = data.error || data.msg || 'فشل غير محدد من شركة الشحن';
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
        failCount++;
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

    setIsResendingPageOrders(false);
    setResendPageProgress(null);

    if (failedList.length > 0) {
      setFailedSyncOrders(failedList);
      setIsFailedOrdersModalOpen(true);
      alert(
        `⚠️ اكتملت عملية إعادة الإرسال لطلبات الصفحة:\n\n` +
        `✅ نجح إرسال: ${successCount} طلب\n` +
        `❌ تعثر إرسال: ${failCount} طلب (تم فتح سجل المشكلات لمعاينتها).`
      );
    } else {
      alert(`🏁 اكتملت إعادة إرسال طلبات الصفحة بنجاح تام!\n\n✅ تم إرسال وتحديث بوالص الشحن لجميع طلبات الصفحة (${successCount}) لدى شركة بوسطة.`);
    }
  };

  // Filter computation
  const filteredProducts = products.filter((prod) => {
    const searchMatch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeCategory === 'all' || prod.category === activeCategory;
    const priceMatch = priceRange === 0 || prod.price <= priceRange;
    return searchMatch && categoryMatch && priceMatch;
  });

  // Calculate high-fidelity metrics
  const totalSalesValue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const activeOrdersCount = allOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  // Stats Tab: Orders filtered by selected date or date range
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

  // Comprehensive sales metrics for the selected date / period
  const statsMetrics = useMemo(() => {
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
    const totalActiveRevenue = statsDateScopedOrders
      .filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'shipping')
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const totalItemsCount = validOrders.reduce((sum, o) => {
      return sum + (o.items?.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 1), 0) || 0);
    }, 0);

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

      totalSalesValid,
      totalSalesAll,
      totalDeliveredRevenue,
      totalCancelledRevenue,
      totalActiveRevenue,
      totalItemsCount,

      displayCount,
      displayRevenue,
      displayModeLabel,
      avgOrderValue,

      pendingRevenue: pendingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
      preparingRevenue: preparingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
      shippingRevenue: shippingOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
    };
  }, [statsDateScopedOrders, statsStatusMode]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setStatsOrdersCurrentPage(1);
  }, [statsStartDate, statsEndDate, statsStatusMode, statsSearchQuery, statsOrdersPerPage]);

  // Orders displayed in the stats detailed list
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

  const seoStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.filter(p => p.isAvailable).map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": p.seoTitle || p.name,
        "description": p.seoDescription || p.description,
        "image": p.image,
        "keywords": p.seoKeywords || undefined,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EGP",
          "price": p.price,
          "availability": "https://schema.org/InStock"
        }
      }
    }))
  };


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoStructuredData) }}
      />
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800" id="main-app">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {addedItemName && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3"
            id="toast-added"
          >
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Check className="w-3 h-3" />
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400">تمت الإضافة للسلة</p>
              <p className="text-xs font-bold text-slate-800 line-clamp-1">{addedItemName}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* HEADER SECTION (CLEAN MINIMALISM THEME) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMerchantOpen={isMerchantOpen}
        setIsMerchantOpen={setIsMerchantOpen}
        pendingComplaintsCount={pendingComplaintsCount}
        userOrdersCount={userOrders.length}
        userRole={userRole}
        checkingAuth={checkingAuth}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        isCartBouncing={isCartBouncing}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onResetCategory={() => setActiveCategory('all')}
      />

      {/* Hero promo ribbon bar */}
      {isMerchantOpen ? (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-2.5 px-6 text-center text-xs font-semibold flex items-center justify-between gap-4" id="admin-ribbon">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-100" />
            <span>لوحة التحكم الإدارية لمتجر Gold Clean - إدارة المنتجات والمبيعات والطلبيات المباشرة</span>
          </div>
          <button 
            onClick={() => setIsMerchantOpen(false)}
            className="bg-white/10 hover:bg-white/20 px-3.5 py-1 rounded-lg text-white font-bold transition-all text-[11px] cursor-pointer"
            dir="rtl"
          >
            العودة لواجهة المتجر واستعراض المنتجات ←
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2" id="promo-ribbon">
          <Sparkles className="w-3.5 h-3.5" />
          <span>توصيل سريع ومتميز لكافة الدول العربية ومصر!</span>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex overflow-hidden relative" id="layout-body">
        {isMerchantOpen ? (
          <MerchantPortal
            isMerchantAuthenticated={isMerchantAuthenticated}
            user={user}
            handleGoogleSignIn={handleGoogleSignIn}
            userRole={userRole}
            setIsMerchantOpen={setIsMerchantOpen}
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
            categoryToDelete={categoryToDelete}
            setCategoryToDelete={setCategoryToDelete}
            isCategoryFormOpen={isCategoryFormOpen}
            setIsCategoryFormOpen={setIsCategoryFormOpen}

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
        ) : currentTab === 'home' ? (
          <HomeView
            categories={categories}
            setActiveCategory={setActiveCategory}
            setCurrentTab={setCurrentTab}
            offers={offers}
            products={products}
            onAddOfferToCart={handleAddOfferToCart}
          />
        ) : currentTab === 'about' ? (
          <AboutView />
        ) : currentTab === 'offers' ? (
          <OffersView
            offers={offers}
            products={products}
            setCurrentTab={setCurrentTab}
            onAddOfferToCart={handleAddOfferToCart}
          />
        ) : currentTab === 'complaints' ? (
          <ComplaintsSection
            user={user}
            userOrders={userOrders}
            prefilledOrderId={complaintPrefilledOrderId}
            onClearPrefilledOrder={() => setComplaintPrefilledOrderId(null)}
            onGoToProducts={() => { setCurrentTab('products'); }}
          />
        ) : (
          <ProductsView
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            loading={loading}
            filteredProducts={filteredProducts}
            onSelectProduct={(p) => {
              setSelectedProductDetails(p);
              setIsProductDetailsOpen(true);
            }}
            onAddToCart={handleAddToCart}
            copiedLinkId={copiedLinkId}
            onCopyLink={handleCopyLink}
          />
        )}
      </main>

      {/* Mobile bottom navigation bar */}
      <MobileBottomNav
        isMerchantOpen={isMerchantOpen}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        setIsMerchantOpen={setIsMerchantOpen}
        userOrdersCount={userOrders.length}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        userRole={userRole}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        offers={offers}
        hasFreeShippingOffer={hasFreeShippingOffer}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        subtotal={getSubtotal()}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        successOrder={successOrder}
        setSuccessOrder={setSuccessOrder}
        user={user}
        userRole={userRole}
        checkoutForm={checkoutForm}
        setCheckoutForm={setCheckoutForm}
        isShippingRatesOpen={isShippingRatesOpen}
        setIsShippingRatesOpen={setIsShippingRatesOpen}
        cart={cart}
        subtotal={getSubtotal()}
        shippingCalculation={shippingCalculation}
        hasFreeShippingOffer={hasFreeShippingOffer}
        currentShippingCost={currentShippingCost}
        checkoutGrandTotal={checkoutGrandTotal}
        orderInProgress={orderInProgress}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isProductDetailsOpen}
        onClose={() => {
          setIsProductDetailsOpen(false);
          setSelectedProductDetails(null);
        }}
        product={selectedProductDetails}
        categories={categories}
        user={user}
        onRateProduct={handleRateProduct}
        onAddToCart={handleAddToCart}
        onCopyLink={handleCopyLink}
        copiedLinkId={copiedLinkId}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        authError={authError}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        userOrders={userOrders}
        isTrackingLoading={isTrackingLoading}
        userOrdersTab={userOrdersTab}
        setUserOrdersTab={setUserOrdersTab}
        onGoToProducts={() => {
          setIsTrackerOpen(false);
          setCurrentTab('products');
        }}
        onFileComplaint={(orderId) => {
          setIsTrackerOpen(false);
          setComplaintPrefilledOrderId(orderId);
          setCurrentTab('complaints');
        }}
        onCancelOrder={handleUserCancelOrder}
      />

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

      {/* Packing Slip Modal */}
      <PackingSlipModal
        order={packingSlipOrder}
        onClose={() => setPackingSlipOrder(null)}
        offers={offers}
        products={products}
        formatOrderDate={formatOrderDate}
      />

      {/* Fly to Cart Animated Particles */}
      <FlyToCartParticles particles={flyingParticles} />

    </div>
    </>
  );
}
