import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "cvm_token";

/**
 * Reads `exp` without verifying the signature. That is deliberate: the Edge runtime has
 * no crypto for HS256, and verification here would be redundant — the API validates the
 * signature on every request. This check is purely so an expired session redirects
 * instead of rendering a dashboard that immediately 401s.
 */
function isUsable(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token && isUsable(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  // Distinguish "you were signed in and it lapsed" from "you were never signed in", so the
  // login page can explain why the user is suddenly looking at it.
  if (token) url.searchParams.set("reason", "expired");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/cv/:path*"],
};
