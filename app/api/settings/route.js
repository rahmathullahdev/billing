import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireRole, ROLES } from '@/lib/auth';

const ALLOWED_SETTING_KEYS = [
  'businessInfo',
  'paymentConfig',
  'systemPrefs',
  'shortcutConfig',
  'shopName',
  'phone',
  'gstin',
];

const MAX_SETTINGS_BYTES = 100 * 1024;

export async function GET() {
  const { error, status } = await requireRole([ROLES.ADMIN, ROLES.MANAGER]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    const settings = await sanityClient.fetch(`*[_type == "systemSettings"][0]`);
    return NextResponse.json({ data: settings || null });
  } catch (e) {
    console.error('Get settings error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error, status } = await requireRole([ROLES.ADMIN, ROLES.MANAGER]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const raw = await request.text();
    if (raw.length > MAX_SETTINGS_BYTES) {
      return NextResponse.json({ error: 'Settings payload too large' }, { status: 413 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    const data = {};
    for (const key of ALLOWED_SETTING_KEYS) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const existing = await sanityClient.fetch(`*[_type == "systemSettings"][0]._id`);
    let result;
    if (existing) {
      result = await sanityClient
        .patch(existing)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .commit();
    } else {
      result = await sanityClient.create({
        _type: 'systemSettings',
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    console.error('Update settings error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
