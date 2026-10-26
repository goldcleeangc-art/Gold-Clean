'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { Product } from '../lib/types/store';

// Custom Hooks
import { useStoreAuth } from '../hooks/useStoreAuth';
import { useStoreData } from '../hooks/useStoreData';
import { useCart } from '../hooks/useCart';
import { useOrdersAndCheckout } from '../hooks/useOrdersAndCheckout';
import { useUrlSync } from '../hooks/useUrlSync';

// Specialized Components
import Navbar from '../components/layout/Navbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import HomeView from '../components/store/HomeView';
import ProductsView from '../components/store/ProductsView';
import OffersView from '../components/store/OffersView';
import AboutView from '../components/store/AboutView';
import ComplaintsSection from '../components/store/ComplaintsSection';
import CartDrawer from '../components/cart/CartDrawer';
import CheckoutModal from '../components/cart/CheckoutModal';
import FlyToCartParticles from '../components/cart/FlyToCartParticles';
import ProductDetailsModal from '../components/modals/ProductDetailsModal';
import AuthModal from '../components/modals/AuthModal';
import OrderTrackerModal from '../components/modals/OrderTrackerModal';

export default function StorePage() {
  // 1. Navigation & Filter UI States
  const [currentTab, setCurrentTab] = useState<'home' | 'products' | 'offers' | 'about' | 'complaints'>('home');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(0);
  const [complaintPrefilledOrderId, setComplaintPrefilledOrderId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Product Details Modal State
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState<boolean>(false);

  // 2. Custom Hooks Initialization
  const authState = useStoreAuth();
  const storeData = useStoreData(authState.user, authState.userRole);
  const cartState = useCart(storeData.products, storeData.offers);
  const checkoutState = useOrdersAndCheckout(
    authState.user,
    cartState.cart,
    cartState.saveCart,
    cartState.subtotal,
    cartState.hasFreeShippingOffer
  );

  // Sync state with URL query parameters
  useUrlSync({
    currentTab,
    setCurrentTab,
    activeCategory,
    setActiveCategory,
    products: storeData.products,
    selectedProductDetails,
    setSelectedProductDetails,
    isProductDetailsOpen,
    setIsProductDetailsOpen
  });

  // 3. Simple UI Helpers
  const handleCopyLink = (productId: string) => {
    const url = `${window.location.origin}/products/${productId}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(productId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const filteredProducts = storeData.products.filter((prod) => {
    const searchMatch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeCategory === 'all' || prod.category === activeCategory;
    const priceMatch = priceRange === 0 || prod.price <= priceRange;
    return searchMatch && categoryMatch && priceMatch;
  });

  const seoStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": storeData.products.filter(p => p.isAvailable).map((p, index) => ({
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

  const totalCartItems = cartState.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoStructuredData) }}
      />
      
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800" id="main-app">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {cartState.addedItemName && (
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
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{cartState.addedItemName}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          pendingComplaintsCount={storeData.pendingComplaintsCount}
          userOrdersCount={checkoutState.userOrders.length}
          userRole={authState.userRole}
          checkingAuth={authState.checkingAuth}
          user={authState.user}
          onSignOut={authState.handleSignOut}
          onOpenAuthModal={() => authState.setIsAuthModalOpen(true)}
          onOpenCart={() => cartState.setIsCartOpen(true)}
          onOpenTracker={() => checkoutState.setIsTrackerOpen(true)}
          cartItemsCount={totalCartItems}
          isCartBouncing={cartState.isCartBouncing}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onResetCategory={() => setActiveCategory('all')}
        />

        {/* MAIN VIEW */}
        <main className="flex-1 flex overflow-hidden relative" id="layout-body">
          {currentTab === 'home' ? (
            <HomeView
              categories={storeData.categories}
              setActiveCategory={setActiveCategory}
              setCurrentTab={setCurrentTab}
              offers={storeData.offers}
              products={storeData.products}
              onAddOfferToCart={cartState.handleAddOfferToCart}
            />
          ) : currentTab === 'about' ? (
            <AboutView />
          ) : currentTab === 'offers' ? (
            <OffersView
              offers={storeData.offers}
              products={storeData.products}
              setCurrentTab={setCurrentTab}
              onAddOfferToCart={cartState.handleAddOfferToCart}
            />
          ) : currentTab === 'complaints' ? (
            <ComplaintsSection
              user={authState.user}
              userOrders={checkoutState.userOrders}
              prefilledOrderId={complaintPrefilledOrderId}
              onClearPrefilledOrder={() => setComplaintPrefilledOrderId(null)}
              onGoToProducts={() => setCurrentTab('products')}
            />
          ) : (
            <ProductsView
              categories={storeData.categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              loading={storeData.loading}
              filteredProducts={filteredProducts}
              onSelectProduct={(p) => {
                setSelectedProductDetails(p);
                setIsProductDetailsOpen(true);
              }}
              onAddToCart={cartState.handleAddToCart}
              copiedLinkId={copiedLinkId}
              onCopyLink={handleCopyLink}
            />
          )}
        </main>

        {/* MOBILE NAV */}
        <MobileBottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          userOrdersCount={checkoutState.userOrders.length}
          cartCount={totalCartItems}
          userRole={authState.userRole}
          onOpenTracker={() => checkoutState.setIsTrackerOpen(true)}
          onOpenCart={() => cartState.setIsCartOpen(true)}
        />

        {/* MODALS & DRAWERS */}
        <CartDrawer
          isOpen={cartState.isCartOpen}
          onClose={() => cartState.setIsCartOpen(false)}
          cart={cartState.cart}
          offers={storeData.offers}
          hasFreeShippingOffer={cartState.hasFreeShippingOffer}
          onUpdateQty={cartState.handleUpdateQty}
          onRemoveItem={cartState.handleRemoveItem}
          onProceedToCheckout={() => {
            cartState.setIsCartOpen(false);
            checkoutState.setIsCheckoutOpen(true);
          }}
          subtotal={cartState.subtotal}
        />

        <CheckoutModal
          isOpen={checkoutState.isCheckoutOpen}
          onClose={() => checkoutState.setIsCheckoutOpen(false)}
          successOrder={checkoutState.successOrder}
          setSuccessOrder={checkoutState.setSuccessOrder}
          user={authState.user}
          userRole={authState.userRole}
          checkoutForm={checkoutState.checkoutForm}
          setCheckoutForm={checkoutState.setCheckoutForm}
          isShippingRatesOpen={checkoutState.isShippingRatesOpen}
          setIsShippingRatesOpen={checkoutState.setIsShippingRatesOpen}
          cart={cartState.cart}
          subtotal={cartState.subtotal}
          shippingCalculation={checkoutState.shippingCalculation}
          hasFreeShippingOffer={cartState.hasFreeShippingOffer}
          currentShippingCost={checkoutState.currentShippingCost}
          checkoutGrandTotal={checkoutState.checkoutGrandTotal}
          orderInProgress={checkoutState.orderInProgress}
          onSubmit={checkoutState.handleCheckoutSubmit}
        />

        <ProductDetailsModal
          isOpen={isProductDetailsOpen}
          onClose={() => {
            setIsProductDetailsOpen(false);
            setSelectedProductDetails(null);
          }}
          product={selectedProductDetails}
          categories={storeData.categories}
          user={authState.user}
          onRateProduct={(prod, rating) => 
            storeData.handleRateProduct(prod, rating, (updated) => setSelectedProductDetails(updated))
          }
          onAddToCart={cartState.handleAddToCart}
          onCopyLink={handleCopyLink}
          copiedLinkId={copiedLinkId}
        />

        <AuthModal
          isOpen={authState.isAuthModalOpen}
          onClose={() => authState.setIsAuthModalOpen(false)}
          onGoogleSignIn={authState.handleGoogleSignIn}
          authError={authState.authError}
        />

        <OrderTrackerModal
          isOpen={checkoutState.isTrackerOpen}
          onClose={() => checkoutState.setIsTrackerOpen(false)}
          userOrders={checkoutState.userOrders}
          isTrackingLoading={checkoutState.isTrackingLoading}
          userOrdersTab={checkoutState.userOrdersTab}
          setUserOrdersTab={checkoutState.setUserOrdersTab}
          onGoToProducts={() => {
            checkoutState.setIsTrackerOpen(false);
            setCurrentTab('products');
          }}
          onFileComplaint={(orderId) => {
            checkoutState.setIsTrackerOpen(false);
            setComplaintPrefilledOrderId(orderId);
            setCurrentTab('complaints');
          }}
          onCancelOrder={checkoutState.handleUserCancelOrder}
        />

        <FlyToCartParticles particles={cartState.flyingParticles} />
      </div>
    </>
  );
}
