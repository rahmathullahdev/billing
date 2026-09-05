import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
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

// GET /api/bills/credit-bills?page=0&size=10&dateFilter=all&startDate=&endDate=&customerName=&status=
// Mirrors old backend GET /bills/credit-bills (Page<BillResponse>).
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const dateFilter = searchParams.get('dateFilter') || 'all';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const customerName = searchParams.get('customerName') || '';
  const status = (searchParams.get('status') || '').toLowerCase();

  try {
    const conditions = ['(lower(billStatus) == "credit" || creditAmount > 0)'];
    const groqParams = {};

    if (status && status !== 'all') {
      conditions.push(`lower(billStatus) == $status`);
      groqParams.status = status;
    }

    if (customerName) {
      conditions.push(`lower(customerName) match $custName`);
      groqParams.custName = `*${customerName.toLowerCase()}*`;
    }

    if (dateFilter && dateFilter !== 'all' && dateFilter !== 'all_time') {
      const now = new Date();
      const today = toDateStr(now);
      let start = '';
      let end = '';

      if (dateFilter === 'today') {
        start = today;
        end = today;
      } else if (dateFilter === 'yesterday') {
        const yd = new Date(now);
        yd.setDate(yd.getDate() - 1);
        start = toDateStr(yd);
        end = toDateStr(yd);
      } else if (dateFilter === 'this_week') {
        const weekStart = startOfWeek(now);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        start = toDateStr(weekStart);
        end = toDateStr(weekEnd);
      } else if (dateFilter === 'last_week') {
        const thisMonday = startOfWeek(now);
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const lastSunday = new Date(thisMonday);
        lastSunday.setDate(lastSunday.getDate() - 1);
        start = toDateStr(lastMonday);
        end = toDateStr(lastSunday);
      } else if (dateFilter === 'this_month') {
        start = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
        end = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      } else if (dateFilter === 'last_month') {
        start = toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        end = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));
      } else if (dateFilter === 'custom_range' && startDate && endDate) {
        start = startDate;
        end = endDate;
      }

      if (start && end) {
        conditions.push(`date >= $start && date <= $end`);
        groqParams.start = start;
        groqParams.end = end;
      }
    }

    let query = `*[_type == "bill" && ${conditions.join(' && ')}] | order(date desc, createdAt desc)`;
    const all = await sanityClient.fetch(query, groqParams);

    const enriched = all.map(enrichBill);
    const totalElements = enriched.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;

    return NextResponse.json({
      data: {
        content: enriched.slice(start, start + size),
        totalElements,
        totalPages,
        number: page,
        size,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}