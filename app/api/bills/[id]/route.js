import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const bill = await sanityClient.getDocument(params.id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parsed = { ...bill, particulars: bill.particularsJson ? JSON.parse(bill.particularsJson) : [], id: bill._id };
    return NextResponse.json({ data: parsed });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const updated = await sanityClient.patch(params.id).set({
      date: body.date,
      employee: body.employee || '',
      customerName: body.customerName || '',
      customerEmail: body.customerEmail || '',
      customerMobileNo: body.customerMobileNo || '',
      customerGstNo: body.customerGstNo || '',
      payment: body.payment || 'Cash',
      totalPaid: parseFloat(body.totalPaid) || 0,
      total: parseFloat(body.total) || 0,
      creditAmount: parseFloat(body.creditAmount) || 0,
      totalWithGst: parseFloat(body.totalWithGst) || 0,
      actualTotal: parseFloat(body.actualTotal) || 0,
      totalItems: parseInt(body.totalItems) || 0,
      billStatus: body.billStatus || 'PAID',
      creditPaidAmount: parseFloat(body.creditPaidAmount) || 0,
      particularsJson: JSON.stringify(body.particulars || []),
      updatedAt: new Date().toISOString(),
    }).commit();
    return NextResponse.json({ data: { ...updated, id: updated._id } });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    await sanityClient.delete(params.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
