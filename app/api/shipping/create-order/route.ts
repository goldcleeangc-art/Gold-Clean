import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to format Egyptian mobile/phone to strict 11 digits required by J&T API (String(11))
function sanitizeEgyptianPhone(raw: any, fallback: string = '01000000000'): string {
  if (!raw) return fallback;
  let digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.startsWith('0020') && digits.length >= 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.length === 10 && !digits.startsWith('0')) {
    digits = '0' + digits;
  }
  const result = digits.slice(0, 11);
  return result.length === 11 ? result : result.padEnd(11, '0');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      notes,
      items = [],
      totalPrice = 0,
      billCode = '',
      operateType
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'بيانات العميل (الاسم ورقم الهاتف) مطلوبة' },
        { status: 400 }
      );
    }

    // Config credentials from environment variables
    const apiUrl =
      process.env.JT_EXPRESS_API_URL ||
      'https://openapi.jtjms-eg.com/webopenplatformapi/api/order/addOrder';
    const apiAccount = process.env.JT_EXPRESS_API_ACCOUNT;
    const privateKey = process.env.JT_EXPRESS_PRIVATE_KEY;
    const customerCode = process.env.JT_EXPRESS_CUSTOMER_CODE;
    const plainTextPassword = process.env.JT_EXPRESS_PASSWORD;

    if (!apiAccount || !privateKey || !customerCode || !plainTextPassword) {
      console.warn('J&T Express shipping configuration missing. Order recorded without J&T sync.', {
        hasApiAccount: !!apiAccount,
        hasPrivateKey: !!privateKey,
        hasCustomerCode: !!customerCode,
        hasPassword: !!plainTextPassword
      });
      return NextResponse.json(
        { success: false, error: 'إعدادات وبيانات الاتصال بشركة الشحن غير متوفرة في متغيرات البيئة (Environment Variables)' },
        { status: 500 }
      );
    }

    // 1. Calculate cipher text: MD5(plain text password + 'jadada236t2').toUpperCase()
    const cipherText = crypto
      .createHash('md5')
      .update(plainTextPassword + 'jadada236t2', 'utf8')
      .digest('hex')
      .toUpperCase();

    // 2. Calculate bizContent digest: Base64(MD5(customer number + cipher text + privateKey))
    const bizDigest = crypto
      .createHash('md5')
      .update(customerCode + cipherText + privateKey, 'utf8')
      .digest('base64');

    // Customer order number
    const sanitizedOrderId = orderId ? String(orderId).replace(/[^a-zA-Z0-9_-]/g, '') : `ORD${Date.now()}`;
    const txlogisticId = sanitizedOrderId.length > 50 ? sanitizedOrderId.slice(0, 50) : sanitizedOrderId;

    // Calculate parcel weight (J&T range: 0.01 - 30 kg)
    const incomingWeight = Number(body.weight);
    const calculatedWeight = incomingWeight > 0
      ? incomingWeight
      : items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1) * 0.5, 0);
    const finalWeight = Math.min(30, Math.max(0.5, Number(calculatedWeight.toFixed(2))));

    // Calculate total quantity of items
    const totalItemQuantity = items && items.length > 0
      ? items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)
      : 1;

    // Prepare aggregated single item for J&T Express
    // In J&T Express web portal and waybill labels, only the first item in items array is printed.
    // By aggregating all items into a single combined item entry, all ordered items and quantities are displayed together.
    let aggregatedItemName = 'منظفات جولد كلين';
    let aggregatedDesc = 'منظفات عالية الجودة من مصنع جولد كلين';
    let contentSummary = '';

    if (items && items.length > 0) {
      // 1. Code-based or short identifier summary: e.g. "2x GC01 + 1x GC02"
      const shortParts = items.map((it: any) => {
        const code = String(it.productCode || it.code || '').trim();
        const rawName = String(it.productName || it.itemName || '').trim();
        const shortName = rawName.length > 15 ? rawName.slice(0, 15) : rawName;
        const qty = Number(it.quantity) || 1;
        const identifier = code || shortName || 'منتج';
        return `${qty}x ${identifier}`;
      });

      // 2. Full descriptive summary: e.g. "2x GC01 (منظف أرضيات) + 1x GC02 (جل غسيل)"
      const detailedParts = items.map((it: any) => {
        const code = String(it.productCode || it.code || '').trim();
        const name = String(it.productName || it.itemName || '').trim();
        const qty = Number(it.quantity) || 1;
        if (code && name && code !== name) {
          return `${qty}x ${code} (${name.slice(0, 20)})`;
        }
        return `${qty}x ${code || name || 'منتج'}`;
      });

      const shortSummary = shortParts.join(' + ');
      const detailedSummary = detailedParts.join(' + ');

      // Use detailedSummary if <= 30 chars, otherwise use shortSummary (capped at 30 chars for itemName per J&T spec String(30))
      if (detailedSummary.length <= 30) {
        aggregatedItemName = detailedSummary;
      } else if (shortSummary.length <= 30) {
        aggregatedItemName = shortSummary;
      } else {
        aggregatedItemName = shortSummary.slice(0, 30);
      }

      aggregatedDesc = detailedSummary.slice(0, 100);
      contentSummary = shortSummary;
    }

    const formattedItems = [
      {
        itemName: aggregatedItemName.slice(0, 30), // String(30) per J&T documentation
        englishName: (contentSummary || aggregatedItemName).slice(0, 60), // String(60) per J&T documentation
        chineseName: 'Gold Clean',
        number: totalItemQuantity,
        itemType: 'ITN6', // Daily necessities
        itemValue: String(totalPrice || 0),
        priceCurrency: 'EGP',
        desc: aggregatedDesc.slice(0, 100) // String(100) per J&T documentation
      }
    ];

    // Combine customer notes with items summary in remark for the delivery courier
    let finalRemark = 'طلب منتجات من متجر مصنع جولد كلين';
    if (contentSummary && notes) {
      finalRemark = `المحتويات: ${contentSummary} | ملاحظات: ${String(notes).slice(0, 100)}`;
    } else if (contentSummary) {
      finalRemark = `المحتويات: ${contentSummary}`;
    } else if (notes) {
      finalRemark = String(notes).slice(0, 200);
    }

    // Build Customer's pickup information (pickInfo) with product codes
    // In J&T Express VIP portal and handheld devices, staff/couriers read "Customer's pickup information" (pickInfo).
    // Using shipping codes (e.g. GC01 * 2; GC02 * 1) makes picking and verification much faster and clearer.
    const pickupCodesList = (items || []).map((it: any) => {
      const code = String(it.productCode || it.code || '').trim();
      const rawName = String(it.productName || it.itemName || '').trim();
      const qty = Number(it.quantity) || 1;
      const identifier = code || rawName.slice(0, 30) || 'منتج';
      return `${identifier} * ${qty}`;
    });

    const pickInfoString = pickupCodesList.length > 0
      ? pickupCodesList.join('; ').slice(0, 500)
      : 'GC01 * 1';

    // Determine operateType: 1 (Adding new order), 2 (Modifying existing order)
    const finalOperateType = operateType ? Number(operateType) : (billCode ? 2 : 1);
    const existingBillCode = billCode ? String(billCode).trim() : '';

    // Build bizContent JSON object
    const bizContentObj = {
      customerCode: customerCode,
      digest: bizDigest,
      deliveryType: '04', // 04 home delivery
      payType: 'PP_PM',
      expressType: 'EZ',
      network: '',
      weight: finalWeight,
      remark: finalRemark.slice(0, 200),
      pickInfo: pickInfoString,
      txlogisticId: txlogisticId,
      billCode: existingBillCode,
      operateType: finalOperateType,
      goodsType: 'ITN6', // Daily necessities
      totalQuantity: 1, // Package ticket count (must be 1 for single parcel ticket per J&T specification)
      itemsValue: Number(totalPrice) || 0,
      priceCurrency: 'EGP',
      receiver: {
        prov: customerCity || 'القاهرة',
        city: customerCity || 'القاهرة',
        area: customerCity || 'القاهرة',
        street: customerAddress || 'عنوان العميل',
        name: String(customerName).slice(0, 50),
        mobile: sanitizeEgyptianPhone(customerPhone),
        phone: sanitizeEgyptianPhone(customerPhone),
        countryCode: 'EGY'
      },
      sender: {
        prov: process.env.JT_EXPRESS_SENDER_PROV || 'القاهرة',
        city: process.env.JT_EXPRESS_SENDER_CITY || 'القاهرة',
        area: process.env.JT_EXPRESS_SENDER_AREA || 'مدينة بدر',
        street: process.env.JT_EXPRESS_SENDER_STREET || 'المنطقة الصناعي -  مخزن J&T',
        name: process.env.JT_EXPRESS_SENDER_NAME || 'مصنع جولد كلين Gold Clean',
        company: process.env.JT_EXPRESS_SENDER_COMPANY || 'شركة جولد كلين للمنظفات',
        mobile: sanitizeEgyptianPhone(process.env.JT_EXPRESS_SENDER_PHONE, '01050981039'),
        phone: sanitizeEgyptianPhone(process.env.JT_EXPRESS_SENDER_PHONE, '01050981039'),
        countryCode: 'EGY'
      },
      items: formattedItems
    };

    const bizContentString = JSON.stringify(bizContentObj);

    // 3. Calculate Header digest: Base64(MD5(bizContent + privateKey))
    const headerDigest = crypto
      .createHash('md5')
      .update(bizContentString + privateKey, 'utf8')
      .digest('base64');

    const timestamp = Date.now();

    // 4. Send request to J&T API using x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('bizContent', bizContentString);

    const jtResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'apiAccount': String(apiAccount),
        'digest': headerDigest,
        'timestamp': String(timestamp)
      },
      body: formData.toString()
    });

    const responseText = await jtResponse.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    // Check if successfully generated order or returned code '1'
    const isSuccess = responseData.code === '1' || responseData.code === 1;

    return NextResponse.json({
      success: isSuccess,
      code: responseData.code,
      msg: responseData.msg || (isSuccess ? 'تم إرسال الطلب لشركة الشحن بنجاح' : 'استجابة شركة الشحن'),
      data: responseData.data || null,
      txlogisticId: txlogisticId,
      billCode: responseData?.data?.billCode || existingBillCode || null,
      sortingCode: responseData?.data?.sortingCode || null,
      operateType: finalOperateType,
      rawResponse: responseData
    });
  } catch (error: any) {
    console.error('Error in J&T Express API integration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء إرسال الطلب لشركة الشحن'
      },
      { status: 500 }
    );
  }
}
