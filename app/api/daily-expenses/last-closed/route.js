import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import { cleanString, cleanDate } from '@/lib/validate';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branch = cleanString(searchParams.get('branch') || '', { max: 120 });
  const date = cleanDate(searchParams.get('date') || '') || new Date().toISOString().split('T')[0];

  try {
    const groqParams = { date };
    let q = `*[_type == "dailyExpense" && date < $date`;
    if (branch) {
      q += ' && branch == $branch';
      groqParams.branch = branch;
    }
    q += `] | order(date desc)[0]`;

    const lastDoc = await sanityClient.fetch(q, groqParams);
    const lastClosed = lastDoc ? (Number(lastDoc.cashInHand) || 0) : 0;

    return NextResponse.json({ data: { lastClosed } });
  } catch (e) {
    console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
