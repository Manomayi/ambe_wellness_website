import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  const isProtectedRoute = 
    pathname.startsWith('/user/') || 
    pathname.startsWith('/doctor/');

  const isAuthRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email');

  // Client-side and route guard handles authentication & email verification
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
