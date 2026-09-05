import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/bills/check-credit?customerName=...
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const customerName = searchParams.get('customerName') || '';
  try {
    const creditBills = await sanityClient.fetch(
      `*[_type == "bill" && customerName match $name && billStatus == "CREDIT"]{ billNumber, creditAmount, creditPaidAmount, date, customerName }`,
      { name: `*${customerName}*` }
    );
    const totalCredit = creditBills.reduce((s, b) => s + (b.creditAmount || 0), 0);
    const totalPaid = creditBills.reduce((s, b) => s + (b.creditPaidAmount || 0), 0);
    return NextResponse.json({
      data: {
        hasCredit: totalCredit > totalPaid,
        totalCredit,
        totalPaid,
        pendingCredit: totalCredit - totalPaid,
        bills: creditBills,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
