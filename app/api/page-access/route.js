import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const rules = await sanityClient.fetch(`*[_type == "pageAccess" && isActive == true]`);
    return NextResponse.json(rules);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const existing = await sanityClient.fetch(`*[_type == "pageAccess" && page == $page][0]`, { page: body.page });
    if (existing) {
      const updated = await sanityClient.patch(existing._id).set({ admin: body.admin, manager: body.manager, employee: body.employee, isActive: body.isActive !== false }).commit();
      return NextResponse.json(updated);
    }
    const doc = { _type: 'pageAccess', page: body.page, admin: body.admin !== false, manager: !!body.manager, employee: !!body.employee, isActive: true };
    const created = await sanityClient.create(doc);
    return NextResponse.json(created, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json(); // array of {id, admin, manager, employee}
    const updates = await Promise.all(
      body.map(rule => sanityClient.patch(rule.id).set({ admin: rule.admin, manager: rule.manager, employee: rule.employee }).commit())
    );
    return NextResponse.json(updates);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
