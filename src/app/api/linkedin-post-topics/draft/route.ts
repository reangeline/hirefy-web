import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface DraftPostRequest {
  resume_id: string;
  title: string;
  angle: string;
}

// Proxy pra POST /linkedin-post-topics/draft — rascunha um post pro tema escolhido, não
// persiste nada (spec 018).
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as DraftPostRequest;

  try {
    const result = await authedPostBackend("/linkedin-post-topics/draft", accessToken, body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
