export interface ShippingZone {
  id: string;
  name: string;
  baseRate: number; // Flat shipping rate (in EGP)
  extraKgRate: number; // Extra kg rate (0 = fixed flat rate)
  cities: string[];
}

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone_1',
    name: 'المنطقة الأولى',
    baseRate: 60,
    extraKgRate: 0,
    cities: ['القاهرة', 'الجيزة', 'الإسكندرية']
  },
  {
    id: 'zone_2',
    name: 'المنطقة الثانية',
    baseRate: 80,
    extraKgRate: 0,
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
    extraKgRate: 0,
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
    extraKgRate: 0,
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

// Helper to normalize Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) numerals to standard Latin digits (0-9)
export function normalizeArabicNumerals(text: any): string {
  if (!text) return '';
  return String(text)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

// Helper to format Egyptian mobile/phone to strict 11 digits required by J&T API (String(11))
// Handles Arabic numerals, international codes (+20, 0020, 20), and strips unwanted prefixes like "02" before mobile numbers.
export function sanitizeEgyptianPhone(raw: any, fallback: string = '01000000000'): string {
  if (!raw) return fallback;

  // 1. Normalize Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) numerals
  const normalized = normalizeArabicNumerals(raw);

  // 2. Strip all non-digit characters (spaces, dashes, brackets, letters, symbols)
  let digits = normalized.replace(/[^0-9]/g, '');

  // 3. If there is a complete 11-digit Egyptian mobile number starting with 010, 011, 012, or 015 inside the string:
  // This automatically strips any prefixes like "02", "+2", "002", "20", etc. (e.g. 0201012345678 -> 01012345678)
  const mobileMatch = digits.match(/01[0125]\d{8}/);
  if (mobileMatch) {
    return mobileMatch[0];
  }

  // 4. Handle cases where the leading 0 of the mobile was dropped:
  // e.g. 021012345678 (02 + 10...) or 201012345678 (20 + 10...) or 0021012345678 or +21012345678
  const noZeroMatch = digits.match(/(?:^|02|20|002|2)(1[0125]\d{8})$/);
  if (noZeroMatch) {
    return '0' + noZeroMatch[1];
  }

  // 5. If it starts with "02" before other digits, remove "02" prefix
  if (digits.startsWith('02') && digits.length > 2) {
    digits = digits.slice(2);
    if (!digits.startsWith('0')) digits = '0' + digits;
  }

  // 6. Generic country code strips (+20, 0020, 20)
  if (digits.startsWith('0020') && digits.length >= 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // 7. If 10 digits starting with 10, 11, 12, 15 (Egyptian mobile prefixes missing leading 0)
  if (digits.length === 10 && /^(10|11|12|15)/.test(digits)) {
    digits = '0' + digits;
  }

  if (digits.startsWith('01') && digits.length >= 11) {
    return digits.slice(0, 11);
  }

  if (digits.length === 11) {
    return digits;
  }

  return digits.length > 0 ? digits.slice(0, 11).padEnd(11, '0') : fallback;
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

// Calculate shipping cost based on city (fixed flat rate per zone)
export function calculateShipping(
  cityName: string,
  totalWeightKg: number
): ShippingCostResult | null {
  const zone = getZoneByCity(cityName);
  if (!zone) return null;

  const totalWeight = Math.max(0.5, totalWeightKg);
  // Fixed flat shipping cost per zone - no extra weight surcharges
  const extraKg = 0;
  const billableWeight = totalWeight;
  const shippingCost = zone.baseRate;

  return {
    shippingCost,
    baseRate: zone.baseRate,
    extraKgRate: 0,
    extraKg: 0,
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
