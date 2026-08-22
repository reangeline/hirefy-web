import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra GET /subscription. `credits` já vem embutido nessa resposta (ver
// internal/core/domain/subscription.go) — não precisamos de uma segunda chamada pra
// GET /subscription/credits só pra exibir o saldo no dashboard.
export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const subscription = await authedGetBackend("/subscription", accessToken);
    return Response.json(subscription);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
