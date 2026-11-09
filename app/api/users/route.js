import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireRole, ROLES } from '@/lib/auth';
import { validateUserInput } from '@/lib/validate';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export async function GET() {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    const users = await sanityClient.fetch(
      `*[_type == "user"]{ _id, username, email, role, isActive, branchName, branchId } | order(username asc)`
    );
    return NextResponse.json({ data: users });
  } catch (e) {
    console.error('List users error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateUserInput(body, { requirePassword: true });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const existing = await sanityClient.fetch(
      `*[_type == "user" && (lower(coalesce(email, '')) == $email || lower(coalesce(username, '')) == $username)][0]{ _id }`,
      { email: data.email, username: data.username.toLowerCase() }
    );
    if (existing) {
      return NextResponse.json({ error: 'A user with that email or username already exists' }, { status: 409 });
    }

    const doc = {
      _type: 'user',
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
      role: data.role,
      isActive: data.isActive,
      branchName: data.branchName,
      branchId: data.branchId,
    };

    const created = await sanityClient.create(doc);
    const { password: _, ...safe } = created;
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (e) {
    console.error('Create user error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
