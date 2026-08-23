import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/resumes/optimize/jobs/[jobId]">,
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const job = await authedGetBackend(`/resumes/optimize/jobs/${jobId}`, accessToken);
    return Response.json(job);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
