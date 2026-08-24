import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { CoachRequest } from "@/types/pipeline";

// Proxy pra POST /pipeline/{jobId}/coach — consome 1 crédito do usuário free tier. Erros do
// backend (402 sem crédito, 403 assinatura inativa, 422 sem coach nesse estágio) passam
// direto via backendErrorResponse, sem tratamento especial aqui — o client trata pelo status.
export async function POST(req: Request, { params }: RouteContext<"/api/pipeline/[jobId]/coach">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as CoachRequest;

  try {
    const result = await authedPostBackend(`/pipeline/${jobId}/coach`, accessToken, body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
