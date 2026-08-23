import { authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { ManualResumeRequest } from "@/types/resume";

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const body = (await req.json()) as ManualResumeRequest;

  try {
    const resume = await authedPostBackend("/resumes/manual", accessToken, body);
    return Response.json(resume, { status: 201 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
