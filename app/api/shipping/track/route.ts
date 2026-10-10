import { NextRequest, NextResponse } from 'next/server';
import { trackBostaShipment } from '@/lib/bosta';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'رقم الشحنة مطلوب' },
        { status: 400 }
      );
    }

    const data = await trackBostaShipment(trackingNumber);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error tracking Bosta shipment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'تعذر تتبع الشحنة' },
      { status: 500 }
    );
  }
}
