import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sameSecret, sessionCookie, sessionToken } from "@/lib/consultorio/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/consultorio/ingreso" || pathname === "/consultorio/manifest") {
    return NextResponse.next();
  }

  const password = process.env.CONSULTORIO_PASSWORD;
  const token = request.cookies.get(sessionCookie)?.value ?? "";
  const valid = Boolean(password && token && sameSecret(token, await sessionToken(password)));
  if (valid) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/consultorio/ingreso";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/consultorio", "/consultorio/:path*"],
};
