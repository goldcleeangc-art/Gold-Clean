import { NextRequest, NextResponse } from 'next/server';
import { getBostaPickupLocations } from '@/lib/bosta';

export async function GET(req: NextRequest) {
  try {
    const locations = await getBostaPickupLocations();
    return NextResponse.json({
      success: true,
      count: locations.length,
      locations: locations.map((loc: any) => ({
        id: loc._id || loc.id,
        name: loc.name || loc.locationName || 'موقع استلام',
        isDefault: Boolean(loc.isDefault || loc.default || loc.isPrimary),
        city: loc.address?.city || loc.city,
        zone: loc.address?.zone || loc.zone || loc.districtName,
        firstLine: loc.address?.firstLine || loc.firstLine,
        phone: loc.phone || loc.contactPerson?.phone
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'فشل جلب مواقع الاستلام من بوسطة' },
      { status: 500 }
    );
  }
}
