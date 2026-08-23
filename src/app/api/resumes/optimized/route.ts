import { authedGetBackend, backendErrorResponse } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/auth/session";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  try {
    const optimized = await authedGetBackend("/resumes/optimized", accessToken);
    return Response.json(optimized);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
