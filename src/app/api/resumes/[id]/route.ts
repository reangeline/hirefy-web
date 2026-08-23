import { authedDeleteBackend, authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: RouteContext<"/api/resumes/[id]">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const resume = await authedGetBackend(`/resumes/${id}`, accessToken);
    return Response.json(resume);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: RouteContext<"/api/resumes/[id]">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await authedDeleteBackend(`/resumes/${id}`, accessToken);
    return new Response(null, { status: 204 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
