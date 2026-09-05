import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '50');
  const listAll = searchParams.get('listAll') === 'true';
  try {
    const all = await sanityClient.fetch(`*[_type == "employee"] | order(name asc)`);
    if (listAll) return NextResponse.json({ data: all });
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

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = {
      _type: 'employee',
      employeeId: simpleId('EMP'),
      name: body.name,
      phone: body.phone || '',
      email: body.email || '',
      designation: body.designation || '',
      branchName: body.branchName || '',
      branchId: body.branchId || '',
      salary: body.salary || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
