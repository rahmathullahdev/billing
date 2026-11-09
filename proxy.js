import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit, getClientIp, cleanupBuckets } from '@/lib/rateLimit';

const COOKIE_NAME = 'billing_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short.');
  }
  return new TextEncoder().encode(secret);
}

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

const ADMIN_PAGE_PATHS = [
  '/users',
  '/manage-page-access',
  '/branches',
  '/employees',
  '/sanity-studio',
];

const MANAGER_PAGE_PATHS = ['/settings'];

const STATIC_FILE = /\.(?:png|jpe?g|gif|svg|ico|webp|css|js|map|woff2?|ttf|otf|eot)$/i;

function matchesPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

function isAdminOnlyApi(pathname, method) {
  if (matchesPath(pathname, '/api/users')) return true;
  if (matchesPath(pathname, '/api/page-access') && method !== 'GET') return true;
  if (matchesPath(pathname, '/api/employees') && method !== 'GET') return true;
  if (matchesPath(pathname, '/api/branches') && method !== 'GET') return true;
  return false;
}

function rejectApi(message, status, extraHeaders = {}) {
  return NextResponse.json({ error: message }, { status, headers: extraHeaders });
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  cleanupBuckets();

  // Block cross-site state-changing API requests (CSRF defense).
  if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return rejectApi('Cross-origin request blocked', 403);
        }
      } catch {
        return rejectApi('Invalid origin', 403);
      }
    }
  }

  // Rate limit the login endpoint more aggressively than the rest of the API.
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const isLogin = pathname === '/api/auth/login';
    const result = isLogin
      ? rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })
      : rateLimit(`api:${ip}`, { limit: 300, windowMs: 60 * 1000 });

    if (!result.allowed) {
      return rejectApi('Too many requests. Please try again later.', 429, {
        'Retry-After': String(result.retryAfter),
      });
    }
  }

  // Allow public paths.
  if (PUBLIC_PATHS.some((p) => matchesPath(pathname, p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files.
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return rejectApi('Unauthorized', 401);
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let session;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    session = payload;
  } catch {
    if (pathname.startsWith('/api/')) {
      return rejectApi('Invalid session', 401);
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = session?.role;
  const isAdmin = role === 'ROLE_ADMIN';
  const isManager = isAdmin || role === 'ROLE_MANAGER';

  // Defense-in-depth: enforce admin-only APIs at the edge.
  if (pathname.startsWith('/api/') && isAdminOnlyApi(pathname, method) && !isAdmin) {
    return rejectApi('Forbidden', 403);
  }

  // Protect admin-only pages.
  if (ADMIN_PAGE_PATHS.some((p) => matchesPath(pathname, p)) && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect manager-only pages.
  if (MANAGER_PAGE_PATHS.some((p) => matchesPath(pathname, p)) && !isManager) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If logged in and visiting root, redirect to dashboard.
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
