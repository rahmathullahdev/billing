import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { signToken, setSessionCookie } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`login-route:${ip}`, {
    limit: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password required' }, { status: 400 });
    }

    if (email.length > 254 || password.length > 256) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = await sanityClient.fetch(
      `*[_type == "user" && isActive == true && (lower(coalesce(email, '')) == $input || lower(coalesce(username, '')) == $input)][0]`,
      { input: email }
    );

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id,
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'ROLE_USER',
      branchName: user.branchName || '',
      branchId: user.branchId || null,
    });

    const response = NextResponse.json(
      {
        role: user.role || 'ROLE_USER',
        username: user.username || '',
        email: user.email || '',
        user: {
          id: user._id,
          username: user.username || '',
          email: user.email || '',
          role: user.role || 'ROLE_USER',
          branchName: user.branchName || '',
          branchId: user.branchId || null,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );

    return setSessionCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
