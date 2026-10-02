import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyAAtJdwmMY3CwRUye-9tud_RjUhJ5lDC1A';

  // 1. Try Google Geocoding API if key configured
  if (apiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
          const first = gData.results[0];
          let streetNumber = '';
          let streetName = '';
          let city = '';
          let state = '';
          let zipCode = '';
          let country = '';

          for (const comp of first.address_components || []) {
            const types = comp.types || [];
            if (types.includes('street_number')) streetNumber = comp.long_name;
            else if (types.includes('route')) streetName = comp.long_name;
            else if (types.includes('locality') || types.includes('sublocality')) city = city || comp.long_name;
            else if (types.includes('administrative_area_level_1')) state = comp.short_name || comp.long_name;
            else if (types.includes('postal_code')) zipCode = comp.long_name;
            else if (types.includes('country')) country = comp.long_name;
          }

          const combinedStreet = [streetNumber, streetName].filter(Boolean).join(' ') || first.formatted_address?.split(',')[0] || '';
          return NextResponse.json({
            success: true,
            streetAddress: combinedStreet,
            streetNumber,
            streetName,
            city,
            state,
            zipCode,
            country,
          });
        }
      }
    } catch (e) {
      console.warn('Google reverse geocode error in API route:', e);
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AmbeWellness/1.0 (contact@ambewellness.com)',
        },
      }
    );
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData && nomData.address) {
        const addr = nomData.address;
        const streetNumber = addr.house_number || '';
        const streetName = addr.road || addr.street || addr.pedestrian || addr.neighbourhood || '';
        const combinedStreet = [streetNumber, streetName].filter(Boolean).join(' ') || (nomData.display_name ? nomData.display_name.split(',')[0] : '');
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
        const state = addr.state || '';
        const zipCode = addr.postcode || '';
        const country = addr.country || '';

        return NextResponse.json({
          success: true,
          streetAddress: combinedStreet,
          streetNumber,
          streetName,
          city,
          state,
          zipCode,
          country,
        });
      }
    }
  } catch (e) {
    console.warn('Nominatim error in API route:', e);
  }

  // 3. Fallback to BigDataCloud
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      if (bdcData) {
        const street = bdcData.localityInfo?.administrative?.[0]?.name || bdcData.locality || '';
        const city = bdcData.city || bdcData.locality || '';
        const state = bdcData.principalSubdivision || '';
        const zipCode = bdcData.postcode || '';
        const country = bdcData.countryName || '';

        return NextResponse.json({
          success: true,
          streetAddress: street,
          streetNumber: '',
          streetName: '',
          city,
          state,
          zipCode,
          country,
        });
      }
    }
  } catch (e) {
    console.warn('BigDataCloud error in API route:', e);
  }

  return NextResponse.json({ success: false, error: 'Could not determine address' }, { status: 404 });
}
