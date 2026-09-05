import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/bills/credit-bills
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const customerName = searchParams.get('customerName') || '';
  const status = searchParams.get('status') || '';

  try {
    let query = `*[_type == "bill"`;
    const conditions = ['(billStatus == "CREDIT" || creditAmount > 0)'];
    if (customerName) conditions.push(`customerName match "*${customerName}*"`);
    if (status) conditions.push(`billStatus == "${status}"`);
    query += ' && ' + conditions.join(' && ');
    query += `] | order(createdAt desc)`;

    const all = await sanityClient.fetch(query);
    const start = page * size;

    return NextResponse.json({
      data: {
        content: all.slice(start, start + size),
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        number: page, size,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
