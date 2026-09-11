import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

interface SuggestAdditionRequest {
  gap: string;
  job_title?: string;
  company_name?: string;
  job_description?: string;
}

export async function POST(req: Request, { params }: RouteContext<"/api/resumes/[id]/suggest-addition">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as SuggestAdditionRequest;

  try {
    const result = await authedPostBackend(`/resumes/${id}/suggest-addition`, accessToken, body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
