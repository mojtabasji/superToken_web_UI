import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/favicon.ico",
];

export const config = {
  matcher: [
    "/((?!_next|static|images|public).*)",
  ],
};

export function middleware(req: Request) {
  const url = new URL(req.url);
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return NextResponse.next();
  }
  const cookie = req.headers.get("cookie") || "";
  const hasSession = /admin_session=/.test(cookie);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  return NextResponse.next();
}
