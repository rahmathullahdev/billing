import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { cleanString, isEmail, isPhone, toNumber } from '@/lib/validate';

function validateEmployee(body) {
  const firstName = cleanString(body?.firstName, { max: 80 });
  const lastName = cleanString(body?.lastName, { max: 80 });
  if (!firstName || !lastName) return { error: 'First and last name are required' };

  const email = cleanString(body?.email, { max: 254 });
  if (email && !isEmail(email)) return { error: 'Invalid email address' };

  const phone = cleanString(body?.phone, { max: 30 });
  if (phone && !isPhone(phone)) return { error: 'Invalid phone number' };

  return {
    data: {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone,
      email,
      role: cleanString(body?.role, { max: 60 }) || 'User',
      dateOfJoining: cleanString(body?.dateOfJoining, { max: 40 }) || null,
      dateOfResign: cleanString(body?.dateOfResign, { max: 40 }) || null,
      photo: cleanString(body?.photo, { max: 2048 }),
      resume: cleanString(body?.resume, { max: 2048 }),
      designation: cleanString(body?.designation, { max: 120 }),
      branchName: cleanString(body?.branchName, { max: 120 }),
      branchId: cleanString(body?.branchId, { max: 120 }),
      salary: toNumber(body?.salary, { min: 0, max: 1e9, fallback: 0 }),
      isActive: body?.isActive !== false,
    },
  };
}

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  try {
    const doc = await sanityClient.getDocument(id);
    return NextResponse.json({ data: doc });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = validateEmployee(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const updated = await sanityClient.patch(id).set(parsed.data).commit();
    return NextResponse.json({ data: updated });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  const { id } = await params;
  try {
    await sanityClient.delete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
