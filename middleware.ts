import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  // Define protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');
  
  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};