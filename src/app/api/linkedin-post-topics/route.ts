import { authedGetBackend, authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface GenerateTopicsRequest {
  resume_id: string;
  target_role?: string;
}

// Proxy pra POST /linkedin-post-topics (gera e substitui os temas salvos) e
// GET /linkedin-post-topics (último conjunto salvo) — spec 018.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as GenerateTopicsRequest;

  try {
    const ideas = await authedPostBackend("/linkedin-post-topics", accessToken, body);
    return Response.json(ideas);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const ideas = await authedGetBackend("/linkedin-post-topics", accessToken);
    return Response.json(ideas);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
