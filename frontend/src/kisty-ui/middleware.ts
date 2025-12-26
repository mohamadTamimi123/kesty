import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/admin/login",
  "/register",
  "/otp",
  "/brandbook",
  "/about",
  "/contact",
];

// Protected routes that require authentication
const protectedRoutes = ["/dashboard"];

// Admin-only routes
const adminRoutes = ["/dashboard/admin"];

// Helper function to decode JWT without verification (for role extraction)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Allow public routes
  if (isPublicRoute || !isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for auth token in Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.replace("Bearer ", "");
  const tokenFromCookie = request.cookies.get("accessToken")?.value;
  const token = tokenFromHeader || tokenFromCookie;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Path:', pathname);
    console.log('[Middleware] Token from cookie:', tokenFromCookie ? 'exists' : 'missing');
    console.log('[Middleware] Token from header:', tokenFromHeader ? 'exists' : 'missing');
  }

  // Redirect to login if not authenticated
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Redirecting to login:', loginUrl.toString());
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes - verify role from token
  if (pathname.startsWith("/dashboard/admin") && token) {
    const decoded = decodeJWT(token);
    const userRole = decoded?.role?.toUpperCase();

    if (userRole !== "ADMIN") {
      // Redirect non-admin users away from admin routes
      const redirectUrl = new URL("/dashboard/customer", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check supplier routes
  if (pathname.startsWith("/dashboard/supplier") && token) {
    const decoded = decodeJWT(token);
    const userRole = decoded?.role?.toUpperCase();

    if (userRole !== "SUPPLIER" && userRole !== "ADMIN") {
      const redirectUrl = new URL("/dashboard/customer", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

