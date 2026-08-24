import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { LogFollowUpRequest } from "@/types/pipeline";

// Proxy pra POST /pipeline/{jobId}/followup — só registra o evento na timeline (backend só
// aceita `detail`, ver types/pipeline.ts).
export async function POST(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/followup">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as LogFollowUpRequest;

  try {
    await authedPostBackend(`/pipeline/${jobId}/followup`, accessToken, body);
    return new Response(null, { status: 204 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
