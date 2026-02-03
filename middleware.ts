import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/src/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/src/auth/cookies";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/portfolio",
  "/risk",
  "/journal",
  "/settings",
  "/ai",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await verifySessionToken(token);
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portfolio/:path*",
    "/risk/:path*",
    "/journal/:path*",
    "/settings/:path*",
    "/ai/:path*",
  ],
};
