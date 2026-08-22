import { backendErrorResponse, postBackend } from "@/lib/api/backend";
import type { ForgotPasswordRequest } from "@/types/api";

export async function POST(req: Request) {
  const body = (await req.json()) as ForgotPasswordRequest;

  try {
    const result = await postBackend("/auth/forgot-password", body);
    return Response.json(result);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
