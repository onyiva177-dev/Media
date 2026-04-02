import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin API routes (everything except /api/admin/login)
  if (
    pathname.startsWith("/api/admin") &&
    !pathname.endsWith("/login") &&
    !pathname.endsWith("/logout")
  ) {
    const session = request.cookies.get("admin_session");
    if (!session || session.value !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
