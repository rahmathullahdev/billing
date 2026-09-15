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
    const expenseDate = body.date || new Date().toISOString().split('T')[0];

    // 1. Fetch today's bills to calculate sales
    const todayBills = await sanityClient.fetch(
      `*[_type == "bill" && date == $expenseDate]`,
      { expenseDate }
    );

    // 2. Fetch bills updated today to calculate paid credits
    const startOfDay = expenseDate + "T00:00:00.000Z";
    const endOfDay = expenseDate + "T23:59:59.999Z";
    const updatedTodayBills = await sanityClient.fetch(
      `*[_type == "bill" && updatedAt >= $startOfDay && updatedAt <= $endOfDay]`,
      { startOfDay, endOfDay }
    );

    let totalSales = 0;
    let paidSales = 0;
    let creditSales = 0;
    const customers = new Set();
    const creditsMap = {};

    todayBills.forEach(b => {
      totalSales += (Number(b.total) || 0);
      paidSales += (Number(b.totalPaid) || 0);
      creditSales += (Number(b.creditAmount) || 0);
      
      if (b.customerName && b.customerName.trim() !== '') {
        customers.add(b.customerName.trim());
      }

      const status = (b.billStatus || '').toLowerCase();
      const creditAmt = Number(b.creditAmount) || 0;
      if (status === 'credit' || creditAmt > 0) {
        const cName = b.customerName && b.customerName.trim() !== '' ? b.customerName.trim() : 'Unknown';
        creditsMap[cName] = (creditsMap[cName] || 0) + creditAmt;
      }
    });

    let paidCredits = 0;
    updatedTodayBills.forEach(b => {
      paidCredits += (Number(b.creditPaidAmount) || 0);
    });

    const advancePaidTotal = (body.advancePaid || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const otherIncomeTotal = (body.otherIncomes || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const expensesTotal = (body.expensive || []).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const otherExpensesTotal = (body.otherExpensive || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const cashDepositTotal = (body.cashDeposit || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    let lastClosed = Number(body.lastClosed) || 0;
    if (lastClosed === 0) {
      let q = `*[_type == "dailyExpense" && date < "${expenseDate}"`;
      if (body.branch) {
        q += ` && branch == "${body.branch}"`;
      }
      q += `] | order(date desc)[0]`;
      const lastDoc = await sanityClient.fetch(q);
      if (lastDoc) {
        lastClosed = Number(lastDoc.cashInHand) || 0;
      }
    }
    
    const cashInHand = Number(body.cashInHand) || 0;

    const cashInHandExpected = lastClosed + paidSales + paidCredits + advancePaidTotal + otherIncomeTotal - (expensesTotal + otherExpensesTotal) - cashDepositTotal;
    const shortage = cashInHandExpected - cashInHand;

    const doc = {
      _type: 'dailyExpense',
      dailyExpenseId: body.dailyExpenseId || id(),
      date: expenseDate,
      branch: body.branch || '',
      cashInHand: cashInHand,
      lastClosed: lastClosed,
      shortage: shortage,
      imageUrl: body.imageUrl || body.image || '',
      totalCash: Number(body.totalCash) || 0,
      expensiveJson: JSON.stringify(body.expensive || []),
      otherExpensiveJson: JSON.stringify(body.otherExpensive || []),
      advancePaidJson: JSON.stringify(body.advancePaid || []),
      checkPaymentJson: JSON.stringify(body.checkPayment || []),
      cashDepositJson: JSON.stringify(body.cashDeposit || []),
      otherIncomesJson: JSON.stringify(body.otherIncomes || []),
      machineReadingJson: JSON.stringify(body.machineReading || []),
      creditsJson: JSON.stringify(creditsMap),
      totalSales: totalSales,
      paidSales: paidSales,
      creditSales: creditSales,
      totalCustomer: customers.size,
      cashInHandExpected: cashInHandExpected,
      paidCredits: paidCredits,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
