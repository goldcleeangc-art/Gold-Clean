// lib/pricing.ts
import { Product, ProductTierOffer } from './types/store';

export interface TierPricingCalculation {
  unitPrice: number;
  totalPrice: number;
  savings: number;
  savingsPercent: number;
  appliedTier?: ProductTierOffer;
  isTierApplied: boolean;
  nextTier?: {
    tier: ProductTierOffer;
    neededQty: number;
    additionalSavings: number;
  };
}

/**
 * Calculates effective unit and total pricing for a product given a requested quantity,
 * applying White Friday discounts and volume/tiered discounts.
 */
export function getProductTierPricing(
  product: Product | { price: number; whiteFridayPrice?: number; isWhiteFriday?: boolean; tieredPricing?: ProductTierOffer[] },
  quantity: number
): TierPricingCalculation {
  const basePrice = (product.isWhiteFriday && typeof product.whiteFridayPrice === 'number' && product.whiteFridayPrice > 0)
    ? product.whiteFridayPrice
    : (Number(product.price) || 0);

  const safeQty = Math.max(1, Number(quantity) || 1);
  const baseTotal = basePrice * safeQty;

  const validTiers: ProductTierOffer[] = (product.tieredPricing || [])
    .filter(t => Number(t.quantity) > 0 && Number(t.price) > 0)
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  if (validTiers.length === 0) {
    return {
      unitPrice: basePrice,
      totalPrice: baseTotal,
      savings: 0,
      savingsPercent: 0,
      appliedTier: undefined,
      isTierApplied: false
    };
  }

  // 1. Check for exact tier match
  const exactTier = validTiers.find(t => Number(t.quantity) === safeQty);
  if (exactTier) {
    const totalPrice = Number(exactTier.price);
    const unitPrice = totalPrice / exactTier.quantity;
    const savings = Math.max(0, baseTotal - totalPrice);
    const savingsPercent = baseTotal > 0 ? Math.round((savings / baseTotal) * 100) : 0;

    const higherTiers = validTiers.filter(t => Number(t.quantity) > safeQty);
    const nextTierObj = higherTiers[0];
    const nextTier = nextTierObj ? {
      tier: nextTierObj,
      neededQty: nextTierObj.quantity - safeQty,
      additionalSavings: Math.max(0, (basePrice * nextTierObj.quantity) - nextTierObj.price - savings)
    } : undefined;

    return {
      unitPrice,
      totalPrice,
      savings,
      savingsPercent,
      appliedTier: exactTier,
      isTierApplied: true,
      nextTier
    };
  }

  // 2. Check for best applicable tier (highest tier where tier.quantity <= safeQty)
  const applicableTiers = validTiers.filter(t => Number(t.quantity) <= safeQty);
  if (applicableTiers.length > 0) {
    const bestTier = applicableTiers[applicableTiers.length - 1];
    const tierUnitPrice = Number(bestTier.price) / bestTier.quantity;
    const totalPrice = tierUnitPrice * safeQty;
    const savings = Math.max(0, baseTotal - totalPrice);
    const savingsPercent = baseTotal > 0 ? Math.round((savings / baseTotal) * 100) : 0;

    const higherTiers = validTiers.filter(t => Number(t.quantity) > safeQty);
    const nextTierObj = higherTiers[0];
    const nextTier = nextTierObj ? {
      tier: nextTierObj,
      neededQty: nextTierObj.quantity - safeQty,
      additionalSavings: Math.max(0, (basePrice * nextTierObj.quantity) - nextTierObj.price - savings)
    } : undefined;

    return {
      unitPrice: tierUnitPrice,
      totalPrice,
      savings,
      savingsPercent,
      appliedTier: bestTier,
      isTierApplied: true,
      nextTier
    };
  }

  // 3. Below any tier threshold (e.g. qty = 1, but tiers start at 2)
  const firstTier = validTiers[0];
  const nextTier = firstTier ? {
    tier: firstTier,
    neededQty: firstTier.quantity - safeQty,
    additionalSavings: Math.max(0, (basePrice * firstTier.quantity) - firstTier.price)
  } : undefined;

  return {
    unitPrice: basePrice,
    totalPrice: baseTotal,
    savings: 0,
    savingsPercent: 0,
    appliedTier: undefined,
    isTierApplied: false,
    nextTier
  };
}

export interface DecomposedOffer {
  id: string;             // unique key e.g. `${product.id}-tier-${tier.quantity}` or `${product.id}`
  productId: string;
  product: Product;
  title: string;
  quantity: number;
  price: number;
  originalPrice: number;
  savings: number;
  discountPct: number;
  image: string;
  badge?: string;
  isBundle: boolean;
  tier?: ProductTierOffer;
  category: string;
  volume?: string;
  code?: string;
}

/**
 * Automatically decomposes products into distinct standalone offers for storefront presentation.
 * If a product has tiered pricing (e.g. 2 packs, 3 packs), each tier is extracted
 * as an independent offer card alongside the base single unit offer.
 */
export function getDecomposedProductOffers(products: Product[]): DecomposedOffer[] {
  const result: DecomposedOffer[] = [];

  products.forEach(prod => {
    const regularBase = Number(prod.price) || 0;
    const effectiveBase = (prod.isWhiteFriday && typeof prod.whiteFridayPrice === 'number' && prod.whiteFridayPrice > 0)
      ? prod.whiteFridayPrice
      : regularBase;

    const baseSavings = Math.max(0, regularBase - effectiveBase);
    const baseDiscountPct = regularBase > 0 ? Math.round((baseSavings / regularBase) * 100) : 0;
    const baseImage = (prod.isWhiteFriday && prod.whiteFridayImage) || prod.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=800';

    // 1. The Single Pack Base Offer
    result.push({
      id: prod.id,
      productId: prod.id,
      product: prod,
      title: prod.name,
      quantity: 1,
      price: effectiveBase,
      originalPrice: regularBase,
      savings: baseSavings,
      discountPct: baseDiscountPct,
      image: baseImage,
      badge: prod.isWhiteFriday ? (prod.whiteFridayBadge || 'عرض الجمعة البيضاء 🔥') : undefined,
      isBundle: false,
      category: prod.category,
      volume: prod.volume || '1 لتر',
      code: prod.code
    });

    // 2. Extract Each Tier Bundle as an Independent Standalone Offer
    const validTiers = (prod.tieredPricing || []).filter(t => Number(t.quantity) > 1 && Number(t.price) > 0);
    validTiers.forEach(tier => {
      const tierQty = Number(tier.quantity);
      const tierPrice = Number(tier.price);
      const tierOriginal = regularBase * tierQty;
      const tierSavings = Math.max(0, tierOriginal - tierPrice);
      const tierDiscountPct = tierOriginal > 0 ? Math.round((tierSavings / tierOriginal) * 100) : 0;
      const tierImage = tier.image || baseImage;
      const tierTitle = `عرض ${tierQty} عبوات - ${prod.name}`;

      result.push({
        id: `${prod.id}-tier-${tierQty}`,
        productId: prod.id,
        product: prod,
        title: tierTitle,
        quantity: tierQty,
        price: tierPrice,
        originalPrice: tierOriginal,
        savings: tierSavings,
        discountPct: tierDiscountPct,
        image: tierImage,
        badge: tier.badge || `باقة ${tierQty} عبوات 🔥`,
        isBundle: true,
        tier: tier,
        category: prod.category,
        volume: `${prod.volume ? `${tierQty} × ${prod.volume}` : `${tierQty} عبوات`}`,
        code: prod.code ? `${prod.code}-B${tierQty}` : undefined
      });
    });
  });

  return result;
}
