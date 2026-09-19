import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Protege tudo dentro de (dashboard). O proxy só checa se o cookie existe — validar o
// token de verdade (expiração/assinatura) é responsabilidade do backend a cada chamada; se o
// access_token estiver expirado, a chamada autenticada cai em 401 e o lib/api/client.ts do
// browser cuida do refresh (ver .spec/001-auth/spec.md).
const PROTECTED_PREFIXES = ["/dashboard", "/resume", "/optimize", "/profile", "/billing", "/pipeline", "/linkedin"];

const handleI18nRouting = createMiddleware(routing);

// Roda a checagem de auth primeiro, comparando o pathname SEM prefixo de idioma (en/es têm
// prefixo, pt não — localePrefix "as-needed", spec 021), e só depois aplica o roteamento de
// idioma do next-intl. Isso preserva o comportamento de redirect pra /login?redirect=<path>
// que já existia, agora considerando qualquer um dos 3 idiomas.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/";

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathnameWithoutLocale === prefix || pathnameWithoutLocale.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const hasSession = req.cookies.has("access_token");
    if (!hasSession) {
      const loginPath = pathname.startsWith("/en/") || pathname === "/en" ? "/en/login" : pathname.startsWith("/es/") || pathname === "/es" ? "/es/login" : "/login";
      const loginUrl = new URL(loginPath, req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return handleI18nRouting(req);
}

export const config = {
  matcher: [
    // Mesmo matcher recomendado pelo next-intl (cobre tudo, exceto assets/API/arquivos com
    // extensão) — as rotas protegidas antigas viram um subconjunto disso agora que o
    // middleware também cuida de idioma.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
