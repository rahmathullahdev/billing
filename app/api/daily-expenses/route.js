import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function id() { return 'DE' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); }

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const branch = searchParams.get('branch') || '';
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '20');
  try {
    let q = `*[_type == "dailyExpense"`;
    const conds = [];
    if (startDate) conds.push(`date >= "${startDate}"`);
    if (endDate) conds.push(`date <= "${endDate}"`);
    if (branch) conds.push(`branch == "${branch}"`);
    if (conds.length) q += ' && ' + conds.join(' && ');
    q += `] | order(date desc)`;
    const all = await sanityClient.fetch(q);
    const parsed = all.map(e => ({
      ...e,
      expensive: e.expensiveJson ? JSON.parse(e.expensiveJson) : [],
      otherExpensive: e.otherExpensiveJson ? JSON.parse(e.otherExpensiveJson) : [],
      advancePaid: e.advancePaidJson ? JSON.parse(e.advancePaidJson) : [],
      checkPayment: e.checkPaymentJson ? JSON.parse(e.checkPaymentJson) : [],
      cashDeposit: e.cashDepositJson ? JSON.parse(e.cashDepositJson) : [],
      otherIncomes: e.otherIncomesJson ? JSON.parse(e.otherIncomesJson) : [],
      machineReading: e.machineReadingJson ? JSON.parse(e.machineReadingJson) : [],
      credits: e.creditsJson ? JSON.parse(e.creditsJson) : [],
    }));
    const s = page * size;
    return NextResponse.json({ data: { content: parsed.slice(s, s + size), totalElements: parsed.length, totalPages: Math.ceil(parsed.length / size), number: page, size } });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = {
      _type: 'dailyExpense',
      dailyExpenseId: body.dailyExpenseId || id(),
      date: body.date || new Date().toISOString().split('T')[0],
      branch: body.branch || '',
      cashInHand: body.cashInHand || 0,
      lastClosed: body.lastClosed || 0,
      shortage: body.shortage || 0,
      imageUrl: body.imageUrl || body.image || '',
      totalCash: body.totalCash || 0,
      expensiveJson: JSON.stringify(body.expensive || []),
      otherExpensiveJson: JSON.stringify(body.otherExpensive || []),
      advancePaidJson: JSON.stringify(body.advancePaid || []),
      checkPaymentJson: JSON.stringify(body.checkPayment || []),
      cashDepositJson: JSON.stringify(body.cashDeposit || []),
      otherIncomesJson: JSON.stringify(body.otherIncomes || []),
      machineReadingJson: JSON.stringify(body.machineReading || []),
      creditsJson: JSON.stringify(body.credits || []),
      totalSales: body.totalSales || 0,
      paidSales: body.paidSales || 0,
      creditSales: body.creditSales || 0,
      totalCustomer: body.totalCustomer || 0,
      cashInHandExpected: body.cashInHandExpected || 0,
      paidCredits: body.paidCredits || 0,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
