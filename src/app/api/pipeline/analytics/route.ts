import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra GET /pipeline/analytics — métricas já vêm agregadas do backend, sem lógica de
// cálculo no client.
export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const analytics = await authedGetBackend("/pipeline/analytics", accessToken);
    return Response.json(analytics);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
