import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface DraftPostRequest {
  resume_id: string;
  title: string;
  angle: string;
  /** Índice do tema na lista de LinkedInPostIdeas já salva do usuário — usado só pra
   * persistir o rascunho gerado nesse tema, não afeta a geração em si. */
  index: number;
}

// Proxy pra POST /linkedin-post-topics/draft — rascunha um post pro tema escolhido. O
// backend persiste o resultado no tema correspondente (por índice) pra não regenerar à toa
// da próxima vez (ver spec de cache de IA).
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
