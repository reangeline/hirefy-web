import {
  authedDeleteBackend,
  authedGetBackend,
  authedPutBackend,
  backendErrorResponse,
} from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { getAccessToken } from "@/lib/auth/session";
import type { UpdatePipelineJobRequest } from "@/types/pipeline";

export async function GET(_req: Request, { params }: RouteContext<"/api/pipeline/[jobId]">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const job = await authedGetBackend(`/pipeline/${jobId}`, accessToken);
    return Response.json(job);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function PUT(req: Request, { params }: RouteContext<"/api/pipeline/[jobId]">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = (await req.json()) as UpdatePipelineJobRequest;

  try {
    const job = await authedPutBackend(`/pipeline/${jobId}`, accessToken, body);
    return Response.json(job);
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: RouteContext<"/api/pipeline/[jobId]">) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return Response.json({ error: "NoSession", message: "No session" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    await authedDeleteBackend(`/pipeline/${jobId}`, accessToken);
    return new Response(null, { status: 204 });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
