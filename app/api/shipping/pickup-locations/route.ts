import { NextRequest, NextResponse } from 'next/server';
import { getBostaPickupLocations, getBostaBaseUrl, getBostaAuthHeaders } from '@/lib/bosta';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBostaBaseUrl();
    const headers = await getBostaAuthHeaders();

    // Query both endpoints directly for diagnosis
    const [resV0, resV2] = await Promise.all([
      fetch(`${baseUrl}/api/v0/pickup-locations`, { headers, signal: AbortSignal.timeout(6000) }).catch(err => ({ ok: false, status: 500, error: err.message })),
      fetch(`${baseUrl}/api/v2/pickup-locations`, { headers, signal: AbortSignal.timeout(6000) }).catch(err => ({ ok: false, status: 500, error: err.message }))
    ]);

    let dataV0: any = null;
    let dataV2: any = null;

    if ('json' in resV0 && typeof resV0.json === 'function') {
      dataV0 = await resV0.json().catch(() => null);
    }
    if ('json' in resV2 && typeof resV2.json === 'function') {
      dataV2 = await resV2.json().catch(() => null);
    }

    const locations = await getBostaPickupLocations();

    const apiKey = (process.env.BOSTA_API_KEY || '').trim();
    const maskedKey = apiKey ? `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}` : '(not set, using email/password)';

    return NextResponse.json({
      success: true,
      count: locations.length,
      locations: locations.map((loc: any) => ({
        id: loc._id || loc.id,
        name: loc.locationName || loc.name || 'موقع استلام',
        isDefault: Boolean(loc.isDefault || loc.default || loc.isPrimary),
        city: loc.address?.city || loc.city,
        zone: loc.address?.zone || loc.zone || loc.districtName,
        firstLine: loc.address?.firstLine || loc.firstLine,
        phone: loc.phone || loc.contactPerson?.phone
      })),
      debug: {
        baseUrl,
        authMode: apiKey ? 'API_KEY' : 'EMAIL_PASSWORD',
        maskedKey,
        v0Status: 'status' in resV0 ? resV0.status : 'error',
        v0RawCount: Array.isArray(dataV0?.data) ? dataV0.data.length : (Array.isArray(dataV0) ? dataV0.length : 0),
        v2Status: 'status' in resV2 ? resV2.status : 'error',
        v2RawCount: Array.isArray(dataV2?.data) ? dataV2.data.length : (Array.isArray(dataV2) ? dataV2.length : 0),
        v0Sample: dataV0,
        v2Sample: dataV2
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'فشل جلب مواقع الاستلام من بوسطة' },
      { status: 500 }
    );
  }
}
