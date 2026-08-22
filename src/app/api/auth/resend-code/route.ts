import { backendErrorResponse, postBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import type { ResendCodeRequest } from "@/types/api";

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const body = (await req.json()) as ResendCodeRequest;

  try {
    const result = await postBackend("/auth/resend-code", body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
