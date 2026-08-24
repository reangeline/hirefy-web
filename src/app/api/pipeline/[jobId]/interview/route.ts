import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { LogInterviewRequest } from "@/types/pipeline";

// Proxy pra POST /pipeline/{jobId}/interview — registra entrevista e move a vaga pro
// estágio "interview".
export async function POST(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/interview">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as LogInterviewRequest;

  try {
    const job = await authedPostBackend(`/pipeline/${jobId}/interview`, accessToken, body);
    return Response.json(job);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
