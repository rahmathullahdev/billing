import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import { cleanString, cleanDate } from '@/lib/validate';

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
    const conds = [];
    const groqParams = {};
    const start = cleanDate(startDate);
    const end = cleanDate(endDate);
    const branchFilter = cleanString(branch, { max: 120 });
    if (start) { conds.push('date >= $startDate'); groqParams.startDate = start; }
    if (end) { conds.push('date <= $endDate'); groqParams.endDate = end; }
    if (branchFilter) { conds.push('branch == $branch'); groqParams.branch = branchFilter; }
    const q = `*[_type == "dailyExpense"${conds.length ? ' && ' + conds.join(' && ') : ''}] | order(date desc)`;
    const all = await sanityClient.fetch(q, groqParams);
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
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const expenseDate = cleanDate(body.date) || new Date().toISOString().split('T')[0];

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
    let lastClosedDate = null;
    
    const branchFilter = cleanString(body.branch, { max: 120 });
    const lastQParams = { expenseDate };
    let q = `*[_type == "dailyExpense" && date < $expenseDate`;
    if (branchFilter) {
      q += ' && branch == $branch';
      lastQParams.branch = branchFilter;
    }
    q += `] | order(date desc)[0]`;
    
    const lastDoc = await sanityClient.fetch(q, lastQParams);
    if (lastDoc) {
      lastClosedDate = lastDoc.date;
      if (lastClosed === 0) {
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
      lastClosedDate: lastClosedDate,
      shortage: shortage,
      imageUrl: body.imageUrl || body.image || '',
      totalCash: Number(body.totalCash) || 0,
      expensiveJson: JSON.stringify(body.expensive || []),
      totalExpenses: expensesTotal,
      otherExpensiveJson: JSON.stringify(body.otherExpensive || []),
      advancePaidJson: JSON.stringify(body.advancePaid || []),
      totalAdvancePaid: advancePaidTotal,
      checkPaymentJson: JSON.stringify(body.checkPayment || []),
      cashDepositJson: JSON.stringify(body.cashDeposit || []),
      totalCashDeposit: cashDepositTotal,
      otherIncomesJson: JSON.stringify(body.otherIncomes || []),
      totalOtherIncomes: otherIncomeTotal,
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
    return NextResponse.json({ 
      message: 'Daily expenses saved successfully',
      data: created,
      calculatedTotals: {
        totalExpenses: expensesTotal,
        totalAdvancePaid: advancePaidTotal,
        totalCashDeposit: cashDepositTotal,
        totalOtherIncomes: otherIncomeTotal,
        lastClosedDate: lastClosedDate
      }
    }, { status: 201 });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
