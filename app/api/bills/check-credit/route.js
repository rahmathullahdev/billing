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
      `*[_type == "bill" && lower(customerName) match $name]{ billNumber, creditAmount, creditPaidAmount, date, customerName, billStatus }`,
      { name: `*${customerName.toLowerCase()}*` }
    );

    const withBalance = (creditBills || []).map(b => ({
      ...b,
      balance: Number((((Number(b.creditAmount) || 0) - (Number(b.creditPaidAmount) || 0)) || 0).toFixed(2)),
    }));
    const outstanding = withBalance.filter(b => b.balance > 0.009);

    const totalCredit = Number((withBalance.reduce((s, b) => s + (Number(b.creditAmount) || 0), 0)).toFixed(2));
    const totalPaid = Number((withBalance.reduce((s, b) => s + (Number(b.creditPaidAmount) || 0), 0)).toFixed(2));
    const balanceToPay = Number(outstanding.reduce((s, b) => s + b.balance, 0).toFixed(2));
    const creditOrdersCount = outstanding.length;
    const iscustomerHasCredit = creditOrdersCount > 0;

    return NextResponse.json({
      data: {
        iscustomerHasCredit,
        creditOrdersCount,
        balanceToPay,
        hasCredit: iscustomerHasCredit,
        pendingCredit: Number((totalCredit - totalPaid).toFixed(2)),
        totalCredit,
        totalPaid,
        bills: withBalance,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}