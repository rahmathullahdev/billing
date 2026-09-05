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
    const doc = { _type: 'monthlyExpense', monthlyExpenseId: id(), name: body.name, amount: parseFloat(body.amount) || 0, month: body.month || (d.getMonth() + 1), year: body.year || d.getFullYear(), branch: body.branch || '', category: body.category || '', createdAt: new Date().toISOString() };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
