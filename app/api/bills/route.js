import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// ─── BILLS CRUD ──────────────────────────────────────────────────────────
// GET /api/bills?page=0&size=10&dateFilter=...&startDate=...&endDate=...&paymentMode=...&customerName=...
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const dateFilter = searchParams.get('dateFilter') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const paymentMode = searchParams.get('paymentMode') || '';
  const customerName = searchParams.get('customerName') || '';

  try {
    let query = `*[_type == "bill"`;
    const conditions = [];

    if (customerName) conditions.push(`customerName match "*${customerName}*"`);
    if (paymentMode) conditions.push(`payment == "${paymentMode}"`);

    // Date filtering
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      conditions.push(`date == "${today}"`);
    } else if (dateFilter === 'yesterday') {
      const yd = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      conditions.push(`date == "${yd}"`);
    } else if (dateFilter === 'last_7_days') {
      const sd = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      conditions.push(`date >= "${sd}"`);
    } else if (dateFilter === 'last_30_days') {
      const sd = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      conditions.push(`date >= "${sd}"`);
    } else if (dateFilter === 'this_month') {
      const d = new Date();
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      conditions.push(`date >= "${monthStart}"`);
    } else if (startDate && endDate) {
      conditions.push(`date >= "${startDate}" && date <= "${endDate}"`);
    } else if (startDate) {
      conditions.push(`date >= "${startDate}"`);
    }

    if (conditions.length > 0) {
      query += ' && ' + conditions.join(' && ');
    }
    query += `] | order(createdAt desc)`;

    const all = await sanityClient.fetch(query);
    const start = page * size;
    const slice = all.slice(start, start + size);

    return NextResponse.json({
      data: {
        content: slice,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        number: page,
        size,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/bills - create new bill
export async function POST(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const billNumber = body.billNumber || simpleId('BILL-');

    const doc = {
      _type: 'bill',
      billNumber,
      date: body.date || new Date().toISOString().split('T')[0],
      employee: body.employee || session?.username || '',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: { ...created, id: created._id } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
