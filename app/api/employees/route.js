import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth, requireRole, ROLES } from '@/lib/auth';
import { cleanString, isEmail, isPhone, toNumber } from '@/lib/validate';

function simpleId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

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

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
  const size = Math.min(500, Math.max(1, parseInt(searchParams.get('size') || '50', 10) || 50));
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
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request) {
  const { error, status } = await requireRole([ROLES.ADMIN]);
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await request.json();
    const parsed = validateEmployee(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const doc = {
      _type: 'employee',
      employeeId: simpleId('EMP'),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    const created = await sanityClient.create(doc);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) { console.error('API error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
