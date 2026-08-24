import { authedGetBackend, authedPostBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { CreateContactRequest } from "@/types/pipeline";

export async function GET(_req: Request, { params }: RouteContext<"/api/pipeline/[jobId]/contacts">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const contacts = await authedGetBackend(`/pipeline/${jobId}/contacts`, accessToken);
    return Response.json(contacts);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/contacts">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as CreateContactRequest;

  try {
    const contact = await authedPostBackend(`/pipeline/${jobId}/contacts`, accessToken, body);
    return Response.json(contact, { status: 201 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
