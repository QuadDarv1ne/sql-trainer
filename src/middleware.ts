import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/profile'];

// Routes that should redirect to / if already authenticated
const authRoutes = ['/login', '/register', '/reset-password'];

export default auth(async (request) => {
  const pathname = request.nextUrl.pathname;
  const session = await auth();

  // Redirect authenticated users away from auth pages
  if (authRoutes.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/login', '/register', '/reset-password', '/profile/:path*'],
};
