import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns the Monday (start of week) for the given date
function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const m = new Date(d);
  m.setDate(m.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

function parseParticulars(bill) {
  if (Array.isArray(bill.particulars)) return bill.particulars;
  if (bill.particularsJson) {
    try {
      const parsed = JSON.parse(bill.particularsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function enrichBill(bill) {
  return { ...bill, id: bill._id, particulars: parseParticulars(bill) };
}

function computeBillStatus({ payment, total, totalPaid, creditAmount }) {
  const tot = parseFloat(total) || 0;
  const paid = parseFloat(totalPaid) || 0;
  const credit = parseFloat(creditAmount) || 0;
  if (String(payment || '').trim().toUpperCase() === 'CREDIT') return 'CREDIT';
  if (Math.abs(tot - paid) <= 1 && paid > 0) return 'PAID';
  if (credit > 0) return 'CREDIT';
  return 'PENDING';
}

function normalizeTotals(total, totalPaid, creditAmount) {
  let tot = parseFloat(total) || 0;
  let paid = parseFloat(totalPaid) || 0;
  let credit = parseFloat(creditAmount) || 0;
  if (credit > 0 && (paid + credit > tot + 0.01 || Math.abs(paid - tot) < 0.01)) {
    paid = Math.max(0, Number((tot - credit).toFixed(2)));
  }
  return { total: tot, totalPaid: paid, creditAmount: credit };
}

// ─── BILLS CRUD ──────────────────────────────────────────────────────────
// GET /api/bills?page=0&size=15&dateFilter=...&startDate=...&endDate=...&paymentMode=...&customerName=...
// Legacy consumers pass `limit` and expect `data` to be a plain array.
// Otherwise returns paginated `{ data: { content, totalElements, totalPages, number, size }, kpi }`.
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '15');
  const legacy = searchParams.get('limit') !== null;
  const dateFilter = searchParams.get('dateFilter') || searchParams.get('filter') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const paymentMode = searchParams.get('paymentMode') || '';
  const customerName = searchParams.get('customerName') || '';

  try {
    const conditions = [];
    const groqParams = {};

    if (customerName) {
      conditions.push(`lower(customerName) match $custName`);
      groqParams.custName = `*${customerName.toLowerCase()}*`;
    }
    if (paymentMode) {
      conditions.push(`payment == $paymentMode`);
      groqParams.paymentMode = paymentMode;
    }

    const now = new Date();
    const today = toDateStr(now);

    if (dateFilter === 'today') {
      conditions.push(`date == $today`);
      groqParams.today = today;
    } else if (dateFilter === 'yesterday') {
      const yd = new Date(now);
      yd.setDate(yd.getDate() - 1);
      const ystr = toDateStr(yd);
      conditions.push(`date == $today`);
      groqParams.today = ystr;
    } else if (dateFilter === 'this_week') {
      const monday = startOfWeek(now);
      conditions.push(`date >= $start && date <= $today`);
      groqParams.start = toDateStr(monday);
      groqParams.today = today;
    } else if (dateFilter === 'last_week') {
      const monday = startOfWeek(now);
      const lastMonday = new Date(monday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      conditions.push(`date >= $start && date < $end`);
      groqParams.start = toDateStr(lastMonday);
      groqParams.end = toDateStr(monday);
    } else if (dateFilter === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      conditions.push(`date >= $start`);
      groqParams.start = toDateStr(monthStart);
    } else if (dateFilter === 'last_month') {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      conditions.push(`date >= $start && date < $end`);
      groqParams.start = toDateStr(lastMonthStart);
      groqParams.end = toDateStr(thisMonthStart);
    } else if (dateFilter === 'this_year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      conditions.push(`date >= $start`);
      groqParams.start = toDateStr(yearStart);
    } else if (dateFilter === 'last_7_days') {
      const sd = new Date(now);
      sd.setDate(sd.getDate() - 7);
      conditions.push(`date >= $start`);
      groqParams.start = toDateStr(sd);
    } else if (dateFilter === 'last_30_days') {
      const sd = new Date(now);
      sd.setDate(sd.getDate() - 30);
      conditions.push(`date >= $start`);
      groqParams.start = toDateStr(sd);
    } else if (startDate && endDate) {
      conditions.push(`date >= $start && date <= $end`);
      groqParams.start = startDate;
      groqParams.end = endDate;
    } else if (startDate) {
      conditions.push(`date >= $start`);
      groqParams.start = startDate;
    }

    let query = `*[_type == "bill"`;
    if (conditions.length > 0) {
      query += ' && ' + conditions.join(' && ');
    }
    query += `] | order(date desc, createdAt desc)`;

    const all = await sanityClient.fetch(query, groqParams);

    if (legacy) {
      return NextResponse.json({ data: all.map(enrichBill) });
    }

    const enriched = all.map(enrichBill);

    const kpi = {
      totalAmount: Number((enriched.reduce((s, b) => s + (Number(b.total) || 0), 0)).toFixed(2)),
      paidAmount: Number((enriched.reduce((s, b) => s + (Number(b.totalPaid) || 0), 0)).toFixed(2)),
      creditAmount: Number((enriched.reduce((s, b) => s + (Number(b.creditAmount) || 0), 0)).toFixed(2)),
      todayOrderCount: enriched.length,
      completedOrders: enriched.filter(b => String(b.billStatus || '').toUpperCase() === 'PAID').length,
      todayCreditOrderCount: enriched.filter(b => String(b.billStatus || '').toUpperCase() === 'CREDIT' || (Number(b.creditAmount) || 0) > 0).length,
    };

    const start = page * size;
    const slice = enriched.slice(start, start + size);

    return NextResponse.json({
      data: {
        content: slice,
        totalElements: enriched.length,
        totalPages: Math.ceil(enriched.length / size),
        number: page,
        size,
      },
      kpi,
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

    // particulars may arrive as a JSON string (from the create page) or as an array
    let particulars = body.particulars || [];
    if (typeof particulars === 'string') {
      try {
        particulars = JSON.parse(particulars);
      } catch (e) {
        particulars = [];
      }
    }
    if (!Array.isArray(particulars)) particulars = [];

    // Enrich with the particular's name so bills render item names everywhere
    // (mirrors the old backend behavior).
    let particularsByName = {};
    const ids = particulars.map(p => String(p.particularId || p.id || '')).filter(Boolean);
    if (ids.length > 0) {
      try {
        const docs = await sanityClient.fetch(
          `*[_type == "particular" && particularId in $ids]{ particularId, name }`,
          { ids }
        );
        docs.forEach(d => { if (d.particularId) particularsByName[d.particularId] = d.name || ''; });
      } catch (e) { /* non-fatal */ }
    }

    particulars = particulars.map(p => ({
      particularId: p.particularId || p.id || '',
      name: p.name || p.particularName || particularsByName[p.particularId] || particularsByName[p.id] || '',
      qty: Number(p.qty) || 1,
      price: Number(p.price) || 0,
      total_price: Number((Number(p.qty) || 1) * (Number(p.price) || 0)),
    }));

    let totalPaid = parseFloat(body.totalPaid) || 0;
    let total = parseFloat(body.total) || 0;
    let creditAmount = parseFloat(body.creditAmount) || 0;
    const normalized = normalizeTotals(total, totalPaid, creditAmount);
    totalPaid = normalized.totalPaid;

    const billStatus = body.billStatus || computeBillStatus({
      payment: body.payment,
      total,
      totalPaid,
      creditAmount,
    });

    const doc = {
      _type: 'bill',
      billNumber,
      date: body.date || toDateStr(new Date()),
      employee: body.employee || session?.username || '',
      customerName: body.customerName || '',
      customerEmail: body.customerEmail || '',
      customerMobileNo: body.customerMobileNo || '',
      customerGstNo: body.customerGstNo || '',
      payment: body.payment || 'Cash',
      totalPaid,
      total: Number(total.toFixed(2)),
      creditAmount: Number(creditAmount.toFixed(2)),
      totalWithGst: parseFloat(body.totalWithGst) || total,
      actualTotal: body.actualTotal !== undefined ? parseFloat(body.actualTotal) : Number(total.toFixed(2)),
      totalItems: parseInt(body.totalItems) || particulars.length,
      billStatus,
      creditPaidAmount: parseFloat(body.creditPaidAmount) || 0,
      particularsJson: JSON.stringify(particulars),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: { ...created, id: created._id, particulars } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}