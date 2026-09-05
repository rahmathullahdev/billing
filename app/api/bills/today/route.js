import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

// GET /api/bills/today?page=0&size=15
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '15');

  try {
    const today = toDateStr(new Date());
    const all = await sanityClient.fetch(
      `*[_type == "bill" && date == $today] | order(createdAt desc)`,
      { today }
    );

    const enriched = all.map(b => ({ ...b, id: b._id, particulars: parseParticulars(b) }));

    const todayCreditOrders = enriched.filter(b =>
      String(b.billStatus || '').toUpperCase() === 'CREDIT' || (Number(b.creditAmount) || 0) > 0
    );

    const sum = (list, key) => Number((list.reduce((s, b) => s + (Number(b[key]) || 0), 0)).toFixed(2));

    const summary = {
      todayBillsTotal: sum(enriched, 'total'),
      todayOrderCount: enriched.length,
      todayCreditOrderCount: todayCreditOrders.length,
      todayCreditOrdersAmount: sum(todayCreditOrders, 'creditAmount'),
      creditPaidAmount: sum(todayCreditOrders, 'creditPaidAmount'),
      creditBalanceAmount: Number((todayCreditOrders.reduce((s, b) => s + ((Number(b.creditAmount) || 0) - (Number(b.creditPaidAmount) || 0)), 0)).toFixed(2)),
    };

    const start = page * size;
    const slice = enriched.slice(start, start + size);

    return NextResponse.json({
      data: {
        summary,
        bills: {
          content: slice,
          totalElements: enriched.length,
          totalPages: Math.ceil(enriched.length / size),
          number: page,
          size,
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}