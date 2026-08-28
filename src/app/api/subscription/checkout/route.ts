import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra POST /subscription/checkout — sem repassar body nenhum, o backend não aceita
// mais price_id do cliente (achado de segurança, spec 007). Retorna { checkout_url }.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const result = await authedPostBackend("/subscription/checkout", accessToken, {});
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
