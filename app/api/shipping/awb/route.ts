import { NextRequest, NextResponse } from 'next/server';
import { getBostaAWB } from '@/lib/bosta';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { success: false, error: 'معرّف الشحنة (Delivery ID) مطلوب' },
        { status: 400 }
      );
    }

    const data = await getBostaAWB(deliveryId);

    // If Bosta returns raw base64 PDF data
    const base64Data = data.data?.data || data.data;
    if (typeof base64Data === 'string' && base64Data.length > 100) {
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="awb-${deliveryId}.pdf"`
        }
      });
    }

    // If Bosta returns a direct URL
    if (data.data?.url || data.url) {
      return NextResponse.redirect(data.data?.url || data.url);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching Bosta AWB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'تعذر جلب بوليصة الشحن' },
      { status: 500 }
    );
  }
}
