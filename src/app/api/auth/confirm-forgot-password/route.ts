import { backendErrorResponse, postBackend } from "@/lib/api/backend";
import type { ConfirmForgotPasswordRequest } from "@/types/api";

export async function POST(req: Request) {
  const body = (await req.json()) as ConfirmForgotPasswordRequest;

  try {
    const result = await postBackend("/auth/confirm-forgot-password", body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
