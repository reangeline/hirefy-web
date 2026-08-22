import { NextRequest, NextResponse } from "next/server";

// Protege tudo dentro de (dashboard). O proxy só checa se o cookie existe — validar o
// token de verdade (expiração/assinatura) é responsabilidade do backend a cada chamada; se o
// access_token estiver expirado, a chamada autenticada cai em 401 e o lib/api/client.ts do
// browser cuida do refresh (ver .spec/001-auth/spec.md).
const PROTECTED_PREFIXES = ["/dashboard", "/resume", "/optimize", "/profile", "/billing"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has("access_token");
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/resume/:path*", "/optimize/:path*", "/profile/:path*", "/billing/:path*"],
};
