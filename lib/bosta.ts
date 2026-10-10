import { normalizeArabicText, sanitizeEgyptianPhone } from './shipping';

// Bosta Egyptian governorates / cities catalog
export interface BostaCity {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

export const BOSTA_CITIES: BostaCity[] = [
  { id: 'FceDyHXwpSYYF9zGW', code: 'EG-01', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { id: '0064Qb0OgcA', code: 'EG-25', nameAr: 'الجيزة', nameEn: 'Giza' },
  { id: 'Jrb6X6ucjiYgMP4T7', code: 'EG-02', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
  { id: 'yp3atroeTwnyiBNKE', code: 'EG-06', nameAr: 'القليوبية', nameEn: 'El Kalioubia' },
  { id: 'ruBSjGBDX9wpRa3cc', code: 'EG-09', nameAr: 'المنوفية', nameEn: 'Monufia' },
  { id: 'K3RwC677J8kJytdZD', code: 'EG-07', nameAr: 'الغربية', nameEn: 'Gharbia' },
  { id: 'RrDhS8YYsXAwZ9Zfo', code: 'EG-05', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
  { id: 'g3GchTSmCgR2JynsJ', code: 'EG-04', nameAr: 'البحيرة', nameEn: 'Behira' },
  { id: 'ByP7rFCjL6XzF6j4S', code: 'EG-08', nameAr: 'كفر الشيخ', nameEn: 'Kafr Alsheikh' },
  { id: 'qoZvYcZ8Cqji4pGp5', code: 'EG-14', nameAr: 'دمياط', nameEn: 'Damietta' },
  { id: 'skFtf6ZmKo8kBEBDK', code: 'EG-13', nameAr: 'بورسعيد', nameEn: 'Port Said' },
  { id: 'PJqNriLtFtx2cfkKP', code: 'EG-11', nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
  { id: 'PickurJ5uJZ9rDTHW', code: 'EG-12', nameAr: 'السويس', nameEn: 'Suez' },
  { id: '6ExcoGbpYHnggP8JD', code: 'EG-10', nameAr: 'الشرقية', nameEn: 'Sharqia' },
  { id: 'LzbbvTzZ7D2CgE2PL', code: 'EG-16', nameAr: 'بني سويف', nameEn: 'Bani Suif' },
  { id: 'BW5MiNxEirB7tuz2y', code: 'EG-15', nameAr: 'الفيوم', nameEn: 'Fayoum' },
  { id: 'si6eLnKjXqTFTMBj9', code: 'EG-19', nameAr: 'المنيا', nameEn: 'Menya' },
  { id: '7mDPAohM3ArSZmWTm', code: 'EG-17', nameAr: 'أسيوط', nameEn: 'Assuit' },
  { id: 'n3EENg2adhuR9xBZK', code: 'EG-18', nameAr: 'سوهاج', nameEn: 'Sohag' },
  { id: 'vfTHTes3uGjAszgtg', code: 'EG-20', nameAr: 'قنا', nameEn: 'Qena' },
  { id: 'wgYEdH2WMzxGE2Ztp', code: 'EG-22', nameAr: 'الأقصر', nameEn: 'Luxor' },
  { id: 'kLvZ5JY6LJPL5chzN', code: 'EG-21', nameAr: 'أسوان', nameEn: 'Aswan' },
  { id: 'r5TscLCNSjR2GimxQ', code: 'EG-23', nameAr: 'البحر الأحمر', nameEn: 'Red Sea' },
  { id: 'KBpGiRZJMIx', code: 'EG-28', nameAr: 'مطروح', nameEn: 'Matrouh' },
  { id: 'w4yDVHVJWqa4HpbzA', code: 'EG-24', nameAr: 'الوادي الجديد', nameEn: 'New Valley' },
  { id: 'nG_c44vHQht', code: 'EG-26', nameAr: 'جنوب سيناء', nameEn: 'South Sinai' },
  { id: 'ZuCaDAVQlPT', code: 'EG-27', nameAr: 'شمال سيناء', nameEn: 'North Sinai' },
  { id: '2hGtNLfRgqGrJjnW9', code: 'EG-03', nameAr: 'الساحل الشمالي', nameEn: 'North Coast' }
];

/**
 * Maps a given city name to the matching Bosta City record.
 */
export function getBostaCity(rawCityName: string): BostaCity | null {
  if (!rawCityName) return null;
  const target = normalizeArabicText(rawCityName);
  const targetLower = rawCityName.trim().toLowerCase();

  for (const city of BOSTA_CITIES) {
    const normAr = normalizeArabicText(city.nameAr);
    const normEn = city.nameEn.toLowerCase();

    if (
      target === normAr ||
      target.includes(normAr) ||
      normAr.includes(target) ||
      targetLower === normEn ||
      targetLower.includes(normEn)
    ) {
      return city;
    }
  }

  // Common aliases mapping
  if (target.includes('بور سعيد') || target.includes('بورسعيد')) {
    return BOSTA_CITIES.find(c => c.code === 'EG-13') || null;
  }
  if (target.includes('اسكندريه') || target.includes('اسكندرية') || target.includes('alex')) {
    return BOSTA_CITIES.find(c => c.code === 'EG-02') || null;
  }
  if (target.includes('مصر') || target.includes('cairo')) {
    return BOSTA_CITIES.find(c => c.code === 'EG-01') || null;
  }
  if (target.includes('جيزه') || target.includes('giza')) {
    return BOSTA_CITIES.find(c => c.code === 'EG-25') || null;
  }

  return null;
}

// Cached token for email/password authentication
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Resolves the Bosta Base URL (production or staging).
 */
export function getBostaBaseUrl(): string {
  const url = (process.env.BOSTA_BASE_URL || 'https://app.bosta.co').trim();
  return url.replace(/\/+$/, '');
}

/**
 * Resolves the authorization headers for Bosta API.
 * Uses BOSTA_API_KEY if present, otherwise logs in using BOSTA_EMAIL and BOSTA_PASSWORD.
 */
export async function getBostaAuthHeaders(): Promise<Record<string, string>> {
  const apiKey = (process.env.BOSTA_API_KEY || '').trim();
  if (apiKey) {
    return {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'X-Requested-By': 'Gold-Clean-Store'
    };
  }

  // Fallback to email/password authentication
  const email = (process.env.BOSTA_EMAIL || '').trim();
  const password = (process.env.BOSTA_PASSWORD || '').trim();

  if (!email || !password) {
    throw new Error(
      'بيانات الاتصال بشركة بوسطة غير متوفرة. يرجى إضافة BOSTA_API_KEY أو BOSTA_EMAIL و BOSTA_PASSWORD في متغيرات البيئة (Vercel).'
    );
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return {
      'Authorization': cachedToken,
      'Content-Type': 'application/json',
      'X-Requested-By': 'Gold-Clean-Store'
    };
  }

  const baseUrl = getBostaBaseUrl();
  const loginRes = await fetch(`${baseUrl}/api/v2/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-By': 'Gold-Clean-Store'
    },
    body: JSON.stringify({ email, password })
  });

  if (!loginRes.ok) {
    const errorData = await loginRes.json().catch(() => ({}));
    throw new Error(
      errorData.message || `فشل تسجيل الدخول لحساب بوسطة (${loginRes.status})`
    );
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;

  if (!token) {
    throw new Error('لم يتم استلام رمز التفويض (Token) من بوسطة');
  }

  cachedToken = token;
  // Cache for 6 hours
  tokenExpiresAt = now + 6 * 60 * 60 * 1000;

  return {
    'Authorization': token,
    'Content-Type': 'application/json',
    'X-Requested-By': 'Gold-Clean-Store'
  };
}

export interface CreateBostaDeliveryParams {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  customerEmail?: string;
  notes?: string;
  totalPrice: number;
  itemsCount: number;
  itemsDescription: string;
}

export interface BostaDeliveryResult {
  success: boolean;
  trackingNumber: string;
  deliveryId: string;
  state?: string;
  message?: string;
  raw?: any;
}

/**
 * Creates a standard delivery order in Bosta via API v2.
 */
export async function createBostaDelivery(
  params: CreateBostaDeliveryParams
): Promise<BostaDeliveryResult> {
  const baseUrl = getBostaBaseUrl();
  const headers = await getBostaAuthHeaders();

  // Split customer name into first and last name
  const nameParts = (params.customerName || 'عميل').trim().split(/\s+/);
  const firstName = nameParts[0] || 'عميل';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.';

  const cleanPhone = sanitizeEgyptianPhone(params.customerPhone);
  const bostaCity = getBostaCity(params.customerCity);
  const cityCode = bostaCity?.code || 'EG-01';

  // Address must be at least 5 characters per Bosta validation
  let addressLine = (params.customerAddress || '').trim();
  if (addressLine.length < 5) {
    addressLine = `${addressLine} - ${params.customerCity}`.trim();
  }
  if (addressLine.length < 5) {
    addressLine = `عنوان العميل: ${params.customerCity}`;
  }

  // Build notes combining customer notes and products summary
  let deliveryNotes = '';
  if (params.itemsDescription && params.notes) {
    deliveryNotes = `المحتويات: ${params.itemsDescription} | ملاحظات: ${params.notes}`.slice(0, 250);
  } else if (params.itemsDescription) {
    deliveryNotes = `المحتويات: ${params.itemsDescription}`.slice(0, 250);
  } else if (params.notes) {
    deliveryNotes = String(params.notes).slice(0, 250);
  }

  const payload: any = {
    type: 10, // 10 = Forward / Standard Delivery
    specs: {
      packageType: 'Parcel',
      size: 'SMALL',
      packageDetails: {
        itemsCount: Math.max(1, params.itemsCount || 1),
        description: (params.itemsDescription || 'منتجات جولد كلين').slice(0, 100)
      }
    },
    cod: Math.max(0, Math.round(Number(params.totalPrice) || 0)),
    dropOffAddress: {
      firstLine: addressLine,
      city: cityCode
    },
    businessReference: String(params.orderId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
    receiver: {
      firstName: firstName.slice(0, 40),
      lastName: lastName.slice(0, 40),
      phone: cleanPhone,
      email: params.customerEmail ? String(params.customerEmail).trim() : undefined
    },
    notes: deliveryNotes
  };

  // Optional pickup location
  if (process.env.BOSTA_BUSINESS_LOCATION_ID) {
    payload.businessLocationId = process.env.BOSTA_BUSINESS_LOCATION_ID.trim();
  }

  const response = await fetch(`${baseUrl}/api/v2/deliveries?apiVersion=1`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.message || data.error || `خطأ من شركة بوسطة (${response.status})`;
    throw new Error(errorMsg);
  }

  const deliveryData = data.data || data;
  const trackingNumber = String(deliveryData.trackingNumber || '').trim();
  const deliveryId = String(deliveryData._id || deliveryData.id || '').trim();

  if (!trackingNumber && !deliveryId) {
    throw new Error(data.message || 'لم يتم استلام رقم الشحنة من بوسطة');
  }

  return {
    success: true,
    trackingNumber: trackingNumber || deliveryId,
    deliveryId: deliveryId || trackingNumber,
    state: deliveryData.state || 'Pickup requested',
    message: data.message || 'تم إنشاء الشحنة بنجاح',
    raw: deliveryData
  };
}

/**
 * Tracks a Bosta shipment by tracking number.
 */
export async function trackBostaShipment(trackingNumber: string) {
  const baseUrl = getBostaBaseUrl();
  const headers = await getBostaAuthHeaders();

  const response = await fetch(`${baseUrl}/api/v2/deliveries/${encodeURIComponent(trackingNumber)}/tracking`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `تعذر تتبع الشحنة (${response.status})`);
  }

  return await response.json();
}

/**
 * Generates or downloads the printable Air Waybill (AWB) for a delivery.
 */
export async function getBostaAWB(deliveryId: string) {
  const baseUrl = getBostaBaseUrl();
  const headers = await getBostaAuthHeaders();

  const response = await fetch(`${baseUrl}/api/v2/deliveries/awb/${encodeURIComponent(deliveryId)}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `تعذر جلب البوليصة (${response.status})`);
  }

  return await response.json();
}
