import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

// Proxy simples pra GET /users/me — usado pra provar o loop de auth ponta a ponta (sessão +
// refresh automático em 401) antes da spec 002 trazer as rotas de currículo de verdade.
// Repassa o 401 do backend sem tentar refresh aqui: quem intercepta 401 é o
// lib/api/client.ts do lado do browser (mesmo padrão do mobile).
export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const me = await authedGetBackend("/users/me", accessToken);
    return Response.json(me);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
