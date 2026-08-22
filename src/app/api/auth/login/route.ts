import { backendErrorResponse, parseAuthTokens, postBackend } from "@/lib/api/backend";
import { requireSameOrigin } from "@/lib/auth/csrf";
import { setSessionCookies } from "@/lib/auth/session";
import type { SignInRequest } from "@/types/api";

export async function POST(req: Request) {
  const csrfError = requireSameOrigin(req);
  if (csrfError) return csrfError;

  const body = (await req.json()) as SignInRequest;

  try {
    const authResp = await postBackend("/auth/signin", body);
    const tokens = parseAuthTokens(authResp);
    await setSessionCookies(tokens);
    return Response.json({ ok: true });
  } catch (err) {
    return backendErrorResponse(err);
  }
}
