import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

const ROLES = ['admin', 'manager', 'employee'];

// GET /api/page-access/[id]
export async function GET(request, ctx) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const rule = await sanityClient.getDocument(id);
    if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rule);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/page-access/[id] — admin only; toggles a role ({ role }) or status ({ isActive })
export async function PATCH(request, ctx) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const doc = await sanityClient.getDocument(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const patch = {};
    if (body.role && ROLES.includes(body.role)) {
      patch[body.role] = !doc[body.role];
    }
    if (typeof body.isActive === 'boolean') {
      patch.isActive = body.isActive;
    }

    const updated = await sanityClient.patch(id).set(patch).commit();
    return NextResponse.json({ ...updated, id: updated._id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/page-access/[id] — admin only; full update
export async function PUT(request, ctx) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const doc = await sanityClient.getDocument(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await sanityClient.patch(id).set({
      page: body.page || doc.page,
      admin: body.admin !== false,
      manager: !!body.manager,
      employee: !!body.employee,
      isActive: body.isActive !== false,
    }).commit();
    return NextResponse.json({ ...updated, id: updated._id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/page-access/[id] — admin only
export async function DELETE(request, ctx) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await ctx.params;
    const doc = await sanityClient.getDocument(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await sanityClient.patch(id).set({ isActive: false }).commit();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}