// GET /api/web-push-config — the VAPID public key the browser needs to subscribe
// to Firebase Cloud Messaging.
//
// The key lives in Secret Manager (ambe-wellness / WEB_PUSH_VAPID_PUBLIC_KEY).
// It is a *public* key — every browser receives it — so serving it is safe; it is
// kept in Secret Manager only so it is managed in one place.

import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const vapidKey = await getSecret('WEB_PUSH_VAPID_PUBLIC_KEY');

  if (!vapidKey) {
    // Web push simply stays off on the client.
    return NextResponse.json({ vapidKey: null }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { vapidKey },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
