import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface SubmitAnswerRequest {
  answer: string;
}

// Proxy pra POST /pipeline/{jobId}/interview-practice/{questionId}/answer — avalia a
// resposta do usuário (consome 1 crédito no free tier). Erros do backend (402 sem crédito,
// 403 assinatura inativa) passam via backendErrorResponse.
export async function POST(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/interview-practice/[questionId]/answer">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId, questionId } = await params;
  const body = (await req.json()) as SubmitAnswerRequest;

  try {
    const result = await authedPostBackend(
      `/pipeline/${jobId}/interview-practice/${questionId}/answer`,
      accessToken,
      body,
    );
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
