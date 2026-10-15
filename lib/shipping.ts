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

// Helper to format Egyptian mobile/phone to strict 11 digits (010, 011, 012, 015)
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

/**
 * Cleans product names for warehouse packing workers and shipping labels:
 * - Strips emojis (✨🌸🧼 etc.) that distort BiDi layout and clutter thermal labels
 * - Eliminates repetitive store prefixes (like "GC - " or "GC ")
 * - Fixes Arabic-English-Number BiDi inversion traps (e.g. "3 - GC لتر" -> "3 لتر")
 * - Corrects English variant names (e.g. "AQ Violet - معطر للجو" -> "معطر للجو (AQ Violet)")
 * - Normalizes punctuation and whitespace
 */
export function cleanProductNameForWorkers(rawName?: any): string {
  if (!rawName) return '';
  let str = String(rawName);

  // 1. Remove all emojis (marketing sparkles, flowers, soaps, etc.)
  str = str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');

  // 2. Remove common store prefixes like 'GC - ' or 'GC ' or 'GC:'
  str = str.replace(/^GC\s*[-–—:]\s*/i, '');
  str = str.replace(/^GC\s+/i, '');

  // 3. Fix BiDi inverted patterns with volume/units:
  // e.g., '3 - GC لتر' or 'GC - 3 لتر' -> '3 لتر'
  str = str.replace(/(\d+)\s*[-–—]\s*GC\s*(لتر|مل|كجم|جرام|جم|سم)/gi, '$1 $2');
  str = str.replace(/GC\s*[-–—]\s*(\d+)\s*(لتر|مل|كجم|جرام|جم|سم)/gi, '$1 $2');
  str = str.replace(/([A-Za-z0-9]+)\s*[-–—]\s*(\d+)\s*(لتر|مل|كجم|جرام|جم|سم)/gi, '$2 $3 ($1)');
  str = str.replace(/(\d+)\s*[-–—]\s*([A-Za-z0-9]+)\s*(لتر|مل|كجم|جرام|جم|سم)/gi, '$1 $3 ($2)');

  // 4. If string starts with Latin code/variant prefix followed by Arabic text:
  // e.g. 'AQ Violet - معطر للجو والمفروشات' -> 'معطر للجو والمفروشات (AQ Violet)'
  const latinPrefixMatch = str.match(/^([A-Za-z0-9\s_-]+)\s*[-–—:]\s*([\u0600-\u06FF].+)$/);
  if (latinPrefixMatch) {
    const latinPart = latinPrefixMatch[1].trim();
    const arabicPart = latinPrefixMatch[2].trim();
    if (/^GC$/i.test(latinPart)) {
      str = arabicPart;
    } else {
      str = `${arabicPart} (${latinPart})`;
    }
  }

  // 5. Clean up redundant dashes or punctuation
  str = str.replace(/\s*[-–—]\s*$/, '');
  str = str.replace(/^\s*[-–—]\s*/, '');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Formats order items into an ultra-readable, unambiguous summary for Bosta API & warehouse workers:
 * e.g.:
 * • عدد (3): المنظف الشامل (متعدد الاستخدام)
 * • عدد (1): معطر ومنعم ملابس 3 لتر
 * • عدد (1): معطر للجو والمفروشات (AQ Violet)
 * • عدد (1): معطر القصور - ريكافري
 * 
 * Safely adheres to Bosta max length limit (200 characters) without truncating words.
 */
export function formatOrderItemsForShipping(
  items: Array<{ name?: string; productName?: string; code?: string; quantity: number }>,
  maxLen: number = 200
): string {
  if (!items || items.length === 0) return 'منتجات جولد كلين';

  // Format 1: '• عدد (X): [اسم المنتج]' with newline
  const primaryLines = items.map(it => {
    const qty = Number(it.quantity) || 1;
    const cleanName = cleanProductNameForWorkers(it.name || it.productName || it.code || 'منتج');
    return `• عدد (${qty}): ${cleanName}`;
  });

  const fullWithNewlines = primaryLines.join('\n');
  if (fullWithNewlines.length <= maxLen) {
    return fullWithNewlines;
  }

  // Fallback 1: Compact '• (X) [اسم المنتج]' with newline
  const compactLines = items.map(it => {
    const qty = Number(it.quantity) || 1;
    const cleanName = cleanProductNameForWorkers(it.name || it.productName || it.code || 'منتج');
    return `• (${qty}) ${cleanName}`;
  });
  const compactWithNewlines = compactLines.join('\n');
  if (compactWithNewlines.length <= maxLen) {
    return compactWithNewlines;
  }

  // Fallback 2: Single line with bullet separators
  const compactSingleLine = compactLines.join(' ');
  if (compactSingleLine.length <= maxLen) {
    return compactSingleLine;
  }

  // Fallback 3: Pack maximum full items and append remaining count
  const packed: string[] = [];
  let currentLen = 0;
  for (let i = 0; i < compactLines.length; i++) {
    const line = compactLines[i];
    const sepLen = packed.length > 0 ? 1 : 0;
    const remaining = compactLines.length - (i + 1);
    const suffix = remaining > 0 ? ` • +${remaining} أصناف` : '';
    if (currentLen + sepLen + line.length + suffix.length <= maxLen) {
      packed.push(line);
      currentLen += sepLen + line.length;
    } else {
      if (remaining >= 0) {
        packed.push(`• +${compactLines.length - i} أصناف`);
      }
      break;
    }
  }

  return packed.join(' ') || compactSingleLine.slice(0, maxLen);
}

/**
 * Generates a clean, copyable / printable warehouse packing slip text with checkboxes:
 * Ready to paste in WhatsApp to warehouse workers or print on standard receipt/paper.
 */
export function generateOrderPackingSlipText(
  order: {
    id?: string;
    customerName?: string;
    customerPhone?: string;
    customerCity?: string;
    customerAddress?: string;
    notes?: string;
    totalPrice?: number;
    shippingInfo?: any;
    items?: any[];
  },
  offers: any[] = [],
  products: any[] = []
): string {
  const orderId = (order.id || '').substring(0, 8).toUpperCase();
  const phone = order.customerPhone || '';
  const city = order.customerCity || '';
  const address = order.customerAddress || '';
  const tracking = order.shippingInfo?.trackingNumber || order.shippingInfo?.billCode || '';

  const physicalItems: Array<{ name: string; quantity: number; code?: string }> = [];

  for (const it of (order.items || [])) {
    const isOffer = it.isOffer || (typeof it.productId === 'string' && it.productId.startsWith('offer-'));
    const matchingOffer = offers.find(o => `offer-${o.id}` === it.productId || o.id === it.productId);
    const bundle = it.bundleItems && it.bundleItems.length > 0
      ? it.bundleItems
      : (matchingOffer?.items || null);

    if (bundle && Array.isArray(bundle) && bundle.length > 0) {
      for (const sub of bundle) {
        const subProd = products.find(p => p.id === sub.productId);
        const subCode = sub.productCode || subProd?.code || '';
        const subQty = (Number(sub.quantity) || 1) * (Number(it.quantity) || 1);
        physicalItems.push({
          name: cleanProductNameForWorkers(sub.productName),
          quantity: subQty,
          code: subCode
        });
      }
    } else {
      const codeDisplay = it.productCode || products.find(p => p.id === it.productId)?.code || '';
      physicalItems.push({
        name: cleanProductNameForWorkers(it.productName),
        quantity: Number(it.quantity) || 1,
        code: codeDisplay
      });
    }
  }

  const aggMap = new Map<string, { name: string; quantity: number; code?: string }>();
  for (const item of physicalItems) {
    const existing = aggMap.get(item.name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      aggMap.set(item.name, { ...item });
    }
  }
  const aggregated = Array.from(aggMap.values());
  const totalPieces = aggregated.reduce((sum, it) => sum + it.quantity, 0);

  const lines: string[] = [
    `📦 إذن تجهيز شحنة: #${orderId}`,
    `👤 العميل: ${order.customerName || 'عميل'} (${phone})`,
    `📍 العنوان: ${city} - ${address}`,
    tracking ? `🚚 رقم بوليصة الشحن (بوسطة): ${tracking}` : `🚚 شركة الشحن: بوسطة`,
    `----------------------------------------`,
    `📋 الأصناف المطلوب وضعها في الكرتونة (إجمالي ${totalPieces} قطعة):`
  ];

  aggregated.forEach((it) => {
    const codeTag = it.code ? ` [كود: ${it.code}]` : '';
    lines.push(`[  ] عدد (${it.quantity}) : ${it.name}${codeTag}`);
  });

  lines.push(`----------------------------------------`);
  if (order.totalPrice !== undefined) {
    lines.push(`💵 المبلغ المطلوب تحصيله (COD): ${order.totalPrice.toFixed(2)} ج.م`);
  }
  if (order.notes && String(order.notes).trim()) {
    lines.push(`📝 ملاحظة العميل: ${String(order.notes).trim()}`);
  }

  return lines.join('\n');
}
