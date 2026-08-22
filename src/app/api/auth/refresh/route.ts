import { backendErrorResponse, parseAuthTokens, postBackend } from "@/lib/api/backend";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/lib/auth/session";

// O refresh_token nunca sai do cookie httpOnly — o client-side não tem acesso a ele, então
// esta rota não espera nada no body, só lê o cookie da própria requisição.
export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearSessionCookies();
    return Response.json({ error: "NoSession", message: "No refresh token" }, { status: 401 });
  }

  try {
    const authResp = await postBackend("/auth/refresh", { refresh_token: refreshToken });
    const tokens = parseAuthTokens(authResp);
    await setSessionCookies(tokens);
    return Response.json({ ok: true });
  } catch (err) {
    await clearSessionCookies();
    return backendErrorResponse(err);
  }
}
