import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { validateCustomerInput, cleanString, toInt } from '@/lib/validate';

// GET /api/customers - all customers
// GET /api/customers?paginated=true&page=0&size=10
export async function GET(request) {
  const { error, status } = await requireAuth();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const paginated = searchParams.get('paginated') === 'true';
  const page = toInt(searchParams.get('page'), { min: 0, max: 100000, fallback: 0 });
  const size = toInt(searchParams.get('size'), { min: 1, max: 200, fallback: 10 });
  const search = cleanString(searchParams.get('search') || '', { max: 100 });

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
        },
      });
    }

    return NextResponse.json({ data: all });
  } catch (e) {
    console.error('List customers error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request) {
  const { error, status } = await requireRole([ROLES.ADMIN, ROLES.MANAGER]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateCustomerInput(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const doc = {
      _type: 'customer',
      ...data,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error('Create customer error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
