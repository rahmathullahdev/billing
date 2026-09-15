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
    
    // Retrieve the existing entity's date if not provided in body
    const existing = await sanityClient.getDocument(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const expenseDate = body.date || existing.date || new Date().toISOString().split('T')[0];

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

    // Lists parsing for expenses (prefer body over existing if provided, else use existing)
    const advancePaid = body.advancePaid !== undefined ? body.advancePaid : (existing.advancePaidJson ? JSON.parse(existing.advancePaidJson) : []);
    const otherIncomes = body.otherIncomes !== undefined ? body.otherIncomes : (existing.otherIncomesJson ? JSON.parse(existing.otherIncomesJson) : []);
    const expenses = body.expensive !== undefined ? body.expensive : (existing.expensiveJson ? JSON.parse(existing.expensiveJson) : []);
    const otherExpenses = body.otherExpensive !== undefined ? body.otherExpensive : (existing.otherExpensiveJson ? JSON.parse(existing.otherExpensiveJson) : []);
    const cashDeposits = body.cashDeposit !== undefined ? body.cashDeposit : (existing.cashDepositJson ? JSON.parse(existing.cashDepositJson) : []);

    const advancePaidTotal = advancePaid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const otherIncomeTotal = otherIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const expensesTotal = expenses.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const otherExpensesTotal = otherExpenses.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const cashDepositTotal = cashDeposits.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    let lastClosed = body.lastClosed !== undefined ? Number(body.lastClosed) : Number(existing.lastClosed || 0);
    if (lastClosed === 0) {
      let q = `*[_type == "dailyExpense" && date < "${expenseDate}"`;
      if (body.branch !== undefined ? body.branch : existing.branch) {
        q += ` && branch == "${body.branch !== undefined ? body.branch : existing.branch}"`;
      }
      q += `] | order(date desc)[0]`;
      const lastDoc = await sanityClient.fetch(q);
      if (lastDoc) {
        lastClosed = Number(lastDoc.cashInHand) || 0;
      }
    }
    
    const cashInHand = body.cashInHand !== undefined ? Number(body.cashInHand) : Number(existing.cashInHand || 0);

    const cashInHandExpected = lastClosed + paidSales + paidCredits + advancePaidTotal + otherIncomeTotal - (expensesTotal + otherExpensesTotal) - cashDepositTotal;
    const shortage = cashInHandExpected - cashInHand;

    const u = await sanityClient.patch(params.id).set({
      date: expenseDate,
      branch: body.branch !== undefined ? body.branch : existing.branch,
      cashInHand: cashInHand,
      lastClosed: lastClosed,
      shortage: shortage,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
      totalCash: body.totalCash !== undefined ? Number(body.totalCash) : Number(existing.totalCash || 0),
      expensiveJson: body.expensive !== undefined ? JSON.stringify(body.expensive) : existing.expensiveJson,
      otherExpensiveJson: body.otherExpensive !== undefined ? JSON.stringify(body.otherExpensive) : existing.otherExpensiveJson,
      advancePaidJson: body.advancePaid !== undefined ? JSON.stringify(body.advancePaid) : existing.advancePaidJson,
      checkPaymentJson: body.checkPayment !== undefined ? JSON.stringify(body.checkPayment) : existing.checkPaymentJson,
      cashDepositJson: body.cashDeposit !== undefined ? JSON.stringify(body.cashDeposit) : existing.cashDepositJson,
      otherIncomesJson: body.otherIncomes !== undefined ? JSON.stringify(body.otherIncomes) : existing.otherIncomesJson,
      machineReadingJson: body.machineReading !== undefined ? JSON.stringify(body.machineReading) : existing.machineReadingJson,
      creditsJson: JSON.stringify(creditsMap),
      totalSales: totalSales,
      paidSales: paidSales,
      creditSales: creditSales,
      totalCustomer: customers.size,
      cashInHandExpected: cashInHandExpected,
      paidCredits: paidCredits,
    }).commit();
    return NextResponse.json({ data: u });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
