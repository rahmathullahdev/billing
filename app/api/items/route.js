import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// GET /api/items - all items
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const data = await sanityClient.fetch(`*[_type == "item"] | order(name asc)`);
    return NextResponse.json({ data });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// POST /api/items
export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = {
      _type: 'item',
      itemId: simpleId('ITEM'),
      name: body.name,
      price: parseFloat(body.price) || 0,
      priceBack: parseFloat(body.priceBack) || 0,
      description: body.description || '',
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
