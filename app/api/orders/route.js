import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/orders - order history (from bills marked as orders)
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  try {
    const all = await sanityClient.fetch(`*[_type == "bill"] | order(createdAt desc)`);
    const orders = all.map(b => ({
      orderId: b._id,
      billNumber: b.billNumber,
      customerName: b.customerName,
      phoneNumber: b.customerMobileNo,
      username: b.employee,
      grandTotal: b.total,
      subtotal: b.actualTotal,
      paymentMethod: b.payment,
      paymentDetails: { status: b.billStatus },
      paidAmount: b.totalPaid,
      pendingAmount: b.creditAmount || 0,
      createdAt: b.createdAt,
      items: b.particularsJson ? (() => { try { return JSON.parse(b.particularsJson); } catch { return []; } })() : [],
    }));
    const s = page * size;
    return NextResponse.json({ data: { content: orders.slice(s, s + size), totalElements: orders.length, totalPages: Math.ceil(orders.length / size), number: page, size } });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
