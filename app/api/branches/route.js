import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { cleanString, isEmail, isPhone } from '@/lib/validate';
import { simpleId } from '@/lib/utils';

function validateBranchInput(body) {
  const name = cleanString(body?.name, { max: 160 });
  const email = cleanString(body?.email, { max: 254 }).toLowerCase();
  const phone = cleanString(body?.phone, { max: 20 });

  if (!name) return { error: 'Branch name is required' };
  if (email && !isEmail(email)) return { error: 'A valid email is required' };
  if (phone && !isPhone(phone)) return { error: 'A valid phone number is required' };

  return {
    error: null,
    data: {
      branchId: cleanString(body?.branchId || body?.code, { max: 60 }),
      name,
      address: cleanString(body?.address, { max: 500 }),
      phone,
      email,
      isActive: body?.isActive !== false,
    },
  };
}

export async function GET() {
  const { error, status } = await requireAuth();
  if (error) return NextResponse.json({ error }, { status });
  try {
    const all = await sanityClient.fetch(`*[_type == "branch"] | order(name asc)`);
    return NextResponse.json({ data: all });
  } catch (e) {
    console.error('List branches error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json().catch(() => null);
    const { error: validationError, data } = validateBranchInput(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const doc = {
      _type: 'branch',
      ...data,
      branchId: data.branchId || simpleId('BR'),
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error('Create branch error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
