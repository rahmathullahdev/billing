import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function id() { return 'PC' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); }

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '50');
  const listAll = searchParams.get('listAll') === 'true';
  try {
    const all = await sanityClient.fetch(`*[_type == "paperCategory"] | order(name asc)`);
    if (listAll) return NextResponse.json({ data: all });
    const s = page * size;
    return NextResponse.json({ data: { content: all.slice(s, s + size), totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, size } });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const created = await sanityClient.create({ _type: 'paperCategory', categoryId: body.categoryId || id(), name: body.name, isActive: true });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
