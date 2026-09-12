import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
      totalPrice = 0
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
      console.error('Missing J&T Express credentials:', {
        apiAccount: !!apiAccount,
        privateKey: !!privateKey,
        customerCode: !!customerCode,
        plainTextPassword: !!plainTextPassword
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

    // Calculate approximate parcel weight (min 0.5kg)
    const calculatedWeight = Math.max(
      0.5,
      items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1) * 0.5, 0)
    );

    // Prepare items list for J&T using product/offer code as primary identifier
    const formattedItems = items.length > 0
      ? items.map((it: any) => {
          const itemCodeOrName = String(it.productCode || it.code || it.itemName || it.productName || 'منظفات جولد كلين').trim();
          return {
            itemName: itemCodeOrName.slice(0, 30),
            englishName: itemCodeOrName.slice(0, 60),
            chineseName: 'Gold Clean',
            number: Number(it.quantity) || 1,
            itemType: 'ITN6', // Daily necessities
            itemValue: String(it.price || 0),
            priceCurrency: 'EGP',
            desc: String(it.productName || it.itemName || 'منظفات عالية الجودة من مصنع جولد كلين').slice(0, 50)
          };
        })
      : [
          {
            itemName: 'منظفات جولد كلين',
            englishName: 'Gold Clean Detergents',
            chineseName: 'Gold Clean',
            number: 1,
            itemType: 'ITN6',
            itemValue: String(totalPrice || 100),
            priceCurrency: 'EGP',
            desc: 'منظفات منزلية وصناعية'
          }
        ];

    // Build bizContent JSON object
    const bizContentObj = {
      customerCode: customerCode,
      digest: bizDigest,
      deliveryType: '04', // 04 home delivery
      payType: 'PP_PM',
      expressType: 'EZ',
      network: '',
      weight: Number(calculatedWeight.toFixed(2)),
      remark: notes ? String(notes).slice(0, 200) : 'طلب منتجات من متجر مصنع جولد كلين',
      txlogisticId: txlogisticId,
      operateType: 1, // 1 Adding
      goodsType: 'ITN6', // Daily necessities
      totalQuantity: 1,
      itemsValue: Number(totalPrice) || 0,
      priceCurrency: 'EGP',
      receiver: {
        prov: customerCity || 'القاهرة',
        city: customerCity || 'القاهرة',
        area: customerCity || 'القاهرة',
        street: customerAddress || 'عنوان العميل',
        name: String(customerName).slice(0, 50),
        mobile: String(customerPhone).replace(/[^0-9+]/g, '').slice(0, 15) || '01000000000',
        phone: String(customerPhone).replace(/[^0-9+]/g, '').slice(0, 15) || '01000000000',
        countryCode: 'EGY'
      },
      sender: {
        prov: process.env.JT_EXPRESS_SENDER_PROV || 'القاهرة',
        city: process.env.JT_EXPRESS_SENDER_CITY || 'القاهرة',
        area: process.env.JT_EXPRESS_SENDER_AREA || 'مدينة بدر',
        street: process.env.JT_EXPRESS_SENDER_STREET || 'المنطقة الصناعي -  مخزن J&T',
        name: process.env.JT_EXPRESS_SENDER_NAME || 'مصنع جولد كلين Gold Clean',
        company: process.env.JT_EXPRESS_SENDER_COMPANY || 'شركة جولد كلين للمنظفات',
        mobile: process.env.JT_EXPRESS_SENDER_PHONE || '01050981039',
        phone: process.env.JT_EXPRESS_SENDER_PHONE || '01050981039',
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
      billCode: responseData?.data?.billCode || null,
      sortingCode: responseData?.data?.sortingCode || null,
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
