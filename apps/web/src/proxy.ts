import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySession, type Role } from "@/lib/session";

const PORTAL_ROOT: Record<Role, string> = {
  STUDENT: "/student",
  TUTOR: "/tutor",
  ADMIN: "/admin",
};

const ROLE_FOR_PREFIX: Record<string, Role> = {
  "/student": "STUDENT",
  "/tutor": "TUTOR",
  "/admin": "ADMIN",
};

const AUTH_PAGES = ["/login", "/register"];

// Optimistic RBAC: verifies the JWT cookie's signature/expiry/role and redirects
// accordingly. The API independently re-verifies the same token on every request
// it actually serves data for — this is a fast, cookie-only pre-filter, not the
// security boundary.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  const portalPrefix = Object.keys(ROLE_FOR_PREFIX).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (portalPrefix) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== ROLE_FOR_PREFIX[portalPrefix]) {
      return NextResponse.redirect(new URL(PORTAL_ROOT[session.role], request.url));
    }
  }

  if (session && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(PORTAL_ROOT[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/tutor/:path*", "/admin/:path*", "/login", "/register"],
};
