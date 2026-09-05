import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { signToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password required' }, { status: 400 });
    }

    const cleanInput = email.trim().toLowerCase();

    // Fetch user from Sanity by email OR username
    let user = await sanityClient.fetch(
      `*[_type == "user" && (lower(email) == $input || lower(username) == $input)][0]`,
      { input: cleanInput }
    );

    // Default admin credentials fallback (admin@syndicate.com or admin / admin123 or admin)
    const isDefaultAdmin = (cleanInput === 'admin@syndicate.com' || cleanInput === 'admin' || cleanInput === 'admin@gmail.com') && (password === 'admin123' || password === 'admin');

    if (!user && isDefaultAdmin) {
      // Auto-create default admin user in Sanity
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = {
        _type: 'user',
        _id: 'user-admin-default',
        username: 'admin',
        email: 'admin@syndicate.com',
        password: hashedPassword,
        role: 'ROLE_ADMIN',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await sanityClient.createIfNotExists(user);
    } else if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } else {
      // Verify password for existing user
      let isValid = false;
      if (user.password) {
        isValid = await bcrypt.compare(password, user.password);
      }
      // If password comparison fails, check if default admin fallback
      if (!isValid && isDefaultAdmin) {
        isValid = true;
      }
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Create JWT token
    const token = await signToken({
      userId: user._id,
      email: user.email || 'admin@syndicate.com',
      username: user.username || 'admin',
      role: user.role || 'ROLE_ADMIN',
      branchName: user.branchName || 'Main Branch',
      branchId: user.branchId || null,
    });

    const responseData = {
      token,
      role: user.role || 'ROLE_ADMIN',
      username: user.username || 'admin',
      email: user.email || 'admin@syndicate.com',
      user: {
        id: user._id,
        username: user.username || 'admin',
        email: user.email || 'admin@syndicate.com',
        role: user.role || 'ROLE_ADMIN',
        branchName: user.branchName || 'Main Branch',
        branchId: user.branchId,
      },
    };

    const response = NextResponse.json(responseData, { status: 200 });
    return setSessionCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
