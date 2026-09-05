import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/bills/next-bill-number
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const last = await sanityClient.fetch(
      `*[_type == "bill"] | order(createdAt desc)[0]{ billNumber }`
    );
    let nextNum = 1;
    if (last?.billNumber) {
      const match = last.billNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const nextBillNumber = `BILL-${String(nextNum).padStart(4, '0')}`;
    return NextResponse.json({ data: nextBillNumber });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
