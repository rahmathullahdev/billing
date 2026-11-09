import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireRole, ROLES } from '@/lib/auth';
import { validateUserInput } from '@/lib/validate';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    const u = await sanityClient.getDocument(id);
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { password: _, ...safe } = u;
    return NextResponse.json({ data: safe });
  } catch (e) {
    console.error('Get user error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { error, status, session } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateUserInput(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    if (id === session.userId && data.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 });
    }

    const patch = {
      username: data.username,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      branchName: data.branchName,
      branchId: data.branchId,
    };
    if (data.password) patch.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const updated = await sanityClient.patch(id).set(patch).commit();
    const { password: _, ...safe } = updated;
    return NextResponse.json({ data: safe });
  } catch (e) {
    console.error('Update user error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, status, session } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });

  if (id === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete user error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
