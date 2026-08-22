import { backendErrorResponse, postBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import type { ConfirmSignUpRequest } from "@/types/api";

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const body = (await req.json()) as ConfirmSignUpRequest;

  try {
    const result = await postBackend("/auth/confirm", body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
