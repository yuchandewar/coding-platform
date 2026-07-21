import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production'
);

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;

  const path = request.nextUrl.pathname;

  // Allow unauthenticated access to login and register pages
  const isAuthPage = path.endsWith('/login') || path.endsWith('/register');

  // Protect /admin routes
  if (path.startsWith('/admin') && !isAuthPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/student', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /student routes
  if (path.startsWith('/student') && !isAuthPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'student') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*'],
};
