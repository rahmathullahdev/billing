import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || '';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    let q = `*[_type == "dailyExpense" && date < "${date}"`;
    if (branch) {
      q += ` && branch == "${branch}"`;
    }
    q += `] | order(date desc)[0]`;

    const lastDoc = await sanityClient.fetch(q);
    const lastClosed = lastDoc ? (Number(lastDoc.cashInHand) || 0) : 0;

    return NextResponse.json({ data: { lastClosed } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
