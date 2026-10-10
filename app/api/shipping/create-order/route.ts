import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createBostaDelivery } from '@/lib/bosta';
import { sanitizeEgyptianPhone } from '@/lib/shipping';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyManagerAuth } from '@/lib/auth-server';

// Helper to extract clean SKU code from productCode or text (name/id)
function extractSkuCode(rawCode?: any, rawName?: any, rawId?: any, fallbackIndex: number = 1): string {
  let code = String(rawCode || '').trim();
  if (!code) {
    const text = String(rawName || rawId || '');
    const match = text.match(/\b([A-Za-z]{1,4}[-_]?\d{1,4})\b/);
    if (match) {
      code = match[1].toUpperCase().replace('-', '');
    }
  }
  return code || `GC0${fallbackIndex}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Either authorized manager OR rate-limited customer checkout
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let isManager = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const authResult = await verifyManagerAuth(req);
      if (authResult.isAuthorized) {
        isManager = true;
      }
    }

    if (!isManager) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'anonymous';
      const rateCheck = checkRateLimit(`shipping_create_${ip}`, 10, 5 * 60 * 1000);
      if (!rateCheck.success) {
        return NextResponse.json(
          { success: false, error: 'تم تجاوز الحد المسموح به من الطلبات مؤقتاً، يرجى الانتظار قليلاً.' },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const {
      orderId,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerEmail,
      notes,
      items = [],
      totalPrice = 0,
      billCode = '',
      trackingNumber = '',
      deliveryId = '',
      forceRecreate = false
    } = body;

    const existingCode = String(trackingNumber || billCode).trim();

    // Prevent duplicate orders in Bosta:
    if (existingCode && !forceRecreate) {
      return NextResponse.json({
        success: true,
        duplicatePrevented: true,
        msg: `تم منع تكرار الطلب: الطلب مسجل مسبقاً لدى شركة بوسطة برقم الشحنة (${existingCode}).`,
        trackingNumber: existingCode,
        deliveryId: deliveryId || existingCode,
        billCode: existingCode,
        courier: 'Bosta'
      });
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'بيانات العميل (الاسم ورقم الهاتف) مطلوبة لإنشاء الشحنة' },
        { status: 400 }
      );
    }

    const sanitizedOrderId = orderId ? String(orderId).replace(/[^a-zA-Z0-9_-]/g, '') : `ORD${Date.now()}`;

    // Expand offer/bundle items into constituent individual products
    for (const it of (items || [])) {
      const isOffer = (typeof it.productId === 'string' && it.productId.startsWith('offer-')) || Boolean(it.isOffer);
      const hasNoBundleItems = !it.bundleItems || !Array.isArray(it.bundleItems) || it.bundleItems.length === 0;
      if (isOffer && hasNoBundleItems) {
        try {
          const offerDocId = String(it.productId || it.id || '').replace(/^offer-/, '');
          if (offerDocId) {
            const offerSnap = await getDoc(doc(db, 'offers', offerDocId));
            if (offerSnap.exists()) {
              const offerData = offerSnap.data();
              if (Array.isArray(offerData.items) && offerData.items.length > 0) {
                it.bundleItems = offerData.items;
              }
            }
          }
        } catch (err) {
          console.warn('Fallback fetch for offer bundle items failed:', err);
        }
      }
    }

    interface PhysicalItem {
      code: string;
      name: string;
      quantity: number;
    }

    const physicalItems: PhysicalItem[] = [];

    for (let itemIdx = 0; itemIdx < (items || []).length; itemIdx++) {
      const it = (items || [])[itemIdx];
      const parentQty = Number(it.quantity) || 1;
      const subItems = it.bundleItems || it.items || it.subItems;

      if (Array.isArray(subItems) && subItems.length > 0) {
        // Expand bundle into individual products
        for (let subIdx = 0; subIdx < subItems.length; subIdx++) {
          const sub = subItems[subIdx];
          let subCode = sub.productCode || sub.code;

          if (!subCode && sub.productId) {
            try {
              const prodSnap = await getDoc(doc(db, 'products', sub.productId));
              if (prodSnap.exists()) {
                subCode = prodSnap.data()?.code || '';
              }
            } catch (err) {
              // fallback
            }
          }

          const cleanSubCode = extractSkuCode(subCode, sub.productName || sub.name, sub.productId || sub.id, subIdx + 1);
          const perBundleQty = Number(sub.quantity) || 1;
          const totalSubQty = perBundleQty * parentQty;
          physicalItems.push({
            code: cleanSubCode,
            name: String(sub.productName || sub.name || cleanSubCode),
            quantity: totalSubQty
          });
        }
      } else {
        // Regular individual product
        let itemCode = it.productCode || it.code;

        if (!itemCode && it.productId) {
          try {
            const prodSnap = await getDoc(doc(db, 'products', it.productId));
            if (prodSnap.exists()) {
              itemCode = prodSnap.data()?.code || '';
            }
          } catch (err) {
            // fallback
          }
        }

        const cleanItemCode = extractSkuCode(itemCode, it.productName || it.itemName, it.productId || it.id, itemIdx + 1);
        physicalItems.push({
          code: cleanItemCode,
          name: String(it.productName || it.itemName || cleanItemCode),
          quantity: parentQty
        });
      }
    }

    // Aggregate quantities by product SKU code
    const skuAggregatedMap = new Map<string, { code: string; name: string; quantity: number }>();
    physicalItems.forEach(item => {
      const existing = skuAggregatedMap.get(item.code);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        skuAggregatedMap.set(item.code, { ...item });
      }
    });
    const finalPhysicalItems = Array.from(skuAggregatedMap.values());

    const totalItemQuantity = finalPhysicalItems.length > 0
      ? finalPhysicalItems.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)
      : 1;

    // Build Code-based summary: e.g. "2x GC02 + 1x GC03"
    const shortParts = finalPhysicalItems.map(it => `${it.quantity}x ${it.code}`);
    const shortSummary = shortParts.join(' + ') || 'منتجات جولد كلين';

    // Submit to Bosta API
    const bostaResult = await createBostaDelivery({
      orderId: sanitizedOrderId,
      customerName,
      customerPhone,
      customerCity: customerCity || 'القاهرة',
      customerAddress: customerAddress || customerCity || 'القاهرة',
      customerEmail,
      notes,
      totalPrice: Number(totalPrice) || 0,
      itemsCount: totalItemQuantity,
      itemsDescription: shortSummary
    });

    return NextResponse.json({
      success: true,
      trackingNumber: bostaResult.trackingNumber,
      deliveryId: bostaResult.deliveryId,
      billCode: bostaResult.trackingNumber, // Interoperability with billCode
      state: bostaResult.state,
      courier: 'Bosta',
      message: bostaResult.message || 'تم إنشاء الشحنة بنجاح لدى شركة بوسطة'
    });
  } catch (error: any) {
    console.error('Error creating Bosta delivery:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء التواصل مع شركة الشحن بوسطة'
      },
      { status: 500 }
    );
  }
}
