import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const settings = await sanityClient.fetch(`*[_type == "systemSettings"][0]`);
    return NextResponse.json({ data: settings || null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const existing = await sanityClient.fetch(`*[_type == "systemSettings"][0]._id`);
    let result;
    if (existing) {
      result = await sanityClient.patch(existing).set({ ...body, updatedAt: new Date().toISOString() }).commit();
    } else {
      result = await sanityClient.create({ _type: 'systemSettings', ...body, createdAt: new Date().toISOString() });
    }
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
