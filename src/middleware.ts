import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

/**
 * Protected routes that require authentication (locale-prefixed)
 */
const PROTECTED_ROUTE_PATTERNS = [
  "/dashboard",
  "/crm",
  "/bookings",
  "/profile",
  "/admin",
];

// next-intl middleware handles /ar and /en routing
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Strip locale prefix to check the actual path
  // e.g., /ar/dashboard -> /dashboard
  const pathnameWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  const isProtectedRoute = PROTECTED_ROUTE_PATTERNS.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtectedRoute) {
    // Update Supabase session and check auth
    const { response, user } = await updateSession(request);

    if (!user) {
      // Preserve locale in redirect
      const locale = pathname.startsWith("/en") ? "en" : "ar";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Run intl middleware on top of the auth response
    const intlResponse = intlMiddleware(request);
    // Carry over session cookies from auth response
    response.cookies.getAll().forEach(({ name, value }) => {
      intlResponse.cookies.set(name, value);
    });
    return intlResponse;
  }

  // For non-protected routes, just handle i18n routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
