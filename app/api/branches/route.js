import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import { simpleId } from '@/lib/utils';

function makeGenericRoute(docType, idField, defaultOrderField = 'name') {
  return {
    GET: async (request) => {
      const { error } = await requireAuth(request);
      if (error) return NextResponse.json({ error }, { status: 401 });
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '0');
      const size = parseInt(searchParams.get('size') || '100');
      const listAll = searchParams.get('listAll') === 'true';
      try {
        const all = await sanityClient.fetch(`*[_type == "${docType}"] | order(${defaultOrderField} asc)`);
        if (listAll) return NextResponse.json({ data: all });
        const start = page * size;
        return NextResponse.json({
          data: {
            content: all.slice(start, start + size),
            totalElements: all.length,
            totalPages: Math.ceil(all.length / size),
            number: page,
            size,
          }
        });
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    },
    POST: async (request, body) => {
      const { error } = await requireAuth(request);
      if (error) return NextResponse.json({ error }, { status: 401 });
      try {
        const data = await request.json();
        const doc = { _type: docType, ...data, createdAt: new Date().toISOString() };
        if (idField && !doc[idField]) doc[idField] = simpleId(docType.charAt(0).toUpperCase());
        const created = await sanityClient.create(doc);
        return NextResponse.json({ data: created }, { status: 201 });
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    },
  };
}

// ─── BRANCHES ──────────────────────────────────────────────────────────────
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const all = await sanityClient.fetch(`*[_type == "branch"] | order(name asc)`);
    return NextResponse.json({ data: all });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  try {
    const body = await request.json();
    const doc = {
      _type: 'branch',
      branchId: simpleId('BR'),
      name: body.name,
      address: body.address || '',
      phone: body.phone || '',
      isActive: true,
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
