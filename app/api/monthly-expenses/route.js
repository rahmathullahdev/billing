import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function id() { return 'ME' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); }

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const branch = searchParams.get('branch') || '';
  try {
    let q = `*[_type == "monthlyExpense"`;
    const conds = [];
    if (month) conds.push(`month == ${month}`);
    if (year) conds.push(`year == ${year}`);
    if (branch) conds.push(`branch == "${branch}"`);
    if (conds.length) q += ' && ' + conds.join(' && ');
    q += `] | order(createdAt desc)`;
    const all = await sanityClient.fetch(q);
    return NextResponse.json({ data: all });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
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
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
