import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /api/bills/next-bill-number
// Returns the next daily bill number in the old date-based format `yyMMddN`
// (e.g., "2609051" for the 1st bill of 05 Sep 2026).
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const now = new Date();
    const today = toDateStr(now);
    const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const todayBills = await sanityClient.fetch(
      `*[_type == "bill" && date == $today]{ billNumber }`,
      { today }
    );

    const count = (todayBills || []).length;
    const billNumber = `${datePrefix}${count + 1}`;

    return NextResponse.json({
      data: {
        billNumber,
        nextBillNumber: billNumber,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}