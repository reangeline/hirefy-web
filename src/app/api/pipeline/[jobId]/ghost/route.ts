import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra POST /pipeline/{jobId}/ghost — marca a flag is_ghosted, não muda o estágio.
export async function POST(req: Request, { params }: RouteContext<"/api/pipeline/[jobId]/ghost">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const job = await authedPostBackend(`/pipeline/${jobId}/ghost`, accessToken, {});
    return Response.json(job);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
