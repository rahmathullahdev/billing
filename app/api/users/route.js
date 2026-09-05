import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

function simpleId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

export async function GET(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const users = await sanityClient.fetch(`*[_type == "user"]{ _id, username, email, role, isActive, branchName, branchId } | order(username asc)`);
    return NextResponse.json({ data: users });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const { error, session } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  if (session?.role !== 'ROLE_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const doc = {
      _type: 'user',
      username: body.username,
      email: body.email,
      password: hashedPassword,
      role: body.role || 'ROLE_USER',
      isActive: true,
      branchName: body.branchName || '',
      branchId: body.branchId || '',
    };
    const created = await sanityClient.create(doc);
    const { password: _, ...safe } = created;
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
