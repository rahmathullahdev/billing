import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, ctx) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const d = await sanityClient.getDocument(id);
    return NextResponse.json({ data: d });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(request, ctx) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const u = await sanityClient.patch(id).set({
      name: body.name,
      amount: parseFloat(body.amount) || 0,
      month: body.month,
      year: body.year,
      branch: body.branch || '',
      category: body.category || '',
      paymentType: body.paymentType || 'Cash',
      isPaid: !!body.isPaid,
    }).commit();
    return NextResponse.json({ data: u });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request, ctx) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await ctx.params;
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}