import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: RouteContext<"/api/resumes/optimized/[id]">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const optimized = await authedGetBackend(`/resumes/optimized/${id}`, accessToken);
    return Response.json(optimized);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
