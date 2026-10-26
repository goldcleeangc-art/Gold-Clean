import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, Product, Offer } from '../lib/types/store';
import { trackAddToCartPixel } from '../lib/pixel';

export function useCart(products: Product[], offers: Offer[]) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState<boolean>(false);
  const [flyingParticles, setFlyingParticles] = useState<Array<{
    id: number; startX: number; startY: number; targetX: number; targetY: number;
  }>>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('clean_minimal_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
  }, []);

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
    } else if (e?.currentTarget) {
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

    setTimeout(() => {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 450);
    }, 600);

    setTimeout(() => {
      setFlyingParticles(prev => prev.filter(p => p.id !== particleId));
    }, 850);
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    triggerFlyAnimation(e);
    const wasCartEmpty = cart.length === 0;
    const existingIdx = cart.findIndex(item => item.product.id === product.id);
    const newCart = [...cart];

    if (existingIdx > -1) {
      newCart[existingIdx].quantity += 1;
    } else {
      newCart.push({ product, quantity: 1 });
    }
    saveCart(newCart);

    setAddedItemName(product.name);
    setTimeout(() => setAddedItemName(null), 2500);
    if (wasCartEmpty) setIsCartOpen(true);

    trackAddToCartPixel(product.id, product.name, product.price);
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
      image: offer.image || (offer.items?.[0]?.image || ''),
      volume: `${(offer.items || []).reduce((sum, it) => sum + it.quantity, 0)} قطع`,
      isAvailable: offer.isAvailable,
      rating: 5,
      reviewsCount: 1
    };

    const existingIdx = cart.findIndex(item => item.product.id === offerProductId);
    const newCart = [...cart];

    if (existingIdx > -1) {
      newCart[existingIdx].quantity += 1;
    } else {
      newCart.push({
        product: offerPseudoProduct,
        quantity: 1,
        isOffer: true,
        offerDetails: {
          offerId: offer.id,
          items: (offer.items || []).map(it => ({
            ...it,
            productCode: it.productCode || products.find(p => p.id === it.productId)?.code || ''
          })),
          originalPrice: offer.originalPrice,
          offerPrice: offer.offerPrice,
          savings: offer.savings || Math.max(0, offer.originalPrice - offer.offerPrice),
          isFreeShipping: Boolean(offer.isFreeShipping)
        }
      });
    }
    saveCart(newCart);

    setAddedItemName(`باقة: ${offer.title}`);
    setTimeout(() => setAddedItemName(null), 2500);
    if (wasCartEmpty) setIsCartOpen(true);

    trackAddToCartPixel(offer.id, `باقة: ${offer.title}`, offer.offerPrice);
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
    saveCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const hasFreeShippingOffer = useMemo(() => {
    return cart.some(item => {
      if (!item.isOffer) return false;
      if (item.offerDetails?.isFreeShipping) return true;
      const offerId = item.offerDetails?.offerId || item.product.id.replace('offer-', '');
      return offers.find(o => o.id === offerId)?.isFreeShipping === true;
    });
  }, [cart, offers]);

  return {
    cart,
    saveCart,
    isCartOpen,
    setIsCartOpen,
    addedItemName,
    flyingParticles,
    isCartBouncing,
    subtotal,
    hasFreeShippingOffer,
    handleAddToCart,
    handleAddOfferToCart,
    handleUpdateQty,
    handleRemoveItem
  };
}