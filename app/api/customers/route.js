import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

// GET /api/customers - all customers
// GET /api/customers?paginated=true&page=0&size=10
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const paginated = searchParams.get('paginated') === 'true';
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const search = searchParams.get('search') || '';

  try {
    let query = `*[_type == "customer"`;
    const params = {};
    if (search) {
      query += ` && (name match $search || phoneNumber match $search)`;
      params.search = `*${search}*`;
    }
    query += `] | order(name asc)`;

    const all = await sanityClient.fetch(query, params);

    if (paginated) {
      const start = page * size;
      const slice = all.slice(start, start + size);
      return NextResponse.json({
        data: {
          content: slice,
          totalElements: all.length,
          totalPages: Math.ceil(all.length / size),
          number: page,
          size,
        }
      });
    }

    return NextResponse.json({ data: all });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const doc = {
      _type: 'customer',
      name: body.name,
      email: body.email || '',
      phoneNumber: body.phoneNumber,
      companyName: body.companyName || '',
      taxNumber: body.taxNumber || '',
      address: body.address || '',
      creditAmount: parseFloat(body.creditAmount) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
