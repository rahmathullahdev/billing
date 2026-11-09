import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { cleanString, isEmail, isPhone } from '@/lib/validate';

function validateBranchInput(body) {
  const name = cleanString(body?.name, { max: 160 });
  const email = cleanString(body?.email, { max: 254 }).toLowerCase();
  const phone = cleanString(body?.phone, { max: 20 });

  if (!name) return { error: 'Branch name is required' };
  if (email && !isEmail(email)) return { error: 'A valid email is required' };
  if (phone && !isPhone(phone)) return { error: 'A valid phone number is required' };

  return {
    error: null,
    data: {
      branchId: cleanString(body?.branchId || body?.code, { max: 60 }),
      name,
      address: cleanString(body?.address, { max: 500 }),
      phone,
      email,
      isActive: body?.isActive !== false,
    },
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireAuth();
  if (error) return NextResponse.json({ error }, { status });
  try {
    const doc = await sanityClient.getDocument(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (e) {
    console.error('Get branch error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateBranchInput(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const updated = await sanityClient
      .patch(id)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .commit();
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error('Update branch error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete branch error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
