import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  const isProtectedRoute = 
    pathname.startsWith('/user/') || 
    pathname.startsWith('/doctor/');

  const isAuthRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup');

  // For now, we'll rely on client-side auth checking
  // In production, you'd verify the auth token here
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};