import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const u = await sanityClient.patch(params.id).set({ name: body.name, paperCategory: body.paperCategory || '', paperCategoryId: body.paperCategoryId || '', paperGroup: body.paperGroup || '', paperGroupId: body.paperGroupId || '', isActive: body.isActive !== false }).commit();
    return NextResponse.json({ data: u });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try { await sanityClient.delete(params.id); return NextResponse.json({ message: 'Deleted' }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
