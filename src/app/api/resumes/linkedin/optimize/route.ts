import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface LinkedInOptimizeRequest {
  resume_id: string;
}

// Proxy pra POST /resumes/linkedin/optimize — 202 Accepted, retorna o job em `queued`. O
// client faz polling em /api/resumes/optimize/jobs/{jobId}, igual a otimização de currículo
// pra vaga (spec 017 reusa a mesma rota de job, já genérica).
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as LinkedInOptimizeRequest;

  try {
    const job = await authedPostBackend("/resumes/linkedin/optimize", accessToken, body);
    return Response.json(job, { status: 202 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
