import { authedGetBackend, authedPostMultipartBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra POST /linkedin-scan (upload do PDF exportado do LinkedIn, autenticado) e
// GET /linkedin-scan (último scan salvo do usuário) — spec 015.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const incomingForm = await req.formData();
  const file = incomingForm.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "InvalidRequest", message: "Arquivo obrigatório" }, { status: 400 });
  }

  const forwardForm = new FormData();
  forwardForm.set("file", file, file.name);
  const targetRole = incomingForm.get("target_role");
  if (typeof targetRole === "string" && targetRole.trim()) {
    forwardForm.set("target_role", targetRole);
  }

  try {
    const result = await authedPostMultipartBackend("/linkedin-scan", accessToken, forwardForm);
    return Response.json(result);
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
    const scan = await authedGetBackend("/linkedin-scan", accessToken);
    return Response.json(scan);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
