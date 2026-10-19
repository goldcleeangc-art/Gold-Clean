'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

// Shared types & helpers
import { 
  Category, 
  Product, 
  Offer, 
  CartItem, 
  Order, 
  ShippingInfo, 
  isUserMasterAdmin 
} from '../lib/types/store';

// Firebase & Auth
import { db, auth, googleProvider } from '../lib/firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Shipping utilities
import {
  calculateShipping,
  calculateCartTotalWeight,
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
import CartDrawer from '../components/cart/CartDrawer';
import CheckoutModal from '../components/cart/CheckoutModal';
import FlyToCartParticles from '../components/cart/FlyToCartParticles';
import ProductDetailsModal from '../components/modals/ProductDetailsModal';
import AuthModal from '../components/modals/AuthModal';
import OrderTrackerModal from '../components/modals/OrderTrackerModal';

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
          let finalRole: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
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
          } else {
            const defaultRole: 'admin' | 'user' = isAdminEmail ? 'admin' : 'user';
            setUserRole(defaultRole);
          }
        }, (error) => {
          const defaultRole: 'admin' | 'user' = isAdminEmail ? 'admin' : 'user';
          if (error.code === 'permission-denied') {
            console.warn("Gracefully handling transient permission issue for role overrides, defaulting role to:", defaultRole);
            setUserRole(defaultRole);
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
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tracking orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userOrdersTab, setUserOrdersTab] = useState<'active' | 'cancelled' | 'past'>('active');
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);

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
      
      const userRef = doc(db, 'users', loggedUser.uid);
      const isAdminEmail = isUserMasterAdmin(loggedUser.email);
      
      const snap = await getDoc(userRef);
      let finalRole: 'user' | 'manager' | 'admin' = isAdminEmail ? 'admin' : 'user';
      if (snap.exists()) {
        finalRole = snap.data().role || finalRole;
      }
      if (isAdminEmail) {
        finalRole = 'admin';
      }

      await setDoc(userRef, {
        email: loggedUser.email || '',
        name: loggedUser.displayName || 'عميل Gold Clean',
        photoURL: loggedUser.photoURL || '',
        role: finalRole,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setAuthError('فشل تسجيل الدخول: ' + (err.message || 'يرجى المحاولة مجدداً'));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole('user');
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
        } else if (shippingData && shippingData.error) {
          orderPayload.shippingInfo = {
            courier: 'Bosta',
            error: shippingData.error,
            lastAttemptAt: new Date().toISOString()
          };
        }
      } catch (shippingErr) {
        console.warn('Silent fallback for shipping creation:', shippingErr);
      }

      await setDoc(orderDocRef, orderPayload);

      // Persist order ID locally for guest visitor tracking
      if (!user) {
        try {
          const savedGuestOrders: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
          if (!savedGuestOrders.includes(generatedOrderId)) {
            savedGuestOrders.unshift(generatedOrderId);
            localStorage.setItem('goldclean_guest_orders', JSON.stringify(savedGuestOrders.slice(0, 20)));
          }
        } catch (e) {
          console.error("Error updating local guest orders:", e);
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

  const handleUserCancelOrder = async (order: Order) => {
    if (!order.id) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled' });
      alert('تم إلغاء طلبك بنجاح.');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إلغاء الطلب. الرجاء المحاولة مرة أخرى.');
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

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex overflow-hidden relative" id="layout-body">
        {currentTab === 'home' ? (
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
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
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

      {/* Fly to Cart Animated Particles */}
      <FlyToCartParticles particles={flyingParticles} />

    </div>
    </>
  );
}
