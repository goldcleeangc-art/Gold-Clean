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
