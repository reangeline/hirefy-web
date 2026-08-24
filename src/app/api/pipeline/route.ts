import { authedGetBackend, authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { CreatePipelineJobRequest } from "@/types/pipeline";

// Proxy pra GET /pipeline (lista de vagas) e POST /pipeline (criar vaga).
export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const jobs = await authedGetBackend("/pipeline", accessToken);
    return Response.json(jobs);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as CreatePipelineJobRequest;

  try {
    const job = await authedPostBackend("/pipeline", accessToken, body);
    return Response.json(job, { status: 201 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
