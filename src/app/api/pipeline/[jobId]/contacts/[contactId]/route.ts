import { authedDeleteBackend, backendErrorResponse } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";

// Proxy pra DELETE /pipeline/{jobId}/contacts/{contactId} — backend responde 200 com
// {success: true} (não 204 como as outras rotas de delete), então repassamos o body.
export async function DELETE(
  req: Request,
  { params }: RouteContext<"/api/pipeline/[jobId]/contacts/[contactId]">,
) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId, contactId } = await params;

  try {
    const result = await authedDeleteBackend(
      `/pipeline/${jobId}/contacts/${contactId}`,
      accessToken,
    );
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
