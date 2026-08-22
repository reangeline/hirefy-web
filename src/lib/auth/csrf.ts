/**
 * Bloqueia requisições cross-site nas rotas de auth que mudam estado (login, signup, etc).
 * `Sec-Fetch-Site` é setado pelo próprio browser e não pode ser forjado por JS, mesmo em
 * `fetch(..., { mode: "no-cors" })` — por isso é a defesa primária contra o truque de evitar
 * preflight com `Content-Type: text/plain` (ver achado de segurança da spec 001).
 */
export function requireSameOrigin(req: Request): Response | null {
  const secFetchSite = req.headers.get("sec-fetch-site");

  if (secFetchSite) {
    if (secFetchSite === "same-origin" || secFetchSite === "none") return null;
    return forbiddenResponse();
  }

  // Fallback pra browsers sem Sec-Fetch-Site (Safari < 16.4). Origin é enviado pelo browser
  // em toda requisição POST via fetch/XHR e também não pode ser forjado por JS.
  const origin = req.headers.get("origin");
  if (origin && origin === new URL(req.url).origin) return null;

  return forbiddenResponse();
}

function forbiddenResponse(): Response {
  return Response.json(
    { error: "Forbidden", message: "Cross-site request blocked" },
    { status: 403 },
  );
}
