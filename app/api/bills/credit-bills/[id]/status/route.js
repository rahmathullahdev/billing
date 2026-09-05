import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// PUT /api/bills/credit-bills/[id]/status
export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const updated = await sanityClient.patch(params.id).set({
      billStatus: body.billStatus || 'PAID',
      creditPaidAmount: parseFloat(body.creditPaidAmount) || 0,
      updatedAt: new Date().toISOString(),
    }).commit();
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
