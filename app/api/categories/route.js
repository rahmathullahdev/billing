import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const data = await sanityClient.fetch(`*[_type == "category"] | order(name asc)`);
    return NextResponse.json({ data });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = { _type: 'category', categoryId: simpleId('CAT'), name: body.name, isActive: true, createdAt: new Date().toISOString() };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
