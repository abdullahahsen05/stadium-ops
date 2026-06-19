import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "stadium2034";
const AUTH_COOKIE = "demo_access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, Next.js internals, and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE);
  if (authCookie?.value === DEMO_PASSWORD) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|api).*)"],
};
