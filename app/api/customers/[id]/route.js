import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { validateCustomerInput } from '@/lib/validate';

// GET /api/customers/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireAuth();
  if (error) return NextResponse.json({ error }, { status });
  try {
    const customer = await sanityClient.getDocument(id);
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: customer });
  } catch (e) {
    console.error('Get customer error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireRole([ROLES.ADMIN, ROLES.MANAGER]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateCustomerInput(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const updated = await sanityClient
      .patch(id)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .commit();
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error('Update customer error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireRole([ROLES.ADMIN, ROLES.MANAGER]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete customer error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
