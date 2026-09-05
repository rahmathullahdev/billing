import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error || session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const u = await sanityClient.getDocument(params.id);
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { password: _, ...safe } = u;
    return NextResponse.json({ data: safe });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error || session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const patch = {
      username: body.username,
      email: body.email,
      role: body.role,
      isActive: body.isActive !== false,
      branchName: body.branchName || '',
      branchId: body.branchId || '',
    };
    if (body.password) patch.password = await bcrypt.hash(body.password, 10);
    const updated = await sanityClient.patch(params.id).set(patch).commit();
    const { password: _, ...safe } = updated;
    return NextResponse.json({ data: safe });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error, session } = await requireAuth(request);
  if (error || session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await sanityClient.delete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
