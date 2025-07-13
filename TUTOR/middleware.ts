import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define user roles
type UserRole = 'student' | 'tutor' | 'admin';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['student', 'tutor', 'admin'],
  '/tutors': ['student', 'tutor', 'admin'],
  '/booking': ['student'],
  '/classroom': ['student', 'tutor'],
  '/sessions': ['student', 'tutor'],
  '/assignments': ['student', 'tutor'],
  '/library': ['student', 'tutor'],
  '/quizzes': ['student', 'tutor'],
  '/wallet': ['student', 'tutor'],
  '/analytics': ['student', 'tutor', 'admin'],
  '/profile': ['student', 'tutor', 'admin'],
  '/admin': ['admin'],
} as const;

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api/auth',
];

// API routes that need authentication
const protectedApiRoutes = [
  '/api/tutors',
  '/api/sessions',
  '/api/payments',
  '/api/assignments',
  '/api/quizzes',
  '/api/analytics',
  '/api/user',
];

// Supported locales for internationalization
const locales = ['en', 'es', 'fr', 'de', 'zh'];
const defaultLocale = 'en';

// JWT secret for token verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function getLocaleFromRequest(request: NextRequest): string {
  // Check for locale in URL path
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (!pathnameIsMissingLocale) {
    return pathname.split('/')[1];
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    if (locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }

  // Check cookie
  const localeCookie = request.cookies.get('locale')?.value;
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie;
  }

  return defaultLocale;
}

function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix for checking
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  
  return publicRoutes.some(route => {
    if (route === '/') {
      return pathWithoutLocale === '/';
    }
    return pathWithoutLocale.startsWith(route);
  });
}

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

function getRequiredRoles(pathname: string): UserRole[] | null {
  // Remove locale prefix for checking
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathWithoutLocale.startsWith(route)) {
      return roles as UserRole[];
    }
  }
  return null;
}

function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle internationalization
  const locale = getLocaleFromRequest(request);
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if locale is missing from URL
  if (pathnameIsMissingLocale && !pathname.startsWith('/api/')) {
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(newUrl);
    response.cookies.set('locale', locale, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // Skip middleware for static files and API auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    response.cookies.set('locale', locale, { maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // Get authentication token
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect to login for protected routes
    if (isProtectedApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    // Invalid token - clear cookie and redirect to login
    if (isProtectedApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Check token expiration
  if (payload.exp * 1000 < Date.now()) {
    if (isProtectedApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Check role-based access
  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles && !hasRequiredRole(payload.role, requiredRoles)) {
    if (isProtectedApiRoute(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    // Redirect to appropriate dashboard based on role
    let redirectPath = `/${locale}/dashboard`;
    if (payload.role === 'admin') {
      redirectPath = `/${locale}/admin`;
    }
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Add user info to request headers for API routes
  const response = NextResponse.next();
  
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
  }

  // Set locale cookie
  response.cookies.set('locale', locale, { maxAge: 60 * 60 * 24 * 365 });

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; media-src 'self' https:;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};