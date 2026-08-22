import { backendErrorResponse, parseAuthTokens, postBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { setSessionCookies } from "@/lib/auth/session";
import type { SocialSignInRequest } from "@/types/api";

// O backend ainda não tem essa rota registrada (ver .spec/001-auth/spec.md) — isso vai
// retornar 404 até o time de backend implementar POST /auth/social. Mantido com o mesmo
// contrato do mobile (auth_service.dart) pra já ficar pronto quando existir.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const body = (await req.json()) as SocialSignInRequest;

  try {
    const authResp = await postBackend("/auth/social", body);
    const tokens = parseAuthTokens(authResp);
    await setSessionCookies(tokens);
    return Response.json({ ok: true });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
