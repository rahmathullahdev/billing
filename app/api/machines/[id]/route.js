import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try { const d = await sanityClient.getDocument(params.id); return NextResponse.json({ data: d }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const u = await sanityClient.patch(params.id).set({ name: body.name, machineCategory: body.machineCategory || '', categoryId: body.categoryId || '', reading: body.reading || '', serialNumber: body.serialNumber || '', mobile: body.mobile || '', email: body.email || '', tonerRequestMobile: body.tonerRequestMobile || '', tonerRequestEmail: body.tonerRequestEmail || '', branchName: body.branchName || '', branchId: body.branchId || '', isActive: body.isActive !== false }).commit();
    return NextResponse.json({ data: u });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try { await sanityClient.delete(params.id); return NextResponse.json({ message: 'Deleted' }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
