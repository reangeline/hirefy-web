import { backendErrorResponse, parseAuthTokens, postBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { setSessionCookies } from "@/lib/auth/session";
import type { SignUpRequest } from "@/types/api";

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const body = (await req.json()) as SignUpRequest;

  try {
    const authResp = await postBackend("/auth/signup", body);

    // O backend tenta logar o usuário automaticamente após o signup (ver
    // auth_service_impl.go) — normalmente vem com tokens, mas cai num fallback
    // { message } se o login automático falhar. Tratamos os dois casos.
    try {
      const tokens = parseAuthTokens(authResp);
      await setSessionCookies(tokens);
      return Response.json({ ok: true, hasSession: true });
    } catch {
      return Response.json({ ok: true, hasSession: false });
    }
  } catch (err) {
    return backendErrorResponse(err);
  }
}
