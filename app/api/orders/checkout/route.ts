import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { createBostaDelivery } from '@/lib/bosta';
import { 
  calculateShipping, 
  sanitizeEgyptianPhone, 
  parseProductWeight, 
  formatOrderItemsForShipping 
} from '@/lib/shipping';
import { checkRateLimit } from '@/lib/rate-limit';
import { Order, OrderItem, ShippingInfo } from '@/lib/types/store';

// Helper to extract clean SKU code from productCode or text
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
    // 1. Rate Limiting Protection (Max 15 checkout attempts per 10 minutes per IP)
    const ip =
      req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'client';
    
    const rateCheck = checkRateLimit(`order_checkout_${ip}`, 15, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'تم تجاوز الحد المسموح به من محاولات إنشاء الطلبات مؤقتاً. يرجى الانتظار قليلاً.' 
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json().catch(() => ({}));
    const {
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerCountry = 'مصر',
      notes = '',
      userId = 'guest',
      customerEmail,
      items = []
    } = body;

    // Field validations
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم العميل بشكل صحيح (حرفين على الأقل).' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizeEgyptianPhone(customerPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال رقم هاتف محمول مصري صحيح للتواصل ومتابعة الشحن.' },
        { status: 400 }
      );
    }

    if (!customerCity || typeof customerCity !== 'string' || !customerCity.trim()) {
      return NextResponse.json(
        { success: false, error: 'يرجى اختيار المحافظة لتحديد تكلفة الشحن بدقة.' },
        { status: 400 }
      );
    }

    if (!customerAddress || typeof customerAddress !== 'string' || customerAddress.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة عنوان التوصيل بالتفصيل لضمان وصول المندوب.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'سلة المشتريات فارغة! يرجى اختيار منتجات قبل تأكيد الطلب.' },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى المسموح به هو 50 صنف في الطلب الواحد.' },
        { status: 400 }
      );
    }

    // 3. Authoritative Server-Side Price Verification from Firestore
    // Caches to minimize read ops if multiple items reference the same product/offer
    const productCache = new Map<string, any>();
    const offerCache = new Map<string, any>();

    const verifiedOrderItems: Array<OrderItem & { weight: number }> = [];
    let hasFreeShippingOffer = false;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const rawId = String(it.productId || it.id || '').trim();
      const qty = Math.min(100, Math.max(1, Math.floor(Number(it.quantity)) || 1));
      const isOffer = Boolean(it.isOffer) || rawId.startsWith('offer-');

      if (isOffer) {
        const cleanOfferId = rawId.replace(/^offer-/, '');
        let offerData = offerCache.get(cleanOfferId);

        if (!offerData) {
          const offerSnap = await getDoc(doc(db, 'offers', cleanOfferId));
          if (!offerSnap.exists()) {
            return NextResponse.json(
              { success: false, error: `عذراً، باقة العرض المحددة لم تعد متوفرة في المتجر.` },
              { status: 400 }
            );
          }
          offerData = offerSnap.data();
          offerCache.set(cleanOfferId, offerData);
        }

        if (offerData.isAvailable === false) {
          return NextResponse.json(
            { success: false, error: `عذراً، باقة "${offerData.title}" غير متاحة للشراء حالياً.` },
            { status: 400 }
          );
        }

        // Authoritative verified offer price
        const verifiedOfferPrice = Math.max(0, Number(offerData.offerPrice) || 0);
        if (offerData.isFreeShipping === true) {
          hasFreeShippingOffer = true;
        }

        // Expand offer bundle constituent items with verified details
        const bundleItems: Array<{ productId: string; productName: string; productCode?: string; quantity: number }> = [];
        let bundleTotalWeight = 0;

        if (Array.isArray(offerData.items)) {
          for (const sub of offerData.items) {
            let subProdData = productCache.get(sub.productId);
            if (!subProdData && sub.productId) {
              const subSnap = await getDoc(doc(db, 'products', sub.productId));
              if (subSnap.exists()) {
                subProdData = subSnap.data();
                productCache.set(sub.productId, subProdData);
              }
            }

            const subQty = Math.max(1, Number(sub.quantity) || 1);
            const subCode = sub.productCode || subProdData?.code || '';
            const subName = sub.productName || subProdData?.name || 'منتج';
            const subWeight = parseProductWeight(subProdData || { volume: sub.volume });

            bundleTotalWeight += subWeight * subQty;
            bundleItems.push({
              productId: sub.productId,
              productName: subName,
              productCode: subCode,
              quantity: subQty
            });
          }
        }

        const fallbackOfferWeight = bundleTotalWeight > 0 ? bundleTotalWeight : Math.max(1, bundleItems.length || 1);

        verifiedOrderItems.push({
          productId: rawId,
          productName: `باقة: ${offerData.title}`,
          productCode: offerData.code || '',
          quantity: qty,
          price: verifiedOfferPrice,
          isOffer: true,
          bundleItems: bundleItems.length > 0 ? bundleItems : undefined,
          weight: fallbackOfferWeight
        });

      } else {
        // Regular individual product
        let prodData = productCache.get(rawId);
        if (!prodData) {
          const prodSnap = await getDoc(doc(db, 'products', rawId));
          if (!prodSnap.exists()) {
            return NextResponse.json(
              { success: false, error: `عذراً، أحد المنتجات المطلوبة غير متوفر في قاعدة البيانات.` },
              { status: 400 }
            );
          }
          prodData = prodSnap.data();
          productCache.set(rawId, prodData);
        }

        if (prodData.isAvailable === false) {
          return NextResponse.json(
            { success: false, error: `عذراً، المنتج "${prodData.name}" نفد من المخزون حالياً.` },
            { status: 400 }
          );
        }

        // Authoritative verified product price
        const verifiedProdPrice = Math.max(0, Number(prodData.price) || 0);
        const verifiedWeight = parseProductWeight(prodData);

        verifiedOrderItems.push({
          productId: rawId,
          productName: prodData.name || 'منتج',
          productCode: prodData.code || '',
          quantity: qty,
          price: verifiedProdPrice,
          isOffer: false,
          weight: verifiedWeight
        });
      }
    }

    // 4. Calculate Authoritative Financial Subtotal and Shipping Costs
    const verifiedSubtotal = verifiedOrderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const verifiedTotalWeight = verifiedOrderItems.reduce(
      (sum, item) => sum + (item.weight * item.quantity),
      0
    );

    const shipCalc = calculateShipping(customerCity, verifiedTotalWeight);
    const verifiedShippingCost = hasFreeShippingOffer 
      ? 0 
      : (shipCalc ? shipCalc.shippingCost : 0);

    const verifiedShippingZone = hasFreeShippingOffer 
      ? `${shipCalc?.zone.name || 'شحن مجاني'} (عرض شحن مجاني)` 
      : (shipCalc?.zone.name || '');

    const verifiedGrandTotal = verifiedSubtotal + verifiedShippingCost;

    // 5. Build Firestore Order Document Reference
    const orderDocRef = doc(collection(db, 'orders'));
    const generatedOrderId = orderDocRef.id;
    const guestEmail = customerEmail || `${cleanPhone}@guest.store`;

    // 6. Build Clean Physical Items Summary for Bosta Courier & Packing Workers
    const physicalItems: Array<{ code: string; name: string; quantity: number }> = [];
    for (let idx = 0; idx < verifiedOrderItems.length; idx++) {
      const it = verifiedOrderItems[idx];
      if (it.bundleItems && it.bundleItems.length > 0) {
        for (let bIdx = 0; bIdx < it.bundleItems.length; bIdx++) {
          const sub = it.bundleItems[bIdx];
          const cleanCode = extractSkuCode(sub.productCode, sub.productName, sub.productId, bIdx + 1);
          physicalItems.push({
            code: cleanCode,
            name: sub.productName || cleanCode,
            quantity: sub.quantity * it.quantity
          });
        }
      } else {
        const cleanCode = extractSkuCode(it.productCode, it.productName, it.productId, idx + 1);
        physicalItems.push({
          code: cleanCode,
          name: it.productName || cleanCode,
          quantity: it.quantity
        });
      }
    }

    const itemsSummary = formatOrderItemsForShipping(physicalItems, 200);
    const totalPhysicalQuantity = physicalItems.reduce((sum, it) => sum + it.quantity, 0);

    // 7. Transmit to Bosta Logistics API
    let shippingInfoData: ShippingInfo | undefined = undefined;

    try {
      const bostaResult = await createBostaDelivery({
        orderId: generatedOrderId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerCity: customerCity.trim(),
        customerAddress: customerAddress.trim(),
        customerEmail: guestEmail,
        notes: (notes || '').trim(),
        totalPrice: verifiedGrandTotal,
        itemsCount: totalPhysicalQuantity,
        itemsDescription: itemsSummary
      });

      if (bostaResult && (bostaResult.trackingNumber || bostaResult.deliveryId)) {
        const tracking = bostaResult.trackingNumber || bostaResult.deliveryId;
        shippingInfoData = {
          billCode: tracking,
          trackingNumber: tracking,
          deliveryId: bostaResult.deliveryId || tracking,
          courier: 'Bosta',
          status: bostaResult.state || 'created',
          txlogisticId: generatedOrderId,
          syncedAt: new Date().toISOString()
        };
      }
    } catch (shippingErr: any) {
      console.warn('Bosta initial delivery creation fallback:', shippingErr?.message || shippingErr);
      shippingInfoData = {
        courier: 'Bosta',
        error: shippingErr?.message || 'خطأ أثناء الربط الأولي بشركة بوسطة، يمكن المزامنة لاحقاً من لوحة الإدارة',
        lastAttemptAt: new Date().toISOString()
      };
    }

    // 8. Construct Final Safe Order Record
    const orderPayload: Order = {
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerCountry: customerCountry || 'مصر',
      customerCity: customerCity.trim(),
      customerAddress: customerAddress.trim(),
      notes: (notes || '').trim().slice(0, 500),
      items: verifiedOrderItems.map(it => ({
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode || '',
        quantity: it.quantity,
        price: it.price,
        isOffer: Boolean(it.isOffer),
        ...(it.bundleItems ? { bundleItems: it.bundleItems } : {})
      })),
      subtotal: verifiedSubtotal,
      shippingCost: verifiedShippingCost,
      shippingZone: verifiedShippingZone,
      shippingWeight: verifiedTotalWeight,
      totalPrice: verifiedGrandTotal,
      status: 'pending',
      createdAt: serverTimestamp(),
      userId: userId || 'guest',
      customerEmail: guestEmail,
      ...(shippingInfoData ? { shippingInfo: shippingInfoData } : {})
    };

    // 9. Persist to Firestore from the secure server environment
    await setDoc(orderDocRef, orderPayload);

    return NextResponse.json({
      success: true,
      orderId: generatedOrderId,
      order: {
        ...orderPayload,
        id: generatedOrderId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error during secure server checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب في الخادم.'
      },
      { status: 500 }
    );
  }
}
