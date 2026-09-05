import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/customers/[id]
export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const customer = await sanityClient.getDocument(params.id);
    return NextResponse.json({ data: customer });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const updated = await sanityClient.patch(params.id).set({
      name: body.name,
      email: body.email || '',
      phoneNumber: body.phoneNumber,
      companyName: body.companyName || '',
      taxNumber: body.taxNumber || '',
      address: body.address || '',
      creditAmount: parseFloat(body.creditAmount) || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).commit();
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    await sanityClient.delete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
