import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// GET /api/particulars
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const listAll = searchParams.get('listAll') === 'true';
  const forBill = searchParams.get('forBill') === 'true';
  try {
    let query = `*[_type == "particular"`;
    if (forBill) query += ` && isActive == true`;
    query += `] | order(name asc)`;
    const all = await sanityClient.fetch(query);
    if (listAll || forBill) return NextResponse.json({ data: all });
    const start = page * size;
    return NextResponse.json({
      data: {
        content: all.slice(start, start + size),
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        number: page, size,
      }
    });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// POST /api/particulars
export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = {
      _type: 'particular',
      particularId: body.particularId || simpleId('PART'),
      name: body.name,
      price: parseFloat(body.price) || 0,
      priceBack: parseFloat(body.priceBack) || 0,
      commisionRate: parseFloat(body.commisionRate) || 0,
      machineCategory: body.machineCategory || '',
      machineCategoryId: body.machineCategoryId || '',
      paper: body.paper || '',
      paperId: body.paperId || '',
      paperGroup: body.paperGroup || '',
      paperGroupId: body.paperGroupId || '',
      taxNumber: body.taxNumber || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
