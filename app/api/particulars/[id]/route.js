import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ data: null });

    // Look up by document _id first (fall back so old listeners also work),
    // then by the business `particularId` code.
    let doc = await sanityClient.getDocument(id);
    if (!doc || String(doc._id) !== String(id)) {
      doc = await sanityClient.fetch(
        `*[_type == "particular" && particularId == $pid][0]`,
        { pid: id }
      );
    }
    return NextResponse.json({ data: doc ? { ...doc, id: doc._id } : null });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await sanityClient.patch(id).set({
      name: body.name,
      price: parseFloat(body.price) || 0,
      priceBack: parseFloat(body.priceBack) || 0,
      commisionRate: parseFloat(body.commisionRate) || 0,
      machineCategory: body.machineCategory || '',
      machineCategoryId: body.machineCategoryId || '',
      paper: body.paper || '',
      paperId: body.paperId || '',
      paperGroup: body.paperGroup || '',
      paperGroupId: body.paperGroupId || '',
      taxNumber: body.taxNumber || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).commit();
    return NextResponse.json({ data: updated });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const { id } = await params;
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}