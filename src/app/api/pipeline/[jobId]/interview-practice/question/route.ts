import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { InterviewQuestionKind } from "@/types/pipeline";

interface NextQuestionRequest {
  kind?: InterviewQuestionKind;
}

// Proxy pra POST /pipeline/{jobId}/interview-practice/question — gera a próxima pergunta de
// prática. Grátis (não consome crédito) — só SubmitAnswer consome. Erros do backend (403
// assinatura inativa, 422 sem prática nesse estágio) passam via backendErrorResponse.
export async function POST(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/interview-practice/question">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as NextQuestionRequest;

  try {
    const question = await authedPostBackend(
      `/pipeline/${jobId}/interview-practice/question`,
      accessToken,
      body,
    );
    return Response.json(question, { status: 201 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
