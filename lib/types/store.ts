// lib/types/store.ts

export interface Category {
  id?: string;
  name: string;
  key: string;
}

export interface Product {
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

export interface OfferItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  volume?: string;
}

export interface Offer {
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
  isFreeShipping?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isOffer?: boolean;
  offerDetails?: {
    offerId: string;
    items: OfferItem[];
    originalPrice: number;
    offerPrice: number;
    savings: number;
    isFreeShipping?: boolean;
  };
}

export interface ShippingInfo {
  billCode?: string;
  trackingNumber?: string;
  deliveryId?: string;
  sortingCode?: string;
  courier?: string;
  status?: string;
  txlogisticId?: string;
  syncedAt?: any;
  error?: string;
  skuUpdated?: boolean;
  skuUpdatedSummary?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  price: number;
  isOffer?: boolean;
  bundleItems?: Array<{
    productId: string;
    productName: string;
    productCode?: string;
    quantity: number;
  }>;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerCountry?: string;
  customerCity: string;
  customerAddress: string;
  notes: string;
  items: OrderItem[];
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

export const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'jalalmahmoud8000@gmail.com',
  'jalalmahmoud8000%40gmail.com'
].filter(Boolean) as string[];

export const isUserMasterAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(adm => adm.toLowerCase() === clean);
};

export const formatOrderDate = (createdAt: any): string => {
  if (!createdAt) return 'تاريخ غير محدد';
  try {
    let date: Date;
    if (typeof createdAt?.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt?.seconds !== undefined) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt?._seconds !== undefined) {
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

export const getOrderDateObj = (createdAt: any): Date | null => {
  if (!createdAt) return null;
  try {
    let date: Date;
    if (typeof createdAt?.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt?.seconds !== undefined) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt?._seconds !== undefined) {
      date = new Date(createdAt._seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

