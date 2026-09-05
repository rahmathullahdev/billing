import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const e = await sanityClient.getDocument(params.id);
    const parsed = { ...e, expensive: e.expensiveJson ? JSON.parse(e.expensiveJson) : [], otherExpensive: e.otherExpensiveJson ? JSON.parse(e.otherExpensiveJson) : [], advancePaid: e.advancePaidJson ? JSON.parse(e.advancePaidJson) : [], checkPayment: e.checkPaymentJson ? JSON.parse(e.checkPaymentJson) : [], cashDeposit: e.cashDepositJson ? JSON.parse(e.cashDepositJson) : [], otherIncomes: e.otherIncomesJson ? JSON.parse(e.otherIncomesJson) : [], machineReading: e.machineReadingJson ? JSON.parse(e.machineReadingJson) : [], credits: e.creditsJson ? JSON.parse(e.creditsJson) : [] };
    return NextResponse.json({ data: parsed });
  } catch (ex) { return NextResponse.json({ error: ex.message }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const u = await sanityClient.patch(params.id).set({
      date: body.date, branch: body.branch || '', cashInHand: body.cashInHand || 0, lastClosed: body.lastClosed || 0, shortage: body.shortage || 0,
      imageUrl: body.imageUrl || '', totalCash: body.totalCash || 0,
      expensiveJson: JSON.stringify(body.expensive || []), otherExpensiveJson: JSON.stringify(body.otherExpensive || []),
      advancePaidJson: JSON.stringify(body.advancePaid || []), checkPaymentJson: JSON.stringify(body.checkPayment || []),
      cashDepositJson: JSON.stringify(body.cashDeposit || []), otherIncomesJson: JSON.stringify(body.otherIncomes || []),
      machineReadingJson: JSON.stringify(body.machineReading || []), creditsJson: JSON.stringify(body.credits || []),
      totalSales: body.totalSales || 0, paidSales: body.paidSales || 0, creditSales: body.creditSales || 0,
      totalCustomer: body.totalCustomer || 0, cashInHandExpected: body.cashInHandExpected || 0, paidCredits: body.paidCredits || 0,
    }).commit();
    return NextResponse.json({ data: u });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
