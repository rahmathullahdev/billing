import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import { cleanString, toInt } from '@/lib/validate';

function id() { return 'ME' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); }

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const branch = searchParams.get('branch') || '';
  try {
    const conds = [];
    const groqParams = {};
    const monthNum = month ? toInt(month, { min: 1, max: 12, fallback: 0 }) : 0;
    const yearNum = year ? toInt(year, { min: 1900, max: 3000, fallback: 0 }) : 0;
    const branchFilter = cleanString(branch, { max: 120 });
    if (monthNum) { conds.push('month == $month'); groqParams.month = monthNum; }
    if (yearNum) { conds.push('year == $year'); groqParams.year = yearNum; }
    if (branchFilter) { conds.push('branch == $branch'); groqParams.branch = branchFilter; }
    const q = `*[_type == "monthlyExpense"${conds.length ? ' && ' + conds.join(' && ') : ''}] | order(createdAt desc)`;
    const all = await sanityClient.fetch(q, groqParams);
    return NextResponse.json({ data: all });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const d = new Date();
    const rows = Array.isArray(body.expensive) && body.expensive.length
      ? body.expensive
      : [{ name: body.name || body.expenseItem, amount: body.amount, category: body.category, paymentType: body.paymentType, isPaid: body.isPaid }];

    const created = await Promise.all(rows.map((row) => sanityClient.create({
      _type: 'monthlyExpense',
      monthlyExpenseId: id(),
      name: row.name || row.expenseItem || 'Monthly Expense',
      amount: parseFloat(row.amount) || 0,
      month: parseInt(body.month || row.month || (d.getMonth() + 1), 10),
      year: parseInt(body.year || row.year || d.getFullYear(), 10),
      branch: body.branch || row.branch || '',
      category: row.category || '',
      paymentType: row.paymentType || 'Cash',
      isPaid: !!row.isPaid,
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    })));
    return NextResponse.json({ data: created.length === 1 ? created[0] : created }, { status: 201 });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
