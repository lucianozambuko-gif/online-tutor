import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Placeholder: wire this up to real session/JWT verification once auth lands,
// then enforce that /student, /tutor, /admin can only be reached by their role.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/tutor/:path*", "/admin/:path*"],
};
