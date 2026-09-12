'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShoppingCart, 
  Search, 
  Filter, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  ShieldCheck, 
  Package, 
  Truck, 
  CheckCircle, 
  ShoppingBag, 
  Settings, 
  X, 
  MapPin, 
  Phone, 
  User, 
  Edit, 
  PlusCircle, 
  Notebook, 
  Trash,
  Check,
  TrendingUp,
  Banknote,
  ChevronDown,
  ChevronUp,
  Droplet,
  Tag,
  LayoutGrid,
  Star,
  Users,
  Link2,
  Flame,
  Percent,
  Send,
  RefreshCw,
  Info
} from 'lucide-react';
import { db, auth, googleProvider } from '../lib/firebase';
import {
  calculateShipping,
  calculateCartTotalWeight,
  SHIPPING_ZONES,
  getZoneByCity
} from '../lib/shipping';
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
  Timestamp,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Define structures
interface Category {
  id?: string;
  name: string;
  key: string;
}

interface Product {
  id: string;
  name: string;
  code?: string;
  description: string;
  price: number;
  category: string;
  image: string;
  volume: string;
  isAvailable: boolean;
  rating: number;
  reviewsCount: number;
  ratingsMap?: Record<string, number>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

interface OfferItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  volume?: string;
}

interface Offer {
  id: string;
  title: string;
  code?: string;
  description: string;
  items: OfferItem[];
  originalPrice: number;
  offerPrice: number;
  savings: number;
  image?: string;
  badge?: string;
  isAvailable: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface CartItem {
  product: Product;
  quantity: number;
  isOffer?: boolean;
  offerDetails?: {
    offerId: string;
    items: OfferItem[];
    originalPrice: number;
    offerPrice: number;
    savings: number;
  };
}

interface ShippingInfo {
  billCode?: string;
  sortingCode?: string;
  courier?: string;
  status?: string;
  txlogisticId?: string;
  syncedAt?: any;
  error?: string;
}

interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string;
  customerCity: string;
  customerAddress: string;
  notes: string;
  items: Array<{
    productId: string;
    productName: string;
    productCode?: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  shippingCost?: number;
  shippingZone?: string;
  shippingWeight?: number;
  totalPrice: number;
  status: 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: any;
  userId?: string;
  customerEmail?: string;
  shippingInfo?: ShippingInfo;
}

// Initial seed if Firebase collection is completely empt

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
        const isAdminEmail = currentUser.email === 'jalalmahmoud8000@gmail.com' || currentUser.email === 'jalalmahmoud8000%40gmail.com';
        
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
  const [currentTab, setCurrentTab] = useState<'home' | 'products' | 'offers' | 'about'>('home');

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
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

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
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'offers' | 'categories' | 'stats' | 'users'>('orders');
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'>('all');
  const [adminOrderSearch, setAdminOrderSearch] = useState<string>('');

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

  // Promo Welcome Modal (GC01 & GC02)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);

  // Auto-open promotional popup shortly after visitor lands on the website
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPromoModalOpen(true);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

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
      } else if (tab === 'products' || tab === 'offers' || tab === 'about') {
        setCurrentTab(tab);
      }
      
      if (category) {
        setActiveCategory(category);
      }
    }
  }, []);

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
    }, (error) => {
      console.error("Error listening to offers:", error);
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
          items: offer.items,
          originalPrice: offer.originalPrice,
          offerPrice: offer.offerPrice,
          savings: offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice)
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

  // Dynamic shipping cost calculation based on chosen city and parcel weight
  const cartTotalWeight = calculateCartTotalWeight(cart);
  const shippingCalculation = checkoutForm.city
    ? calculateShipping(checkoutForm.city, cartTotalWeight)
    : null;
  const currentShippingCost = shippingCalculation ? shippingCalculation.shippingCost : 0;
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
      const isAdminEmail = loggedUser.email === 'jalalmahmoud8000@gmail.com' || loggedUser.email === 'jalalmahmoud8000%40gmail.com';
      
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
      const guestEmail = user?.email || (checkoutForm.phone ? `${checkoutForm.phone.replace(/[^0-9]/g, '')}@guest.store` : 'guest@goldclean.store');
      const itemsSubtotal = getSubtotal();
      const currentCartWeight = calculateCartTotalWeight(cart);
      const shipCalc = calculateShipping(checkoutForm.city, currentCartWeight);
      const calculatedShipCost = shipCalc ? shipCalc.shippingCost : 0;
      const finalGrandTotal = itemsSubtotal + calculatedShipCost;

      const orderPayload: Order = {
        customerName: checkoutForm.name,
        customerPhone: checkoutForm.phone,
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
          return {
            productId: item.product.id,
            productName: item.product.name,
            productCode: code,
            quantity: item.quantity,
            price: item.product.price
          };
        }),
        subtotal: itemsSubtotal,
        shippingCost: calculatedShipCost,
        shippingZone: shipCalc?.zone.name || '',
        shippingWeight: currentCartWeight,
        totalPrice: finalGrandTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user ? user.uid : 'guest',
        customerEmail: guestEmail
      };

      // 1. Record order in Firestore
      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      // Save order reference in localStorage for guest tracking
      if (!user && typeof window !== 'undefined') {
        const guestOrders: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
        if (!guestOrders.includes(docRef.id)) {
          guestOrders.unshift(docRef.id);
          localStorage.setItem('goldclean_guest_orders', JSON.stringify(guestOrders.slice(0, 30)));
        }
      }

      // 2. Transmit to J&T Express Shipping Logistics API
      try {
        const shippingRes = await fetch('/api/shipping/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: docRef.id,
            customerName: checkoutForm.name,
            customerPhone: checkoutForm.phone,
            customerCity: checkoutForm.city,
            customerAddress: checkoutForm.address,
            notes: checkoutForm.notes,
            items: orderPayload.items,
            totalPrice: orderPayload.totalPrice,
            weight: currentCartWeight
          })
        });
        const shippingData = await shippingRes.json();
        if (shippingData && (shippingData.billCode || shippingData.success)) {
          const shippingInfoData: ShippingInfo = {
            billCode: shippingData.billCode || '',
            sortingCode: shippingData.sortingCode || '',
            courier: 'J&T Express',
            status: 'created',
            txlogisticId: shippingData.txlogisticId || docRef.id,
            syncedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'orders', docRef.id), {
            shippingInfo: shippingInfoData
          });
          orderPayload.shippingInfo = shippingInfoData;
        }
      } catch (shippingErr) {
        console.error('Shipping API sync during checkout error:', shippingErr);
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

      setSuccessOrder({ ...orderPayload, id: docRef.id });
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

  // Manual or Re-Sync order with J&T Express API
  const handleSyncOrderWithShipping = async (order: Order) => {
    if (!order.id) return;
    setSyncingOrderId(order.id);
    try {
      // Ensure each item has productCode (look up in products or offers if previously saved without code)
      const enrichedItems = (order.items || []).map(it => {
        if (it.productCode) return it;
        const matchingProduct = products.find(p => p.id === it.productId);
        if (matchingProduct?.code) return { ...it, productCode: matchingProduct.code };
        const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId);
        if (matchingOffer?.code) return { ...it, productCode: matchingOffer.code };
        return it;
      });

      const existingBillCode = order.shippingInfo?.billCode || '';
      const isModifying = !!existingBillCode;

      const res = await fetch('/api/shipping/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.shippingInfo?.txlogisticId || order.id,
          billCode: existingBillCode,
          operateType: isModifying ? 2 : 1,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerCity: order.customerCity,
          customerAddress: order.customerAddress,
          notes: order.notes,
          items: enrichedItems,
          totalPrice: order.totalPrice,
          weight: order.shippingWeight || 1
        })
      });
      const data = await res.json();
      if (data && (data.billCode || data.success)) {
        const returnedBillCode = data.billCode || existingBillCode;
        const shippingInfoData: ShippingInfo = {
          billCode: returnedBillCode || '',
          sortingCode: data.sortingCode || order.shippingInfo?.sortingCode || '',
          courier: 'J&T Express',
          status: 'created',
          txlogisticId: data.txlogisticId || order.shippingInfo?.txlogisticId || order.id,
          syncedAt: new Date().toISOString()
        };
        await updateDoc(doc(db, 'orders', order.id), {
          shippingInfo: shippingInfoData
        });
        if (isModifying) {
          alert(`تم تحديث بيانات الشحنة في J&T بنجاح دون تكرار!\nرقم البوليصة الثابت: ${returnedBillCode}`);
        } else {
          alert(`تم إرسال الطلب لشركة الشحن J&T Express بنجاح!\nرقم بوليصة الشحن والتتبع: ${returnedBillCode}`);
        }
      } else {
        alert(`رد شركة الشحن J&T Express: ${data.msg || data.error || 'لم يتم إصدار البوليصة'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بواجهة شركة الشحن J&T Express');
    } finally {
      setSyncingOrderId(null);
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
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Order status counts for Admin
  const orderCounts = {
    all: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    preparing: allOrders.filter(o => o.status === 'preparing').length,
    shipping: allOrders.filter(o => o.status === 'shipping').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  };

  // Admin filtered orders by status and search query
  const filteredOrders = allOrders.filter((ord) => {
    const statusMatch = adminOrderFilter === 'all' || ord.status === adminOrderFilter;
    const query = adminOrderSearch.trim().toLowerCase();
    if (!query) return statusMatch;
    const nameMatch = ord.customerName?.toLowerCase().includes(query);
    const phoneMatch = ord.customerPhone?.includes(query);
    const idMatch = ord.id?.toLowerCase().includes(query);
    const billCodeMatch = ord.shippingInfo?.billCode?.toLowerCase().includes(query);
    return statusMatch && (nameMatch || phoneMatch || idMatch || billCodeMatch);
  });

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

  // Matched Promo Product (GC02) and Promo Offer (GC01)
  const matchedPromoProduct = products.find(p => 
    (p.code && p.code.trim().toUpperCase() === 'GC02') ||
    (p.id && p.id.trim().toUpperCase() === 'GC02') ||
    (p.name && p.name.includes('GC02'))
  );

  const targetPromoProduct: Product = matchedPromoProduct || (products.length > 0 ? {
    ...products[0],
    code: products[0].code || 'GC02'
  } : {
    id: 'prod-gc02',
    name: 'منظف ومطهر جولد كلين الفاخر',
    code: 'GC02',
    description: 'تركيبة مركزة فائقة الفعالية تقضي على أصعب الدهون والأوساخ مع لمعان ناصع ورائحة انتعاش تدوم طويلاً.',
    price: 45.00,
    category: 'kitchen',
    image: 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600',
    volume: '1 لتر',
    isAvailable: true,
    rating: 5,
    reviewsCount: 148
  });

  const matchedPromoOffer = offers.find(o => 
    (o.code && o.code.trim().toUpperCase() === 'GC01') ||
    (o.id && o.id.trim().toUpperCase() === 'GC01') ||
    (o.title && o.title.includes('GC01'))
  );

  const targetPromoOffer: Offer = matchedPromoOffer || (offers.length > 0 ? {
    ...offers[0],
    code: offers[0].code || 'GC01'
  } : {
    id: 'offer-gc01',
    title: 'باقة التوفير الذهبية الشاملة',
    code: 'GC01',
    description: 'مجموعة التوفير المتكاملة لنظافة منزلية فائقة الجودة لكافة الأسطح والمفروشات مع خصم مباشر وسعر حصري.',
    items: [
      { productId: targetPromoProduct.id, productName: targetPromoProduct.name, quantity: 2, unitPrice: targetPromoProduct.price }
    ],
    originalPrice: 160,
    offerPrice: 119,
    savings: 41,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    badge: 'خصم خاص 🔥',
    isAvailable: true
  });

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
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0 sticky top-0 z-30" id="header-nav">
        <div className="flex items-center gap-8 md:gap-12">
          {/* Logo brand matching design html specs */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">G</span>
            <h1 className="text-lg font-bold tracking-tight text-amber-500 font-sans">
              GOLD<span className="text-slate-900">CLEAN</span>
              <span className="text-xs text-slate-400 font-normal mr-2 font-sans">جولد كلين</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <button 
              id="nav-home-btn"
              onClick={() => { setCurrentTab('home'); setIsMerchantOpen(false); }} 
              className={`${currentTab === 'home' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors`}
            >
              الرئيسية
            </button>
            <button 
              id="nav-products-btn"
              onClick={() => { setCurrentTab('products'); setIsMerchantOpen(false); setActiveCategory('all'); setSearchTerm(''); }} 
              className={`${currentTab === 'products' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors`}
            >
              منتجاتنا
            </button>
            <button 
              id="nav-offers-btn"
              onClick={() => { setCurrentTab('offers'); setIsMerchantOpen(false); }} 
              className={`relative flex items-center gap-1.5 ${currentTab === 'offers' && !isMerchantOpen ? 'text-rose-600 border-b-2 border-rose-600' : 'hover:text-rose-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors`}
            >
              <span>عروض التوفير</span>
              <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                خصومات 🔥
              </span>
            </button>
            <button 
              id="nav-about-btn"
              onClick={() => { 
                setCurrentTab('about'); 
                setIsMerchantOpen(false); 
                window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer'); 
              }} 
              className={`${currentTab === 'about' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors`}
            >
              عن الشركة
            </button>
            <button id="nav-tracker-btn" onClick={() => { setIsTrackerOpen(true); }} className="hover:text-slate-950 pt-1.5 pb-2.5 transition-colors">طلباتي ({userOrders.length})</button>
            {(userRole === 'manager' || userRole === 'admin') && (
              <button id="nav-admin-btn" onClick={() => { setIsMerchantOpen(true); }} className={`flex items-center gap-1.5 pt-1.5 pb-2.5 transition-colors ${isMerchantOpen ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-amber-600 border-b-2 border-transparent'}`}>
                <Settings className="w-4 h-4" />
                <span>إدارة المتجر ⚙️</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search inside Header */}
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              id="header-search"
              type="text" 
              placeholder="البحث السريع..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-full py-1.5 pr-9 pl-3 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
              dir="rtl"
            />
          </div>

          {/* Admin Sign In / Profile status on Header */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1" dir="rtl">
            {checkingAuth ? (
              <span className="text-[10px] text-slate-400">جاري التحقق...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-slate-200/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold font-mono">
                    {user.displayName ? user.displayName.charAt(0) : 'A'}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-right">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 leading-tight">
                    <span>{user.displayName?.split(' ')[0]}</span>
                    {userRole === 'admin' ? (
                      <span className="bg-rose-100 text-rose-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">المدير العام</span>
                    ) : userRole === 'manager' ? (
                      <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">مشرف المتجر</span>
                    ) : null}
                  </div>
                  <button onClick={handleSignOut} className="text-[9px] text-rose-500 hover:underline text-right leading-none mt-0.5 cursor-pointer">تسجيل الخروج</button>
                </div>
                <button onClick={handleSignOut} className="lg:hidden text-[10px] text-rose-400 font-bold hover:underline cursor-pointer">خروج</button>
              </div>
            ) : (
              <button 
                id="admin-portal-login-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                title="بوابة دخول الإدارة والمشرفين"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>دخول الإدارة</span>
              </button>
            )}
          </div>

          {/* Cart Icon in pure clean minimalist style with bounce animation */}
          <motion.button 
            id="cart-trigger-btn"
            onClick={() => setIsCartOpen(true)}
            animate={isCartBouncing ? { scale: [1, 1.35, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center relative cursor-pointer border border-slate-200/50 transition-all ${
              isCartBouncing ? 'ring-4 ring-amber-300 ring-offset-2' : ''
            }`}
          >
            <motion.span 
              animate={isCartBouncing ? { scale: [1, 1.45, 1] } : { scale: 1 }}
              className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-xs"
            >
              {cart.reduce((cnt, item) => cnt + item.quantity, 0)}
            </motion.span>
            <ShoppingCart className={`w-4.5 h-4.5 transition-colors ${isCartBouncing ? 'text-amber-600' : 'text-slate-700'}`} />
          </motion.button>
        </div>
      </header>

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
          // FULL PAGE STANDALONE ADMIN DASHBOARD
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
                        ولكن هذا الحساب ليس لديه صلاحيات "المندوب المشرف" في قاعدة البيانات.
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
                    ...(userRole === 'admin' ? [{ id: 'users', label: 'صلاحيات المستخدمين', icon: Users }] : [])
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-right transition-all font-bold ${
                        adminTab === tab.id 
                          ? 'bg-amber-50 text-amber-900 border-r-4 border-amber-500 shadow-xs' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <tab.icon className={`w-4 h-4 ${adminTab === tab.id ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
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
                    <div className="space-y-4">
                      {/* Header info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">الطلبات الواردة من العملاء</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">متابعة وتحديث حالات الطلبات وتواريخها والمزامنة مع شركة الشحن</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-100">
                            المعروض: {filteredOrders.length} من إجمالي {allOrders.length} طلبية
                          </span>
                        </div>
                      </div>

                      {/* Filter & Search Toolbar */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        {/* Search */}
                        <div className="relative max-w-md">
                          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="بحث باسم العميل، الهاتف، أو رقم الطلب..."
                            value={adminOrderSearch}
                            onChange={(e) => setAdminOrderSearch(e.target.value)}
                            className="w-full pl-8 pr-9 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          {adminOrderSearch && (
                            <button
                              onClick={() => setAdminOrderSearch('')}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 ml-1">تصفية حسب الحالة:</span>
                          {[
                            { id: 'all', label: 'الكل', count: orderCounts.all },
                            { id: 'pending', label: '⏳ معلق', count: orderCounts.pending },
                            { id: 'preparing', label: '⚙️ جاري التجهيز', count: orderCounts.preparing },
                            { id: 'shipping', label: '🛵 بالشحن', count: orderCounts.shipping },
                            { id: 'delivered', label: '✅ تم الاستلام', count: orderCounts.delivered },
                            { id: 'cancelled', label: '❌ ملغي', count: orderCounts.cancelled },
                          ].map((tab) => {
                            const isActive = adminOrderFilter === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setAdminOrderFilter(tab.id as any)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span>{tab.label}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {allOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                          <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-bounce" />
                          <p className="text-slate-400">لا يوجد برقيات أو طلبات لغسيل أو معقمات حتى الآن بقاعدة البيانات.</p>
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <p className="text-xs text-slate-500 font-bold">لا توجد طلبات تطابق الفلتر أو البحث الحالي.</p>
                          <button
                            onClick={() => {
                              setAdminOrderFilter('all');
                              setAdminOrderSearch('');
                            }}
                            className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            إعادة ضبط الفلاتر وعرض جميع الطلبات
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {filteredOrders.map((ord) => (
                            <div key={ord.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs relative space-y-4 hover:border-slate-200 transition-all">
                              
                              {/* Order Header: ID, Date, and Status Selector */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                    #{ord.id?.substring(0, 8).toUpperCase()}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>تاريخ الطلب: <strong className="text-slate-800 font-bold">{formatOrderDate(ord.createdAt)}</strong></span>
                                  </div>
                                </div>
                                <select 
                                  value={ord.status}
                                  onChange={(e) => handleUpdateStatus(ord.id!, e.target.value)}
                                  className="py-1 px-2.5 rounded-lg border border-slate-200 font-bold text-[10px] outline-none bg-slate-50 focus:bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                >
                                  <option value="pending">⏳ معلق في الانتظار</option>
                                  <option value="preparing">⚙️ جاري التجهيز</option>
                                  <option value="shipping">🛵 خرج مع المندوب</option>
                                  <option value="delivered">✅ تم الاستلام والمحاسبة</option>
                                  <option value="cancelled">❌ ملغي</option>
                                </select>
                              </div>

                              {/* Customer Information */}
                              <div>
                                <h5 className="font-bold text-slate-800 text-xs">العميل: {ord.customerName}</h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">الهاتف: {ord.customerPhone} • الدولة/المدينة: {ord.customerCountry ? ord.customerCountry + ' - ' : ''}{ord.customerCity}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">العنوان: {ord.customerAddress}</p>
                              </div>

                              <div className="bg-[#FAFBFD] p-3.5 rounded-xl border border-slate-100 space-y-1">
                                <p className="font-bold text-slate-700 text-[10px] mb-1.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  <span>تفاصيل مساحيق ومنظفات السلة:</span>
                                </p>
                                <ul className="space-y-1.5 text-slate-500 pr-3">
                                  {ord.items.map((it, idx) => {
                                    const codeDisplay = it.productCode || products.find(p => p.id === it.productId)?.code || offers.find(o => `offer-${o.id}` === it.productId)?.code;
                                    return (
                                      <li key={idx} className="flex justify-between items-center text-[11px] gap-2">
                                        <span className="flex items-center gap-1.5 flex-wrap">
                                          <span>• {it.productName} (الكمية: {it.quantity})</span>
                                          {codeDisplay && (
                                            <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                                              كود الشحن: {codeDisplay}
                                            </span>
                                          )}
                                        </span>
                                        <span className="font-mono text-slate-700 font-bold shrink-0">{it.price.toFixed(2)} جنيه</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                               {ord.notes && (
                                  <div className="text-rose-600 mt-2 text-[10px] bg-rose-50/50 p-2 rounded-lg border border-rose-100/30">
                                    <strong>ملاحظة العميل:</strong> {ord.notes}
                                  </div>
                                )}
                              </div>

                              {/* J&T Express Shipping Integration Section */}
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                                    <span>شركة الشحن J&T Express</span>
                                  </div>
                                  <button
                                    onClick={() => handleSyncOrderWithShipping(ord)}
                                    disabled={syncingOrderId === ord.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${syncingOrderId === ord.id ? 'animate-spin' : ''}`} />
                                    <span>{ord.shippingInfo?.billCode ? 'إعادة الإرسال / تحديث' : 'إرسال لشركة الشحن'}</span>
                                  </button>
                                </div>
                                {ord.shippingInfo?.billCode ? (
                                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-[10px]">
                                    <div className="space-y-0.5">
                                      <span className="text-emerald-800 font-bold block">رقم بوليصة الشحن (Waybill):</span>
                                      <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block">{ord.shippingInfo.billCode}</span>
                                    </div>
                                    {ord.shippingInfo.sortingCode && (
                                      <span className="text-emerald-700 font-mono text-[9px] bg-emerald-100/60 px-1.5 py-0.5 rounded">كود الفرز: {ord.shippingInfo.sortingCode}</span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400">لم يتم تأكيد بوليصة شحن لهذا الطلب بعد أو معلق للمزامنة.</p>
                                )}
                              </div>

                              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-50">
                                <div>
                                  <span className="font-extrabold text-blue-600 bg-blue-50/30 px-3 py-1 rounded-lg">الحساب الإجمالي: {ord.totalPrice.toFixed(2)} جنيه</span>
                                  {typeof ord.shippingCost === 'number' && (
                                    <span className="text-[10px] text-slate-400 block mt-1 pr-1">
                                      (المنتجات: {(ord.subtotal ?? (ord.totalPrice - ord.shippingCost)).toFixed(2)} ج + الشحن: {ord.shippingCost.toFixed(2)} ج {ord.shippingZone ? `• ${ord.shippingZone}` : ''})
                                    </span>
                                  )}
                                </div>
                                <div>
                                  {orderToDelete === ord.id ? (
                                    <div className="flex items-center gap-1.5 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100 duration-200">
                                      <span className="text-rose-700 font-extrabold text-[9px]">حذف نهائي؟</span>
                                      <button 
                                        onClick={async () => {
                                          if (ord.id) {
                                            await handleDeleteOrder(ord.id);
                                          }
                                          setOrderToDelete(null);
                                        }}
                                        className="text-white bg-rose-600 hover:bg-rose-700 font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors"
                                      >
                                        تأكيد الحذف
                                      </button>
                                      <button 
                                        onClick={() => setOrderToDelete(null)}
                                        className="text-slate-600 hover:bg-white font-semibold px-2 py-0.5 rounded text-[9px] border border-slate-200 cursor-pointer transition-colors"
                                      >
                                        تراجع
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setOrderToDelete(ord.id || null)}
                                      className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      <span>مسح السجل</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab === 'products' && (
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
                              <label className="block text-[10px] text-slate-500 mb-1">كود المنتج لدى شركة الشحن (SKU / Code)</label>
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
                                <img src={p.image} className="w-full h-full object-cover" />
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
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/50"
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
                  )}

                  {adminTab === 'offers' && (
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
                              <label className="block text-slate-700 font-bold mb-1.5 text-xs">كود العرض لشركة الشحن (Offer Code / SKU)</label>
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
                                <h6 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span>محتويات الباقة (إضافة المنتجات والكميات)</span>
                                </h6>
                                <p className="text-[10px] text-slate-500 mt-0.5">اختر المنتج ثم حدد الكمية واضغط إضافة للمجموعة</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                                عدد المنتجات المضافة: {offerForm.items.length}
                              </span>
                            </div>

                            {/* Dropdown + Qty Row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <div className="flex-1">
                                <select
                                  id="offer-product-select"
                                  value={selectedProductForOffer}
                                  onChange={(e) => setSelectedProductForOffer(e.target.value)}
                                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                >
                                  <option value="">-- اختر منتجاً لإضافته للباقة --</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.volume}) - {p.price} جنيه
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1">
                                  <span className="text-[10px] text-slate-500 ml-2 font-bold">الكمية:</span>
                                  <input 
                                    id="offer-product-qty"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={selectedQuantityForOffer}
                                    onChange={(e) => setSelectedQuantityForOffer(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-14 text-center font-bold text-xs p-1 focus:outline-none"
                                  />
                                </div>

                                <button
                                  id="add-item-to-offer-btn"
                                  type="button"
                                  onClick={handleAddProductToOfferDraft}
                                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                >
                                  <Plus className="w-4 h-4" />
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
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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

                            {/* SAVINGS HIGHLIGHT BAR */}
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3" id="savings-calculation-preview">
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

                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              id="offer-available-check"
                              checked={offerForm.isAvailable}
                              onChange={(e) => setOfferForm({ ...offerForm, isAvailable: e.target.checked })}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                            />
                            <label htmlFor="offer-available-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                              العرض متاح للطلب الفوري في واجهة المتجر
                            </label>
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
                                      <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-rose-100">
                                        {off.badge || 'عرض خاص'}
                                      </span>
                                      <button
                                        onClick={() => handleToggleOfferAvailability(off.id, off.isAvailable)}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
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
                                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
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
                                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
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
                  )}

                  {adminTab === 'categories' && (
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
                  )}

                  {adminTab === 'stats' && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-800 text-sm">مؤشرات أداء مبيعات Gold Clean الحية</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 text-right space-y-1 shadow-2xs">
                          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">إجمالي المبيعات المؤكدة</span>
                          <span className="text-xl font-black text-blue-600 font-mono block pt-0.5">{totalSalesValue.toFixed(2)} جنيه</span>
                          <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">• تشمل كافة عمليات المحاسبة</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 text-right space-y-1 shadow-2xs">
                          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">الطلبات النشطة (معلق وجاري)</span>
                          <span className="text-xl font-black text-amber-500 font-mono block pt-0.5">{activeOrdersCount} طلب نشط</span>
                          <span className="text-[9px] text-slate-400 font-semibold">• تتطلب تجهيز يدوي من العمال</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 text-right space-y-1 shadow-2xs">
                          <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold">تعداد مستندات الطلبيات</span>
                          <span className="text-xl font-black text-slate-900 font-mono block pt-0.5">{allOrders.length} طلبية بسجلاتنا</span>
                          <span className="text-[9px] text-indigo-500 font-semibold">• تشمل الملغية والمستلمة</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {adminTab === 'users' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">صلاحيات المستخدمين</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">يمكنك تنشيط المشرفين أو إلغاء صلاحياتهم.</p>
                        </div>
                        <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-100">
                          الإجمالي: {allUsers.length}
                        </span>
                      </div>

                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="ابحث بواسطة البريد الإلكتروني..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allUsers.filter(u => u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())).map((u) => (
                          <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="font-bold text-slate-800 text-xs truncate">{u.name || 'مستخدم'}</h5>
                                <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <span className={`text-[10px] px-2 py-1 object-fit rounded-md font-bold ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {u.role === 'admin' ? 'مدير عام' : u.role === 'manager' ? 'مشرف متجر' : 'عميل'}
                              </span>
                              
                              {u.role !== 'admin' && (
                                <div className="flex gap-2">
                                  {u.role !== 'manager' ? (
                                    <button
                                      onClick={() => handleChangeUserRole(u.id, 'manager')}
                                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold text-[10px] rounded-lg border border-amber-200 transition-colors"
                                    >
                                      ترقية كمشرف
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleChangeUserRole(u.id, 'user')}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors border border-slate-200"
                                    >
                                      تجريد للمستخدم
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        ) : currentTab === 'home' ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-16" dir="rtl" id="home-view">
            {/* HERO SECTION */}
            <div className="relative bg-white pt-10 md:pt-16 pb-12 md:pb-20 border-b border-slate-100 overflow-hidden shrink-0">
               <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute -left-1/4 -top-1/4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl mix-blend-multiply" />
                  <div className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl mix-blend-multiply" />
               </div>
               <div className="max-w-6xl mx-auto px-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    
                    {/* Right Column: Text Content */}
                    <div className="md:col-span-7 text-center md:text-right order-2 md:order-1">
                      <motion.span 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider mb-5 inline-block"
                      >
                        ✨ النظافة اللي تستاهليها.. بسهولة وأمان!
                      </motion.span>
                      
                      <motion.h2 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight"
                      >
                        مرحباً بكِ في عالم <br />
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent font-sans">GOLD CLEAN</span>
                        <br />
                        للمنظفات الفاخرة وعالية الجودة
                      </motion.h2>
                      
                      <motion.p 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-slate-600 text-sm md:text-base mb-8 leading-relaxed max-w-xl mx-auto md:mx-0 font-semibold"
                      >
                        نحن في <strong className="text-slate-800">جولد كلين</strong> نوفر لكِ خيارات متعددة وجودة استثنائية لجميع مستلزمات التنظيف والتعقيم للمنازل والمكاتب. تركيباتنا الفعالة تمنحكِ النظافة العميقة وحماية تدوم طويلاً وبأفضل الأسعار.
                      </motion.p>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                      >
                        <button 
                          onClick={() => setCurrentTab('products')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer inline-flex items-center justify-center gap-2"
                        >
                          <span>تصفح منتجاتنا الآن</span>
                          <span className="text-lg leading-none">&larr;</span>
                        </button>
                        
                        <button 
                          onClick={() => setCurrentTab('about')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 cursor-pointer inline-flex items-center justify-center gap-2"
                        >
                          <span>تعرّف على مصنعنا</span>
                        </button>
                      </motion.div>
                    </div>

                    {/* Left Column: Image Container */}
                    <div className="md:col-span-5 order-1 md:order-2 flex justify-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative max-w-[280px] sm:max-w-[320px] md:max-w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-50 transition-all duration-500 hover:shadow-blue-200/50 group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
                        <img 
                          src="https://ik.imagekit.io/gxrz55knx/Halal.jpeg" 
                          alt="جولد كلين - النظافة اللي تستاهليها" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover max-h-[420px] md:max-h-[500px] transition-transform duration-750 group-hover:scale-103"
                        />
                      </motion.div>
                    </div>
                    
                  </div>
               </div>
            </div>

            {/* MAIN CATEGORIES */}
            <div className="max-w-6xl mx-auto px-6 py-12 shrink-0">
              <h3 className="text-lg font-black text-slate-900 mb-6 border-r-4 border-amber-500 pr-3">اختر من الفئات الرئيسية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.length > 0 ? categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.key); setCurrentTab('products'); }}
                    className="bg-white hover:bg-amber-50 p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all text-center group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-white rounded-xl mx-auto mb-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-xs">
                      <Tag className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{cat.name}</h4>
                  </button>
                )) : (
                  <p className="text-sm text-slate-500 text-center col-span-4 bg-white p-6 rounded-2xl border border-slate-100">جاري تحميل الفئات...</p>
                )}
              </div>
            </div>

            {/* FEATURED OFFERS SECTION ON HOMEPAGE */}
            {offers.length > 0 && (
              <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-y border-rose-200/60 py-12 shrink-0">
                <div className="max-w-6xl mx-auto px-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5 text-rose-600 animate-bounce" />
                        <span className="text-rose-700 text-xs font-black bg-rose-100 px-2.5 py-0.5 rounded-md">أقوى التخفيضات</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">عروض وباقات التوفير الحصرية</h3>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('offers')}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>تصفح جميع باقات العروض ({offers.length})</span>
                      <span>&larr;</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.slice(0, 3).map((off) => {
                      const savingsVal = off.savings || Math.max(0, off.originalPrice - off.offerPrice);
                      const discountPercent = off.originalPrice > 0 ? Math.round((savingsVal / off.originalPrice) * 100) : 0;
                      const totalPieces = off.items ? off.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                      
                      // Resolve main image or items images
                      const directImage = off.image && off.image.trim() !== '' ? off.image : null;
                      const resolvedItemImages = (off.items || []).map((it) => {
                        if (it.image && it.image.trim() !== '') return { name: it.productName, qty: it.quantity, img: it.image };
                        const matchedProd = products.find(p => p.id === it.productId || p.name === it.productName);
                        return { 
                          name: it.productName, 
                          qty: it.quantity, 
                          img: matchedProd?.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=300' 
                        };
                      });
                      const primaryFallbackImage = resolvedItemImages[0]?.img || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600';

                      return (
                        <div 
                          key={`home-offer-${off.id}`} 
                          onClick={() => setCurrentTab('offers')} 
                          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-150/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between cursor-pointer group overflow-hidden"
                        >
                          <div>
                            {/* Offer Visual Media Box */}
                            <div className="h-48 bg-gradient-to-b from-slate-50/80 to-rose-50/40 rounded-2xl mb-3.5 flex items-center justify-center overflow-hidden border border-slate-100 p-2.5 relative group-hover:border-rose-200 transition-all">
                              {/* Badges on top */}
                              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                                <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  <span>{off.badge || 'عرض توفير'}</span>
                                </span>
                                {discountPercent > 0 && (
                                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                                    خصم {discountPercent}%
                                  </span>
                                )}
                              </div>

                              <div className="absolute bottom-2.5 right-2.5 z-10">
                                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  باقة {totalPieces} قطع
                                </span>
                              </div>

                              {/* Images Display: Direct Banner or Multi-Product Composite */}
                              {directImage ? (
                                <img 
                                  src={directImage} 
                                  alt={off.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                                />
                              ) : resolvedItemImages.length > 1 ? (
                                <div className="grid grid-cols-2 gap-2 w-full h-full items-center justify-center">
                                  {resolvedItemImages.slice(0, 4).map((itImg, idx) => (
                                    <div key={idx} className="h-full bg-white/90 rounded-xl p-1.5 flex flex-col items-center justify-center border border-slate-100 shadow-2xs overflow-hidden">
                                      <img 
                                        src={itImg.img} 
                                        alt={itImg.name} 
                                        referrerPolicy="no-referrer"
                                        className="max-h-12 object-contain group-hover:scale-105 transition-transform" 
                                      />
                                      <span className="text-[8px] font-extrabold text-slate-700 truncate w-full text-center mt-0.5">
                                        {itImg.qty}× {itImg.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <img 
                                  src={primaryFallbackImage} 
                                  alt={off.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2" 
                                />
                              )}
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">{off.title}</h4>
                            <p className="text-slate-500 text-[11px] line-clamp-2 mb-3 leading-relaxed">{off.description}</p>
                            
                            {/* Mini Items Checklist */}
                            <div className="text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 space-y-1">
                              {(off.items || []).map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px]">
                                  <span className="font-semibold truncate">• {it.quantity}× {it.productName}</span>
                                  <span className="text-slate-400 font-mono text-[9px] shrink-0 mr-2">({it.unitPrice * it.quantity} ج)</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100">
                            <div className="flex items-baseline justify-between mb-2">
                              <div>
                                <span className="text-xs text-slate-400 line-through ml-1.5">{off.originalPrice} ج</span>
                                <span className="text-base font-black text-rose-600 font-mono">{off.offerPrice} جنيه</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                وفر {savingsVal} جنيه
                              </span>
                            </div>

                            <button
                              id={`home-offer-add-btn-${off.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddOfferToCart(off, e);
                              }}
                              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>أضف الباقة للسلة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* BEST SELLING PRODUCTS */}
            <div className="bg-white border-y border-slate-100 py-12 shrink-0">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-lg font-black text-slate-900 border-r-4 border-blue-600 pr-3">تشكيلة منتجات مميزة</h3>
                  <button 
                    onClick={() => setCurrentTab('products')}
                    className="text-blue-600 text-[11px] font-bold hover:underline cursor-pointer"
                  >
                    عرض كل المنتجات &larr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {products.slice(0, 4).map((product) => (
                    <div key={`featured-${product.id}`} onClick={() => setCurrentTab('products')} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col relative group cursor-pointer">
                      <div className="h-36 bg-white rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                        <img 
                            src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'} 
                            alt={product.name} 
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                          />
                      </div>
                      <h5 className="font-bold text-slate-800 text-xs line-clamp-1 mb-1">{product.name}</h5>
                      <span className="text-blue-600 font-mono font-black text-sm block mt-auto">{product.price.toFixed(2)} جنيه</span>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-sm text-slate-500 text-center col-span-4 p-6">جاري تحميل المنتجات...</p>
                  )}
                </div>
              </div>
            </div>

            {/* STORE FEATURES */}
            <div className="max-w-6xl mx-auto px-6 py-12 shrink-0">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                     <div className="w-14 h-14 bg-white border border-blue-100 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
                       <Truck className="w-6 h-6" />
                     </div>
                     <h4 className="font-bold text-slate-900 mb-2 relative z-10">توصيل سريع وموثوق</h4>
                     <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">نقوم بتوصيل طلباتك بسرعة وبأمان تام لكافة الدول العربية.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                     <div className="w-14 h-14 bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
                       <ShieldCheck className="w-6 h-6" />
                     </div>
                     <h4 className="font-bold text-slate-900 mb-2 relative z-10">جودة ممتازة ومضمونة</h4>
                     <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">بضائع أصلية ١٠٠٪ ومرخصة مع ضمان الجودة على كافة المنظفات.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                     <div className="w-14 h-14 bg-white border border-rose-100 text-rose-600 flex items-center justify-center rounded-2xl mx-auto mb-4 relative z-10 shadow-sm">
                       <Banknote className="w-6 h-6" />
                     </div>
                     <h4 className="font-bold text-slate-900 mb-2 relative z-10">الدفع عند الاستلام</h4>
                     <p className="text-[11px] text-slate-500 leading-relaxed relative z-10">لراحتكم، الدفع يكون نقداً عند استلامكم للطلب لمعاينة جودة منتجاتنا.</p>
                  </div>
               </div>
            </div>
          </div>
        ) : currentTab === 'about' ? (
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 md:p-12 relative" dir="rtl" id="about-view">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-amber-50 p-8 border-b border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-amber-950 mb-2">عن شركة جولد كلين</h2>
                  <p className="text-amber-800 text-sm font-semibold">خبرة تمتد لأكثر من 10 سنوات في السوق</p>
                </div>
                <a 
                  href="/ISO . GMB.pdf" 
                  download 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm whitespace-nowrap inline-flex items-center gap-2"
                >
                  <span>تحميل شهادات الجودة</span>
                  <span className="text-lg">⬇</span>
                </a>
              </div>
              
              <div className="p-8 space-y-8 text-slate-700 leading-relaxed text-sm">
                <section>
                  <p className="mb-4">
                    شركة جولد كلين هي مصنع متخصص في إنتاج المنظفات والعطور ومنتجات العناية المنزلية، بخبرة تمتد لأكثر من 10 سنوات في السوق. ومنذ بداية رحلتنا، نحرص على التطوير المستمر وتقديم منتجات عالية الجودة تلبي احتياجات العملاء وتحقق أعلى معايير الأمان والكفاءة.
                  </p>
                  <p>
                    لا يقتصر اهتمامنا على تقديم منتج مميز فقط، بل نحرص على استخدام أفضل الخامات والمواد الخام لضمان جودة المنتج وسلامة المستخدم، لأننا نؤمن أن عملاءنا هم شركاء النجاح الحقيقيون في مسيرتنا.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-4 border-r-4 border-amber-500 pr-3">شهادات الجودة والاعتمادات</h3>
                  <p className="mb-3">حصل المصنع على عدد من شهادات الجودة والاعتمادات الدولية، منها:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4 text-slate-600 font-semibold">
                    <li>شهادة ISO 9001 لنظم إدارة الجودة.</li>
                    <li>شهادة GMP الخاصة بمعايير جودة وسلامة المنتجات.</li>
                    <li>عضو في خدمات الاعتماد الأوروبية.</li>
                    <li>عضو في المنتدى العالمي للمطابقة GCF.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-4 border-r-4 border-blue-600 pr-3">منتجاتنا</h3>
                  <p className="mb-3">تتنوع منتجاتنا لتشمل جميع احتياجات العناية بالمنزل، ومنها:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-2 text-slate-600 font-semibold">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات الجو</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات المفروشات</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> معطرات الأرضيات</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> المزيلات الشاملة</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> المطهرات</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> منعمات الملابس</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> جل غسيل الملابس</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> بالإضافة إلى مجموعة متنوعة من المنظفات والعطور المنزلية</li>
                  </ul>
                </section>

                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3 border-r-4 border-emerald-500 pr-3">التواجد الدولي</h3>
                  <p>
                    وتفخر جولد كلين بتصدير منتجاتها إلى العديد من الأسواق الدولية، منها المملكة العربية السعودية، ودولة الكويت، ودولة ليبيا، وعدد من الدول الأوروبية، كما تتواجد منتجاتنا حاليًا في أكثر من 10 دول حول العالم.
                  </p>
                </section>
              </div>
            </div>
          </div>
        ) : currentTab === 'offers' ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-16" dir="rtl" id="offers-view">
            {/* OFFERS HERO HEADER */}
            <div className="relative bg-gradient-to-b from-rose-50/70 via-white to-slate-50 pt-8 pb-10 border-b border-rose-100/60 overflow-hidden shrink-0">
              <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-black mb-3 border border-rose-200">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      <span>عروض وباقات التوفير الحصرية من مصنع جولد كلين</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
                      وفّر أكثر مع باقات التوفير المتكاملة 🔥
                    </h2>
                    <p className="text-slate-600 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
                      اختر باقتك المفضلة المكونة من أشهر منتجات العناية والمنظفات بخصومات حقيقية وتوفير مضمون مقارنة بالشراء الفردي!
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-rose-100 shadow-sm shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                      <Percent className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">مجموع الباقات المتاحة</span>
                      <span className="text-xl font-black text-rose-600 font-mono">
                        {offers.filter(o => o.isAvailable).length} باقة توفير
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OFFERS GRID */}
            <div className="max-w-6xl mx-auto px-6 py-8">
              {offers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد باقات عروض متاحة حالياً</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                    يقوم فريق جولد كلين بتجهيز باقات توفير جديدة قريباً. يمكنك تصفح المنتجات الفردية الآن.
                  </p>
                  <button
                    onClick={() => setCurrentTab('products')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="storefront-offers-grid">
                  {offers.map((offer) => {
                    const savingsVal = offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice);
                    const discountPercent = offer.originalPrice > 0 ? Math.round((savingsVal / offer.originalPrice) * 100) : 0;
                    const totalPieces = offer.items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between overflow-hidden group"
                      >
                        <div>
                          {/* Card Header & Visual Media */}
                          <div className="relative bg-slate-50 p-4 border-b border-slate-100 overflow-hidden">
                            {/* Promo Badge */}
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                              <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                <span>{offer.badge || 'عرض خاص'}</span>
                              </span>
                              {discountPercent > 0 && (
                                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xs">
                                  خصم {discountPercent}%
                                </span>
                              )}
                            </div>

                            {/* Offer Image or Product Collage */}
                            <div className="h-48 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden p-3 relative">
                              {offer.image && offer.image.trim() !== '' ? (
                                <img 
                                  src={offer.image} 
                                  alt={offer.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                              ) : offer.items && offer.items.length > 1 ? (
                                <div className="grid grid-cols-2 gap-2 w-full h-full p-1 items-center justify-center">
                                  {offer.items.slice(0, 4).map((it, idx) => {
                                    const itImg = it.image && it.image.trim() !== '' 
                                      ? it.image 
                                      : (products.find(p => p.id === it.productId || p.name === it.productName)?.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=300');
                                    return (
                                      <div key={idx} className="h-full bg-slate-50 rounded-xl p-1 flex flex-col items-center justify-center border border-slate-100 overflow-hidden">
                                        <img 
                                          src={itImg} 
                                          alt={it.productName} 
                                          referrerPolicy="no-referrer"
                                          className="max-h-12 object-contain"
                                        />
                                        <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center mt-0.5">
                                          {it.quantity}× {it.productName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : offer.items && offer.items.length === 1 ? (
                                <img 
                                  src={offer.items[0].image || products.find(p => p.id === offer.items[0].productId || p.name === offer.items[0].productName)?.image || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600'} 
                                  alt={offer.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                              ) : (
                                <img 
                                  src="https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600" 
                                  alt={offer.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                              )}
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                باقة تحتوي على {totalPieces} قطع
                              </span>
                              {!offer.isAvailable && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                  غير متوفر حالياً
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-rose-600 transition-colors">
                              {offer.title}
                            </h3>

                            <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                              {offer.description}
                            </p>

                            {/* Detailed Items in Bundle */}
                            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                              <span className="text-[10px] font-extrabold text-slate-700 block">
                                محتويات الباقة:
                              </span>
                              <div className="space-y-1">
                                {offer.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                      <span className="font-bold text-slate-800">{it.quantity}×</span>
                                      <span className="truncate">{it.productName}</span>
                                      {it.volume && <span className="text-[10px] text-slate-400">({it.volume})</span>}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                      {(it.unitPrice * it.quantity).toFixed(0)} ج
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Pricing, Prominent Savings Box & Add Button */}
                        <div className="p-5 pt-0 space-y-3">
                          {/* Price Display */}
                          <div className="flex items-baseline justify-between pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-400 font-bold block mb-0.5">سعر الباقة</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-rose-600 font-mono">
                                  {offer.offerPrice.toFixed(0)}
                                </span>
                                <span className="text-xs font-bold text-slate-500">جنيه</span>
                                {offer.originalPrice > offer.offerPrice && (
                                  <span className="text-xs text-slate-400 line-through font-mono">
                                    {offer.originalPrice.toFixed(0)} ج
                                  </span>
                                )}
                              </div>
                            </div>

                            {discountPercent > 0 && (
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 inline-block">
                                  وفرت {discountPercent}% خصم
                                </span>
                              </div>
                            )}
                          </div>

                          {/* PROMINENT SAVINGS BADGE UNDER PRICE (User requirement: لازم كمان قيمة التوفير تتكتب تحت المنتح) */}
                          <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-[11px] font-bold text-emerald-900">
                                قيمة التوفير:
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-emerald-700 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                              وفر {savingsVal} جنيه 💰
                            </div>
                          </div>

                          {/* CTA Button */}
                          <button
                            disabled={!offer.isAvailable}
                            onClick={(e) => handleAddOfferToCart(offer, e)}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                              !offer.isAvailable
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-rose-600/20 hover:scale-[1.02]'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>{!offer.isAvailable ? 'الباقة غير متوفرة' : 'أضف باقة العرض إلى السلة'}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* SIDEBAR FILTERS (CLEAN MINIMAL DESIGN SPECS) */}
            <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 hidden md:flex" dir="rtl" id="sidebar-filters">
              
              {/* Active Status Header */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-3.5">تصفية المنظفات</h3>
                <div className="relative mb-4">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input 
                    id="sidebar-search"
                    type="text" 
                    placeholder="ابحث باسم المنتج..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categories List */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">التصنيفات المتاحة</h3>
                <ul className="space-y-1 text-xs">
                  <li key="all">
                    <button 
                      id="sidebar-cat-btn-all"
                      onClick={() => setActiveCategory('all')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all text-right ${
                        activeCategory === 'all' 
                          ? 'bg-blue-50 text-blue-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activeCategory === 'all' ? 'bg-blue-600' : 'bg-transparent border border-slate-300'}`} />
                      <span>كافة المعروضات</span>
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.key}>
                      <button 
                        id={`sidebar-cat-btn-${cat.key}`}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all text-right ${
                          activeCategory === cat.key 
                            ? 'bg-blue-50 text-blue-600 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${activeCategory === cat.key ? 'bg-blue-600' : 'bg-transparent border border-slate-300'}`} />
                        <span>{cat.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Price Input */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">السعر الأقصى</h3>
                <div className="relative">
                  <input 
                    id="input-filter-price"
                    type="number"
                    min="0"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value) || 0)}
                    placeholder="أدخل السعر الأقصى..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-3 pl-14 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 pointer-events-none">جنيه</span>
                </div>
                {priceRange > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5">عرض المنتجات حتى {priceRange} جنيه</p>
                )}
              </div>

              {/* Shipping & Support badges */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold block">مزايا الطلب</span>
                <div className="text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>شحن سريع متوفر اليوم</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>دفع آمن بالكامل</span>
                  </div>
                </div>
              </div>

            </aside>

            {/* PRODUCTS LIST GRID */}
            <section className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 flex flex-col" dir="rtl" id="product-grid-section">
              
              {/* Header Mobile Search/Category Filter */}
              <div className="flex flex-col md:hidden gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-400">التصنيفات المتوفرة باللمس</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    الكل
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        activeCategory === c.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading View */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col shadow-sm animate-pulse">
                      <div className="h-40 bg-slate-100 rounded-xl mb-4" />
                      <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                      <div className="mt-auto h-8 bg-slate-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">لم تعثر على بضائع مناسبة!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">يرجى إعادة اختيار تصنيفات أخرى أو زيادة ميزانية البحث من شريط التحكم على الجانب.</p>
                  <button 
                    onClick={() => { setActiveCategory('all'); setPriceRange(0); setSearchTerm(''); }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                  >
                    رؤية كافة البضائع
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1" id="products-catalog-grid">
                  {filteredProducts.map((product) => {
                    const isOut = !product.isAvailable;
                    return (
                      <motion.div
                        layout
                        key={product.id}
                        id={`product-card-${product.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 flex flex-col shadow-sm transition-all group hover:shadow-md h-full relative"
                      >
                          {/* Image Area */}
                        <div 
                          className="h-44 bg-slate-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer"
                          onClick={() => { setSelectedProductDetails(product); setIsProductDetailsOpen(true); }}
                        >
                          {isOut ? (
                            <span className="absolute top-2 right-2 bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded-lg font-bold z-10">نفذت الكمية</span>
                          ) : (
                            <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-emerald-100 z-10">
                              متوفر في المخزن
                            </span>
                          )}
                          
                          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md font-bold z-10">
                            {product.volume}
                          </span>

                          <img 
                            src={product.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'} 
                            alt={product.name} 
                            className="w-full h-full object-contain p-2 transition-transform group-hover:scale-103 relative"
                          />
                        </div>

                        {/* Metadata & Title */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-blue-600 tracking-wider block mb-1">
                              {categories.find(c => c.key === product.category)?.name || 'فئة مخصصة'}
                            </span>
                            
                            <h4 
                              className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                              onClick={() => { setSelectedProductDetails(product); setIsProductDetailsOpen(true); }}
                            >
                              {product.name}
                            </h4>
                            
                            <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] text-slate-400">السعر النهائي</span>
                              <span className="text-base font-bold text-blue-600 block leading-none mt-0.5">
                                {product.price.toFixed(2)} <span className="text-xs font-normal">جنيه</span>
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyLink(product.id); }}
                                className="p-2.5 rounded-xl flex items-center justify-center transition-colors bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                title="نسخ رابط المنتج"
                              >
                                {copiedLinkId === product.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                              </button>
                              <button 
                                id={`add-btn-${product.id}`}
                                disabled={isOut}
                                onClick={(e) => handleAddToCart(product, e)}
                                className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                                  isOut 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-slate-900 hover:bg-blue-600 text-white'
                                }`}
                                title="أضف إلى السلة"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!isMerchantOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur border-t border-slate-200 fixed bottom-0 inset-x-0 z-40 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold shadow-lg" dir="rtl" id="mobile-bottom-nav">
          <button
            onClick={() => { setCurrentTab('home'); setIsMerchantOpen(false); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
              currentTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>

          <button
            onClick={() => { setCurrentTab('products'); setIsMerchantOpen(false); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
              currentTab === 'products' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>المنتجات</span>
          </button>

          <button
            onClick={() => { setCurrentTab('offers'); setIsMerchantOpen(false); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative ${
              currentTab === 'offers' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[8px] px-1 rounded-full animate-pulse font-extrabold">
              🔥
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
            <span className="text-rose-600">العروض</span>
          </button>

          <button
            onClick={() => setIsTrackerOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-colors relative"
          >
            {userOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {userOrders.length}
              </span>
            )}
            <Notebook className="w-4 h-4" />
            <span>طلباتي</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-colors relative"
          >
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                {cart.reduce((cnt, it) => cnt + it.quantity, 0)}
              </span>
            )}
            <ShoppingCart className="w-4 h-4" />
            <span>السلة</span>
          </button>

          {(userRole === 'manager' || userRole === 'admin') && (
            <button
              onClick={() => setIsMerchantOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-amber-700 bg-amber-50 border border-amber-200"
            >
              <Settings className="w-4 h-4 text-amber-600" />
              <span>الإدارة</span>
            </button>
          )}
        </nav>
      )}

      {/* PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {isProductDetailsOpen && selectedProductDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900 z-50 transition-opacity cursor-pointer"
              onClick={() => setIsProductDetailsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[700px] max-h-[95vh] bg-white md:rounded-3xl rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
              dir="rtl"
            >
              <div className="relative h-64 md:h-80 bg-slate-50 shrink-0">
                <img 
                  src={selectedProductDetails.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=1000'}
                  alt={selectedProductDetails.name}
                  className="w-full h-full object-contain p-4"
                />
                
                <button 
                  onClick={() => setIsProductDetailsOpen(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur text-slate-600 rounded-full flex items-center justify-center hover:bg-white transition-colors border border-slate-200 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {!selectedProductDetails.isAvailable && (
                  <div className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md border border-rose-600">
                    نفذت الكمية
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                    {categories.find(c => c.key === selectedProductDetails.category)?.name || 'فئة مخصصة'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    {selectedProductDetails.volume}
                  </span>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                  {selectedProductDetails.name}
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                  {Object.keys(selectedProductDetails.ratingsMap || {}).length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{selectedProductDetails.rating}</span>
                      <span className="text-xs text-slate-400">({Object.keys(selectedProductDetails.ratingsMap || {}).length} تقييم)</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      لا توجد تقييمات بعد
                    </span>
                  )}
                  <div className="text-xl font-black text-blue-600">
                    {selectedProductDetails.price.toFixed(2)} <span className="text-sm font-normal text-slate-500">جنيه</span>
                  </div>
                </div>

                <div className="prose prose-sm md:prose-base text-slate-600 mb-8 max-w-none">
                  <h3 className="text-base font-bold text-slate-900 mb-2">وصف المنظف</h3>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedProductDetails.description}</p>
                </div>

                {/* Rating Input UI */}
                <div className="mb-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 block">ما رأيك بهذا المنتج؟</h4>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const userRating = user ? (selectedProductDetails.ratingsMap?.[user.uid] || 0) : 0;
                      return (
                        <button
                          key={star}
                          onClick={() => handleRateProduct(selectedProductDetails, star)}
                          className="hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star className={`w-8 h-8 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200 drop-shadow-sm'}`} />
                        </button>
                      );
                    })}
                  </div>
                  {user && selectedProductDetails.ratingsMap?.[user.uid] && (
                    <p className="text-xs text-emerald-600 font-bold mt-2">لقد قمت بتقييم هذا المنتج بنجاح</p>
                  )}
                  {!user && (
                    <p className="text-xs text-slate-400 mt-2">سجل دخولك لتقييم المنتج</p>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsProductDetailsOpen(false)}
                    className="px-6 py-3 bg-white text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={() => handleCopyLink(selectedProductDetails.id)}
                    className="px-4 py-3 bg-white text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center"
                    title="نسخ رابط المنتج"
                  >
                    {copiedLinkId === selectedProductDetails.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  disabled={!selectedProductDetails.isAvailable}
                  onClick={(e) => {
                    handleAddToCart(selectedProductDetails, e);
                    // Don't close logic to let user add multiple if they want, but optionally close:
                    // setIsProductDetailsOpen(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-100 outline-none
                    ${!selectedProductDetails.isAvailable 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>
                    {!selectedProductDetails.isAvailable ? 'المنتج غير متوفر' : 'أضف إلى سلة التسوق'}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SHOPPING CART DRAWER (Large Side Drawer) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
              id="cart-overlay"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
              id="cart-drawer"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">سلة المشتريات</h3>
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                        {cart.reduce((c, i) => c + i.quantity, 0)} {cart.reduce((c, i) => c + i.quantity, 0) === 1 ? 'منتج' : 'منتجات'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">منظفات مصنع جولد كلين - الدفع عند الاستلام</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="إغلاق السلة ومتابعة التسوق"
                >
                  <span className="text-xs font-bold hidden sm:inline">إغلاق</span>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alert banner to inform user about their item addition */}
              {cart.length > 0 && (
                <div className="mx-5 sm:mx-6 mt-4 p-3 bg-blue-50/90 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-[11px] sm:text-xs">تمت إضافة منتجك إلى السلة! يمكنك مراجعة طلبك أو إغلاق القائمة ومواصلة التسوق.</span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-blue-700 hover:text-blue-950 font-bold underline text-[11px] shrink-0 cursor-pointer mr-2"
                  >
                    متابعة التسوق
                  </button>
                </div>
              )}

              {/* Items content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <ShoppingBag className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="font-extrabold text-slate-700 text-base">سلة التسوق فارغة</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                      تصفح منظفات ومطهرات جولد كلين الفاخرة وأضف ما يناسبك لتظهر هنا مباشرة.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                    >
                      تصفح المنتجات الآن
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs relative group transition-all"
                    >
                      <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                        <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{item.product.name}</h5>
                            <button 
                              onClick={() => handleRemoveItem(item.product.id)} 
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="حذف من السلة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.product.volume && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                {item.product.volume}
                              </span>
                            )}
                            {item.product.code && (
                              <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                                كود: {item.product.code}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-bold">
                              سعر القطعة: {item.product.price} جنيه
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-2 py-1">
                            <button 
                              onClick={() => handleUpdateQty(item.product.id, -1)} 
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-slate-900 px-2 min-w-[20px] text-center font-mono">{item.quantity}</span>
                            <button 
                              onClick={() => handleUpdateQty(item.product.id, 1)} 
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Item total */}
                          <div className="text-left">
                            <span className="text-xs font-extrabold text-blue-700 font-mono">{(item.product.price * item.quantity).toFixed(2)} جنيه</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer checkout box */}
              {cart.length > 0 && (
                <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/70 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>إجمالي عدد القطع بالسلة</span>
                      <span className="font-bold">{cart.reduce((c, i) => c + i.quantity, 0)} قطعة</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>مصاريف الشحن والتوصيل</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        معاينة عند كتابة العنوان (شركة J&T)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-3 border-t border-slate-200 text-sm">
                      <span>المجموع الإجمالي للمنتجات</span>
                      <span className="text-blue-600 font-black text-base font-mono">{getSubtotal().toFixed(2)} جنيه</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button 
                      id="drawer-proceed-checkout-btn"
                      onClick={() => { 
                        setIsCartOpen(false); 
                        setIsCheckoutOpen(true); 
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                      <Truck className="w-4 h-4" />
                      <span>تأكيد الطلب وإدخال العنوان (الدفع عند الاستلام) ←</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer text-center"
                    >
                      متابعة التسوق وإضافة منتجات أخرى
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL WINDOW WITH SECURE FIREBASE CONNECTION */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-slate-950"
              id="checkout-overlay"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
              id="checkout-modal animate-slide-up"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">إتمام الشحن والطلب</h3>
                  <p className="text-[11px] text-slate-400">يرجى تعبئة بيانات التوصيل بدقة لضمان سرعة الوصول</p>
                </div>
                <button onClick={() => { setIsCheckoutOpen(false); setSuccessOrder(null); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {successOrder ? (
                // Success window
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">تم إرسال طلبك بنجاح!</h4>
                    <p className="text-xs text-slate-400 mt-1">نشكرك لشرائك من متجرنا. تم إرسال المعلومات ومزامنتها بنجاح مع وكلاء التوصيل.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-2.5 text-xs">
                    <p><strong>رقم المرجع للطلب:</strong> <span className="font-mono text-blue-600 text-sm">{successOrder.id}</span></p>
                    
                    {successOrder.shippingInfo?.billCode && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span>تم تسجيل الشحنة لدى J&T Express بنجاح</span>
                        </div>
                        <p className="text-[11px]">
                          <strong>رقم بوليصة الشحن والتتبع:</strong> <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">{successOrder.shippingInfo.billCode}</span>
                        </p>
                        {successOrder.shippingInfo.sortingCode && (
                          <p className="text-[10px] text-emerald-700">
                            كود الفرز والتوزيع: {successOrder.shippingInfo.sortingCode}
                          </p>
                        )}
                      </div>
                    )}

                    <p><strong>اسم العميل:</strong> {successOrder.customerName}</p>
                    <p><strong>المحافظة والمدينة:</strong> {successOrder.customerCity} {successOrder.shippingZone ? `(${successOrder.shippingZone})` : ''}</p>
                    <p><strong>العنوان بالتفصيل:</strong> {successOrder.customerAddress}</p>
                    <p><strong>طريقة الدفع:</strong> نقدي عند التوصيل للمنزل (COD)</p>

                    <div className="pt-2.5 border-t border-slate-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>إجمالي المنتجات:</span>
                        <span className="font-mono font-bold text-slate-800">{(successOrder.subtotal ?? (successOrder.totalPrice - (successOrder.shippingCost || 0))).toFixed(2)} جنيه</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>تكلفة الشحن والتوصيل {successOrder.shippingZone ? `(${successOrder.shippingZone})` : ''}:</span>
                        <span className="font-mono font-bold text-emerald-700">{(successOrder.shippingCost || 0).toFixed(2)} جنيه</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 font-extrabold pt-1.5 border-t border-slate-200">
                        <span>المبلغ المستحق للدفع عند الاستلام:</span>
                        <span className="font-mono text-blue-700 text-sm">{successOrder.totalPrice.toFixed(2)} جنيه</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 text-center pt-1 font-medium">
                        ✓ المبلغ شامل كافة مصاريف الشحن والتوصيل لباب منزلك
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setIsCheckoutOpen(false); setSuccessOrder(null); }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                  >
                    العودة للتسوق بمزيد من المنظفات
                  </button>
                </div>
              ) : (
                // Form window
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                  {user && (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between" dir="rtl">
                      <span className="text-amber-800 text-[10px] font-bold">الحساب الحالي ({userRole === 'admin' ? 'المدير' : userRole === 'manager' ? 'المشرف' : 'مستخدم'}):</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-bold text-[11px] font-mono">{user.email}</span>
                        {user.photoURL && (
                          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover border border-amber-300" />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستلم رباعي *</label>
                    <input 
                      type="text" 
                      required 
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                      placeholder="محمد أحمد علي..."
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الهاتف لتأكيد الشحن والتسليم *</label>
                      <input 
                        type="tel" 
                        required 
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        placeholder="01012345678"
                        className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-left flex-1 font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">الدولة</label>
                      <div className="w-full bg-slate-100 border border-slate-200 py-2.5 px-3 rounded-lg text-slate-700 font-bold flex items-center justify-between">
                        <span>جمهورية مصر العربية</span>
                        <span>🇪🇬</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">المحافظة / المدينة *</label>
                      <button
                        type="button"
                        onClick={() => setIsShippingRatesOpen(!isShippingRatesOpen)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>{isShippingRatesOpen ? 'إخفاء جدول المناطق' : 'جدول أسعار ومناطق الشحن'}</span>
                      </button>
                    </div>
                    <select
                      required
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="">-- اضغط هنا لاختيار المحافظة لتحديد تكلفة الشحن --</option>
                      {SHIPPING_ZONES.map((zone) => (
                        <optgroup 
                          key={zone.id} 
                          label={`${zone.name} (شحن ${zone.baseRate} ج)`}
                        >
                          {zone.cities.map((city) => (
                            <option key={city} value={city}>
                              {city} (شحن {zone.baseRate} ج)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Collapsible Shipping Rate Guide */}
                  {isShippingRatesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2 text-[11px] overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>أسعار الشحن الرسمية حسب المحافظات (عبر J&T Express):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SHIPPING_ZONES.map(z => (
                          <div key={z.id} className="bg-white p-2 rounded-lg border border-blue-100 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-blue-950">{z.name}</span>
                              <span className="font-mono font-black text-emerald-700">{z.baseRate} ج ثابت</span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2">
                              {z.cities.join('، ')}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-blue-700 pt-1">
                        • سعر الشحن ثابت وموحد للمحافظة بغض النظر عن وزن وحجم الطلب.
                      </p>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">تفاصيل العنوان والشارع *</label>
                    <input 
                      type="text" 
                      required 
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="اسم المنطقة/الحي، اسم الشارع، رقم العمارة، رقم الشقة"
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ملاحظات للمندوب أو شروط معينة</label>
                    <textarea 
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                      placeholder="يرجى الاتصال قبل الوصول بنصف ساعة لتجهيز المبلغ كاش..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Order & Shipping Cost Breakdown */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>إجمالي سعر المنتجات ({cart.reduce((s, it) => s + it.quantity, 0)} قطعة):</span>
                      <span className="font-mono font-bold text-slate-800">{getSubtotal().toFixed(2)} جنيه</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>تكلفة الشحن والتوصيل:</span>
                        {shippingCalculation && (
                          <span className="text-[10px] text-slate-400">
                            ({shippingCalculation.zone.name})
                          </span>
                        )}
                      </div>
                      {shippingCalculation ? (
                        <span className="font-mono font-bold text-emerald-700">
                          +{shippingCalculation.shippingCost.toFixed(2)} جنيه
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[10px]">
                          اختر المحافظة لحساب الشحن
                        </span>
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">الإجمالي المطلوب دفعه:</span>
                        <span className="text-[10px] text-slate-400 font-medium">نقداً عند الاستلام للمنزل (COD)</span>
                      </div>
                      <span className="text-base font-black text-blue-700 font-mono">
                        {checkoutGrandTotal.toFixed(2)} جنيه
                      </span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={orderInProgress}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {orderInProgress ? 'يرجى الانتظار جاري إرسال الطلب...' : `تأكيد الطلب بمبلغ ${checkoutGrandTotal.toFixed(2)} جنيه`}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT-SIDE REAL-TIME ORDER TRACKER PANEL */}
      <AnimatePresence>
        {isTrackerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackerOpen(false)}
              className="absolute inset-0 bg-slate-950"
              id="tracker-overlay"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[85vh] flex flex-col text-right border border-slate-100"
              id="tracker-modal"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <span>صفحة طلباتي ومشترياتي</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">تتبع وإدارة كافة طلباتك السابقة والحالية في Gold Clean</p>
                </div>
                <button 
                  onClick={() => setIsTrackerOpen(false)} 
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              {userOrders.length === 0 && !isTrackingLoading ? (
                // Empty state for guest or user
                <div className="py-12 text-center max-w-md mx-auto space-y-5">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">لا توجد طلبات مسجلة حالياً</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      عندما تقوم بطلب أي منظفات من المتجر، ستظهر طلبياتك وحالة الشحن وبوالص التوصيل هنا تلقائياً دون الحاجة لتسجيل أي حساب.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsTrackerOpen(false);
                      setCurrentTab('products');
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-transform hover:scale-102 cursor-pointer shadow-xs"
                  >
                    <span>تصفح المنتجات والتسوق الآن</span>
                  </button>
                </div>
              ) : (
                // Orders view with 3 tabs
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  
                  {/* Tabs matching requested structure */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold leading-normal text-slate-500">
                    {[
                      { 
                        id: 'active', 
                        label: 'الطلبات النشطة', 
                        count: userOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'shipping').length,
                        activeBg: 'bg-blue-600 text-white shadow-sm',
                        inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                      },
                      { 
                        id: 'past', 
                        label: 'الطلبات السابقة', 
                        count: userOrders.filter(o => o.status === 'delivered').length,
                        activeBg: 'bg-emerald-600 text-white shadow-sm',
                        inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                      },
                      { 
                        id: 'cancelled', 
                        label: 'الطلبات الملغية', 
                        count: userOrders.filter(o => o.status === 'cancelled').length,
                        activeBg: 'bg-red-500 text-white shadow-sm',
                        inactiveBg: 'hover:text-slate-900 hover:bg-white/50'
                      }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setUserOrdersTab(tab.id as any)}
                        className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                          userOrdersTab === tab.id ? tab.activeBg : tab.inactiveBg
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                          userOrdersTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Orders Content List */}
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
                    {isTrackingLoading ? (
                      <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>جاري تحميل طلباتك من قاعدة البيانات...</span>
                      </div>
                    ) : (
                      (() => {
                        const filtered = userOrders.filter(ord => {
                          if (userOrdersTab === 'active') return ord.status === 'pending' || ord.status === 'preparing' || ord.status === 'shipping';
                          if (userOrdersTab === 'cancelled') return ord.status === 'cancelled';
                          return ord.status === 'delivered';
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                              <p className="text-xs text-slate-400 font-bold">لا يوجد طلبات في هذا القسم حالياً</p>
                              <p className="text-[10px] text-slate-400">أي طلبات تنشئها بالمتجر ستظهر هنا تلقائياً بالقسم المخصص لها.</p>
                            </div>
                          );
                        }

                        return filtered.map((order) => {
                          const orderDate = order.createdAt?.seconds 
                            ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'قيد المزامنة...';

                          return (
                            <div 
                              key={order.id} 
                              className="p-4 rounded-2xl bg-white border border-slate-150 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3"
                            >
                              {/* Card Header & Status */}
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-800">طلب رقم: #{order.id?.substring(0, 8).toUpperCase()}</span>
                                  <span className="block text-[10px] text-slate-400">{orderDate}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'shipping' ? 'bg-indigo-100 text-indigo-700' :
                                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {order.status === 'pending' && 'معلق في الانتظار ⏳'}
                                  {order.status === 'preparing' && 'جاري التجهيز 📦'}
                                  {order.status === 'shipping' && 'مع المندوب للتسليم 🚚'}
                                  {order.status === 'delivered' && 'تم التوصيل بنجاح ✅'}
                                  {order.status === 'cancelled' && 'طلب ملغى ❌'}
                                </span>
                              </div>

                              {/* Items list */}
                              <div className="space-y-1.5 pl-2">
                                <span className="block text-[10px] font-bold text-slate-400">المنتجات والمنظفات المطلوبة:</span>
                                <div className="space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                      <span>{item.productName}</span>
                                      <span className="font-mono text-[11px] font-semibold text-slate-500">الكمية: {item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* J&T Express Shipping info */}
                              {order.shippingInfo?.billCode && (
                                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>شحنة J&T Express:</span>
                                    <span className="font-mono text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px]">{order.shippingInfo.billCode}</span>
                                  </div>
                                  {order.shippingInfo.sortingCode && (
                                    <span className="text-[9px] text-emerald-700 font-mono bg-emerald-100/60 px-1.5 py-0.5 rounded">{order.shippingInfo.sortingCode}</span>
                                  )}
                                </div>
                              )}

                              {/* Footer details */}
                              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs">
                                <div className="space-y-0.5">
                                  <span className="block text-[10px] text-slate-400">الدولة/المدينة: {order.customerCountry ? order.customerCountry + ' - ' : ''}{order.customerCity}</span>
                                  <span className="block text-[10px] text-slate-400">العنوان: {order.customerAddress}</span>
                                  {order.notes && (
                                    <span className="block text-[10px] text-rose-500 font-bold">• ملاحظات: {order.notes}</span>
                                  )}
                                </div>
                                <div className="text-left">
                                  <span className="block text-[9px] text-slate-400 leading-none">
                                    {typeof order.shippingCost === 'number' ? `شامل الشحن (${order.shippingCost} ج)` : 'إجمالي الحساب (COD)'}
                                  </span>
                                  <span className="text-sm font-black text-blue-600 font-mono inline-block mt-1">{order.totalPrice.toFixed(2)} جنيه</span>
                                </div>
                              </div>

                              {/* Cancellation Button Section */}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <div className="pt-2.5 border-t border-dashed border-slate-100 flex justify-end">
                                  {orderToCancel === order.id ? (
                                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl duration-200">
                                      <span className="text-rose-700 font-extrabold text-[10px]">تأكيد إلغاء هذا الطلب وإرجاع البضاعة؟</span>
                                      <button 
                                        onClick={async () => {
                                          await handleUserCancelOrder(order);
                                          setOrderToCancel(null);
                                        }}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                      >
                                        نعم، إلغاء الآن
                                      </button>
                                      <button 
                                        onClick={() => setOrderToCancel(null)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                      >
                                        تراجع
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setOrderToCancel(order.id || null)}
                                      className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-extrabold px-3 py-1.5 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                                    >
                                      <span>إلغاء الطلب</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE SIGN IN MODAL (ADMIN & MANAGER ACCESS) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-slate-950"
              id="auth-modal-overlay"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 border border-slate-100"
              id="auth-modal-window"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-right" dir="rtl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>خاص بالإدارة والمشرفين</span>
                </div>
                <h3 className="font-black text-slate-900 text-lg">بوابة تسجيل دخول الإدارة</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  هذه البوابة مخصصة حصرياً لمدراء ومشرفي متجر Gold Clean لمتابعة الطلبات، تعديل المنتجات، الأسعار، العروض، ومزامنة بوالص الشحن.
                </p>
              </div>

              <div className="pt-2">
                {authError && (
                  <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-right text-xs text-rose-800 leading-relaxed mb-3" dir="rtl" id="auth-error-banner">
                    {authError}
                  </div>
                )}
                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-all duration-200 cursor-pointer hover:shadow-sm"
                  dir="rtl"
                >
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.12-4.53-1.19-7.06z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>تسجيل الدخول كمسؤول / مدير (Google)</span>
                </button>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-right text-[11px] text-blue-950" dir="rtl">
                <strong>🛍️ للعملاء والزبائن:</strong> يمكنك إضافة أي منتجات إلى سلتك وتأكيد طلبك مباشرة بالدفع عند الاستلام دون الحاجة لتسجيل الدخول.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROMOTIONAL WELCOME MODAL (GC01 & GC02) */}
      <AnimatePresence>
        {isPromoModalOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromoModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              dir="rtl"
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-amber-300/60 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-5 md:p-6 relative overflow-hidden shrink-0">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Close Button */}
                <button
                  onClick={() => setIsPromoModalOpen(false)}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10 pr-1 pl-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>مفاجأة ترحيبية خاصة لزوار متجر Gold Clean اليوم 🔥</span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">
                    أقوى باقة توفير والمنتج الأكثر طلباً
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                    اخترنا لك أفضل باقة توفير والمنتج الأكثر مبيعاً بأفضل سعر مع توصيل سريع حتى باب بيتك
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/70">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  
                  {/* CARD 1: OFFER GC01 */}
                  <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs p-4 sm:p-5 flex flex-col justify-between relative hover:border-rose-400 transition-all hover:shadow-md">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          <Flame className="w-3.5 h-3.5 text-rose-600" />
                          <span>باقة التوفير الذهبي</span>
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          كود العرض: {targetPromoOffer.code || 'GC01'}
                        </span>
                      </div>

                      {/* Image Box */}
                      <div className="h-40 sm:h-44 w-full rounded-xl bg-slate-50 p-2 border border-slate-100 relative overflow-hidden flex items-center justify-center mb-3">
                        <img
                          src={targetPromoOffer.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600'}
                          alt={targetPromoOffer.title}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <span>وفر {targetPromoOffer.savings || (targetPromoOffer.originalPrice - targetPromoOffer.offerPrice)} ج.م 💰</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                        {targetPromoOffer.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {targetPromoOffer.description}
                      </p>

                      {/* Pricing */}
                      <div className="mt-3.5 flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                          {targetPromoOffer.offerPrice} ج.م
                        </span>
                        {targetPromoOffer.originalPrice > targetPromoOffer.offerPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {targetPromoOffer.originalPrice} ج.م
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => handleAddOfferToCart(targetPromoOffer, e)}
                      className="w-full mt-4 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:shadow-rose-600/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>أضف باقة العرض للسلة</span>
                    </button>
                  </div>

                  {/* CARD 2: PRODUCT GC02 */}
                  <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-4 sm:p-5 flex flex-col justify-between relative hover:border-blue-400 transition-all hover:shadow-md">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>المنتج الأكثر طلباً</span>
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          كود المنتج: {targetPromoProduct.code || 'GC02'}
                        </span>
                      </div>

                      {/* Image Box */}
                      <div className="h-40 sm:h-44 w-full rounded-xl bg-slate-50 p-2 border border-slate-100 relative overflow-hidden flex items-center justify-center mb-3">
                        <img
                          src={targetPromoProduct.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=600'}
                          alt={targetPromoProduct.name}
                          className="w-full h-full object-contain"
                        />
                        {targetPromoProduct.volume && (
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {targetPromoProduct.volume}
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                        {targetPromoProduct.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {targetPromoProduct.description}
                      </p>

                      {/* Pricing & Rating */}
                      <div className="mt-3.5 flex items-center justify-between">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                          {targetPromoProduct.price} ج.م
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 font-mono">(4.9)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => handleAddToCart(targetPromoProduct, e)}
                      className="w-full mt-4 py-2.5 px-4 bg-slate-900 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:shadow-blue-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>أضف المنتج للسلة</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Bottom Footer / Combined Bundle CTA */}
              <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  onClick={(e) => {
                    triggerFlyAnimation(e);
                    handleAddOfferToCart(targetPromoOffer, e);
                    handleAddToCart(targetPromoProduct, e);
                    setAddedItemName('باقة GC01 + منتج GC02 معاً');
                    setTimeout(() => setAddedItemName(null), 2500);
                    setIsPromoModalOpen(false);
                  }}
                  className="w-full sm:w-auto flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-amber-300"
                >
                  <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>أضف العرض والمنتج معاً بضغطة واحدة ⚡</span>
                  <span className="bg-slate-950/10 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                    {(targetPromoOffer.offerPrice + targetPromoProduct.price)} ج.م
                  </span>
                </button>

                <button
                  onClick={() => setIsPromoModalOpen(false)}
                  className="w-full sm:w-auto py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  متابعة التصفح في المتجر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Re-open Promo Button */}
      {!isPromoModalOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsPromoModalOpen(true)}
          className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white font-bold text-xs py-2.5 px-3.5 sm:px-4 rounded-full shadow-xl shadow-amber-950/20 flex items-center gap-2 border border-amber-400/40 cursor-pointer hover:border-amber-400 transition-all"
          title="عروض اليوم الخاصة"
          dir="rtl"
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-[11px] sm:text-xs">عروض اليوم المميزة (GC01 + GC02)</span>
        </motion.button>
      )}

      {/* FLY TO CART ANIMATED PARTICLES */}
      <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
        <AnimatePresence>
          {flyingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                position: 'fixed', 
                left: particle.startX, 
                top: particle.startY, 
                scale: 0.2, 
                opacity: 1 
              }}
              animate={{ 
                left: particle.targetX, 
                top: particle.targetY, 
                scale: [0.2, 1.4, 1, 0.2], 
                opacity: [1, 1, 1, 0], 
                rotate: [0, 180, 360, 540] 
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="fixed -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full bg-amber-400/60 blur-md animate-pulse" />
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,1)] border-2 border-white ring-2 ring-amber-300/80">
                  <Star className="w-5 h-5 text-white fill-white drop-shadow-sm" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
    </>
  );
}
