import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  try {
    const doc = await sanityClient.getDocument(id);
    return NextResponse.json({ data: doc });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await sanityClient.patch(id).set({
      ...(body.itemId ? { itemId: body.itemId } : {}),
      name: body.name,
      category: body.category || '',
      price: parseFloat(body.price ?? body.basePrice) || 0,
      priceBack: parseFloat(body.priceBack) || 0,
      description: body.description || '',
    }).commit();
    return NextResponse.json({ data: updated });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  try {
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
