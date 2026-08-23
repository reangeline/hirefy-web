import { backendErrorResponse, postMultipartBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";

// Proxy pra POST /resumes/parse-pdf — rota pública no backend (registrada antes do grupo
// com AuthMiddleware em router.go), não precisa de sessão. A resposta não é persistida, é só
// um preview: score de ATS + dados extraídos. Ver .spec/002-resume-optimization/spec.md.
export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const incomingForm = await req.formData();
  const file = incomingForm.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "InvalidRequest", message: "Arquivo obrigatório" }, { status: 400 });
  }

  const forwardForm = new FormData();
  forwardForm.set("file", file, file.name);

  try {
    const result = await postMultipartBackend("/resumes/parse-pdf", forwardForm);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
