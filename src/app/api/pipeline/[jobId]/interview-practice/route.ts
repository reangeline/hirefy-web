import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra GET /pipeline/{jobId}/interview-practice — histórico de perguntas de prática de
// entrevista (respondidas ou não) dessa vaga.
export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/interview-practice">,
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const history = await authedGetBackend(`/pipeline/${jobId}/interview-practice`, accessToken);
    return Response.json(history);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
