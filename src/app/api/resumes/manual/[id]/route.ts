import { authedPutBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { ManualResumeRequest } from "@/types/resume";

export async function PUT(req: Request, { params }: RouteContext<"/api/resumes/manual/[id]">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as ManualResumeRequest;

  try {
    const resume = await authedPutBackend(`/resumes/manual/${id}`, accessToken, body);
    return Response.json(resume);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
