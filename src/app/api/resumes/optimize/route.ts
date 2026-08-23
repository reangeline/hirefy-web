import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface OptimizeResumeRequest {
  resume_id: string;
  job_description: string;
  target_company?: string;
  target_role?: string;
}

// Proxy pra POST /resumes/optimize — 202 Accepted, retorna o job em `queued` (não o
// resultado). O client faz polling em /api/resumes/optimize/jobs/{jobId}.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as OptimizeResumeRequest;

  try {
    const job = await authedPostBackend("/resumes/optimize", accessToken, body);
    return Response.json(job, { status: 202 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
