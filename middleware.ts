import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Diese Routen bleiben frei
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/crew") || // Crew Dashboard bleibt offen
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Nur Root schützen
  if (pathname === "/") {
    const auth = req.cookies.get("admin_auth");

    if (!auth) {
      const loginUrl = new URL("/admin-login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}