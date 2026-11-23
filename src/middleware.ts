import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const authPaths = ["/dashboard", "/checkout"];
  const adminPaths = ["/admin"];

  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));
  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));

  // Check for session token (NextAuth sets this cookie)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if ((isAuthPath || isAdminPath) && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin paths, we'll check the role in the layout/page level
  // since middleware can't access the database in Edge Runtime

  // Protect payment result pages from direct access without parameters
  if (pathname === "/payment/success") {
    if (!request.nextUrl.searchParams.has("invoice")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname === "/payment/failed") {
    if (!request.nextUrl.searchParams.has("reason")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/payment/:path*",
  ],
};
