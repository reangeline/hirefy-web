import { authedGetBackend, authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { CoachRequest } from "@/types/pipeline";

// Proxy pra GET /pipeline/{jobId}/coach?stage=X — só lê uma sugestão já gerada (204/404 se
// nunca gerou), nunca chama IA nem cobra crédito.
export async function GET(req: Request, { params }: RouteContext<"/api/pipeline/[jobId]/coach">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const stage = new URL(req.url).searchParams.get("stage") ?? "";

  try {
    const result = await authedGetBackend(`/pipeline/${jobId}/coach?stage=${encodeURIComponent(stage)}`, accessToken);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

// Proxy pra POST /pipeline/{jobId}/coach — consome 1 crédito do usuário free tier (a menos
// que já exista uma sugestão salva pra esse estágio, ou seja force: true regenerando). Erros
// do backend (402 sem crédito, 403 assinatura inativa, 422 sem coach nesse estágio) passam
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
