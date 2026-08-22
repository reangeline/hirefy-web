import { requireSameOrigin } from "@/lib/auth/csrf";
import { clearSessionCookies } from "@/lib/auth/session";

// Não há endpoint de logout no backend hoje (ver .spec/001-auth/spec.md) — puramente
// client-side: só limpamos os cookies de sessão.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  await clearSessionCookies();
  return Response.json({ ok: true });
}
