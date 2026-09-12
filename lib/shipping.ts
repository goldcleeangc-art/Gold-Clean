export interface ShippingZone {
  id: string;
  name: string;
  baseRate: number; // For first 1 kg (in EGP)
  extraKgRate: number; // For each additional kg (in EGP)
  cities: string[];
}

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone_1',
    name: 'المنطقة الأولى',
    baseRate: 60,
    extraKgRate: 3,
    cities: ['القاهرة', 'الجيزة', 'الإسكندرية']
  },
  {
    id: 'zone_2',
    name: 'المنطقة الثانية',
    baseRate: 80,
    extraKgRate: 5,
    cities: [
      'القليوبية',
      'المنوفية',
      'الغربية',
      'الدقهلية',
      'البحيرة',
      'كفر الشيخ',
      'دمياط',
      'بورسعيد',
      'الإسماعيلية',
      'السويس',
      'الشرقية'
    ]
  },
  {
    id: 'zone_3',
    name: 'المنطقة الثالثة',
    baseRate: 90,
    extraKgRate: 7,
    cities: [
      'بني سويف',
      'الفيوم',
      'المنيا',
      'أسيوط',
      'سوهاج',
      'قنا',
      'الأقصر',
      'أسوان',
      'البحر الأحمر'
    ]
  },
  {
    id: 'zone_4',
    name: 'المنطقة الرابعة',
    baseRate: 140,
    extraKgRate: 10,
    cities: ['مطروح', 'الوادي الجديد', 'جنوب سيناء', 'شمال سيناء']
  }
];

// Helper to normalize Arabic strings for comparison
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics / tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Find zone by city name
export function getZoneByCity(cityName: string): ShippingZone | null {
  if (!cityName) return null;
  const normalizedTarget = normalizeArabicText(cityName);

  for (const zone of SHIPPING_ZONES) {
    for (const city of zone.cities) {
      const normalizedCity = normalizeArabicText(city);
      if (
        normalizedTarget === normalizedCity ||
        normalizedTarget.includes(normalizedCity) ||
        normalizedCity.includes(normalizedTarget)
      ) {
        return zone;
      }
    }
  }

  return null;
}

// Parse numeric weight from product volume or description (returns weight in kg)
export function parseProductWeight(product: {
  volume?: string;
  weight?: number;
}): number {
  if (typeof product.weight === 'number' && product.weight > 0) {
    return product.weight;
  }

  const volStr = product.volume || '';
  if (!volStr) return 1.0; // Default 1 kg

  // Convert Arabic-indic digits to ASCII
  const asciiStr = volStr.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // Match number
  const numMatch = asciiStr.match(/(\d+(\.\d+)?)/);
  if (!numMatch) return 1.0;

  const val = parseFloat(numMatch[1]);
  if (isNaN(val) || val <= 0) return 1.0;

  const lower = asciiStr.toLowerCase();

  // If liters or kilograms
  if (
    lower.includes('لتر') ||
    lower.includes('كيلو') ||
    lower.includes('كجم') ||
    lower.includes('كغ') ||
    lower.includes('kg') ||
    lower.includes('liter') ||
    lower.includes('l')
  ) {
    return val;
  }

  // If milliliters or grams
  if (
    lower.includes('مل') ||
    lower.includes('جرام') ||
    lower.includes('جم') ||
    lower.includes('ml') ||
    lower.includes('g')
  ) {
    return val / 1000.0;
  }

  // Fallback: if value is reasonably between 0.1 and 30, treat as kg, else 1 kg
  return val <= 30 ? val : 1.0;
}

// Calculate total weight of a cart
export function calculateCartTotalWeight(cart: Array<{
  product: {
    id: string;
    name: string;
    volume?: string;
    weight?: number;
  };
  quantity: number;
  isOffer?: boolean;
  offerDetails?: {
    items?: Array<{
      quantity: number;
      volume?: string;
    }>;
  };
}>): number {
  let total = 0;

  for (const item of cart) {
    const qty = Number(item.quantity) || 1;

    if (item.isOffer && item.offerDetails?.items && item.offerDetails.items.length > 0) {
      // Sum weight of each item in the bundle
      let bundleWeight = 0;
      for (const subItem of item.offerDetails.items) {
        const subQty = Number(subItem.quantity) || 1;
        const subWeight = parseProductWeight({ volume: subItem.volume });
        bundleWeight += subWeight * subQty;
      }
      total += (bundleWeight > 0 ? bundleWeight : 1.0) * qty;
    } else {
      const itemWeight = parseProductWeight(item.product);
      total += itemWeight * qty;
    }
  }

  return Math.max(0.5, Math.round(total * 100) / 100);
}

export interface ShippingCostResult {
  shippingCost: number;
  baseRate: number;
  extraKgRate: number;
  extraKg: number;
  totalWeight: number;
  billableWeight: number;
  zone: ShippingZone;
}

// Calculate shipping cost based on city and cart total weight
export function calculateShipping(
  cityName: string,
  totalWeightKg: number
): ShippingCostResult | null {
  const zone = getZoneByCity(cityName);
  if (!zone) return null;

  const totalWeight = Math.max(0.5, totalWeightKg);
  // Base rate covers up to 1 kg. Additional kg is rounded up to next full kg.
  const extraKg = totalWeight > 1.0 ? Math.ceil(totalWeight - 1.0) : 0;
  const billableWeight = 1.0 + extraKg;
  const shippingCost = zone.baseRate + extraKg * zone.extraKgRate;

  return {
    shippingCost,
    baseRate: zone.baseRate,
    extraKgRate: zone.extraKgRate,
    extraKg,
    totalWeight,
    billableWeight,
    zone
  };
}

// Calculate COD (Cash On Delivery) service fee (for merchant info / statistics)
export function calculateCodServiceFee(orderTotal: number): number {
  if (orderTotal <= 500) {
    return 5;
  }
  return Math.round(orderTotal * 0.01 * 100) / 100;
}
