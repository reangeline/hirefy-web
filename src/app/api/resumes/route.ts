import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra GET /resumes (lista de currículos originais, não otimizados).
export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const resumes = await authedGetBackend("/resumes", accessToken);
    return Response.json(resumes);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
