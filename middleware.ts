import { createMiddlewareClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and authentication
 * This middleware runs on every request and can be used to:
 * - Protect authenticated routes
 * - Redirect users based on auth state
 * - Set up Supabase session handling
 */

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/sell',
  '/messages',
  '/dashboard',
  '/admin',
];

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/register', '/auth'];

// Routes that are always accessible
const publicRoutes = [
  '/',
  '/marketplace',
  '/games',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/gdpr',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Create Supabase client for middleware
    const supabase = createMiddlewareClient();

    // Refresh session if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    );

    // Check if the current route is an auth route
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Handle protected routes
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle auth routes - redirect authenticated users
    if (isAuthRoute && session) {
      const redirectTo =
        request.nextUrl.searchParams.get('redirectTo') || '/profile';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // For API routes, we might want different handling
    if (pathname.startsWith('/api/')) {
      // Handle API route protection
      return handleApiRoute(request, session);
    }

    // Continue with the request
    const response = NextResponse.next();

    // Set headers for better security
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // In case of error, allow the request to continue
    // but log the error for debugging
    return NextResponse.next();
  }
}

/**
 * Handle API route protection
 */
async function handleApiRoute(request: NextRequest, session: any) {
  const { pathname } = request.nextUrl;

  // Public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/health',
    '/api/games/search',
    '/api/listings/public',
  ];

  const isPublicApiRoute = publicApiRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Protected API routes that require authentication
  const protectedApiRoutes = [
    '/api/profile',
    '/api/listings/create',
    '/api/listings/update',
    '/api/messages',
    '/api/admin',
  ];

  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If it's a protected API route and no session, return 401
  if (isProtectedApiRoute && !session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // For public API routes or authenticated requests, continue
  return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
