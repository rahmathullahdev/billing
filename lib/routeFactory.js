// Generic CRUD route factory for simple entities
// Each entity has: GET (list/paginated), POST (create), by-ID: GET, PUT, DELETE

import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

export function makeListRoute(docType, fields = {}, orderField = 'name') {
  return {
    GET: async (request) => {
      const { error } = await requireAuth(request);
      if (error) return NextResponse.json({ error }, { status: 401 });
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '0');
      const size = parseInt(searchParams.get('size') || '100');
      const listAll = searchParams.get('listAll') === 'true';
      try {
        const all = await sanityClient.fetch(`*[_type == "${docType}"] | order(${orderField} asc)`);
        if (listAll) return NextResponse.json({ data: all });
        const start = page * size;
        return NextResponse.json({ data: { content: all.slice(start, start + size), totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, size } });
      } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
    },
    POST: async (request) => {
      const { error } = await requireAuth(request);
      if (error) return NextResponse.json({ error }, { status: 401 });
      try {
        const body = await request.json();
        const idField = Object.keys(fields).find(k => fields[k] === '__ID__');
        const doc = { _type: docType, createdAt: new Date().toISOString(), ...body };
        if (idField && !doc[idField]) doc[idField] = simpleId(docType.substr(0, 3).toUpperCase());
        const created = await sanityClient.create(doc);
        return NextResponse.json({ data: created }, { status: 201 });
      } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
    },
  };
}
