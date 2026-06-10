import { NextResponse, type NextRequest } from "next/server";

// Lightweight gate: redirect signed-out visitors away from the dashboard.
// Real enforcement happens via auth() in server components and API routes,
// since database sessions can't be fully validated from the cookie alone.
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
