import type { AuthTokens, BackendErrorBody, RawAuthResponse } from "@/types/api";

// Uso exclusivo de Route Handlers — nunca importar isto de um Client Component.
// `API_BASE_URL` não tem prefixo NEXT_PUBLIC_ de propósito: o browser nunca fala com o
// backend Go diretamente, então essa URL não precisa (e não deve) ir pro bundle do client.

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL não configurada (.env.local)");
}

export class BackendError extends Error {
  status: number;
  body: BackendErrorBody;

  constructor(status: number, body: BackendErrorBody) {
    super(body.message ?? body.error ?? `Backend respondeu ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Chamada crua ao backend Go — uso exclusivo de Route Handlers (nunca do client). */
async function callBackend(path: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new BackendError(res.status, body as BackendErrorBody);
  }

  return body;
}

export function postBackend(path: string, body: unknown): Promise<unknown> {
  return callBackend(path, { method: "POST", body: JSON.stringify(body) });
}

function authedCallBackend(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<unknown> {
  return callBackend(path, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
}

export function authedGetBackend(path: string, accessToken: string): Promise<unknown> {
  return authedCallBackend(path, accessToken, { method: "GET" });
}

export function authedPostBackend(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<unknown> {
  return authedCallBackend(path, accessToken, { method: "POST", body: JSON.stringify(body) });
}

export function authedPutBackend(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<unknown> {
  return authedCallBackend(path, accessToken, { method: "PUT", body: JSON.stringify(body) });
}

export function authedDeleteBackend(path: string, accessToken: string): Promise<unknown> {
  return authedCallBackend(path, accessToken, { method: "DELETE" });
}

/** Converte um erro de `callBackend` na mesma resposta (status + body) que o backend deu. */
export function backendErrorResponse(err: unknown): Response {
  if (err instanceof BackendError) {
    return Response.json(err.body, { status: err.status });
  }
  return Response.json(
    { error: "InternalError", message: "Erro inesperado" },
    { status: 500 },
  );
}

/**
 * Aceita PascalCase e snake_case nas chaves de token — o backend já emite só snake_case hoje,
 * mas mantemos o parser duplo até validar isso no ambiente de dev (ver .spec/001-auth/spec.md).
 */
export function parseAuthTokens(raw: unknown): AuthTokens {
  const r = raw as RawAuthResponse;
  const accessToken = r.access_token ?? r.AccessToken;
  const idToken = r.id_token ?? r.IDToken;
  const refreshToken = r.refresh_token ?? r.RefreshToken;

  if (!accessToken || !idToken || !refreshToken) {
    throw new Error("Resposta de auth do backend não trouxe os três tokens esperados");
  }

  return {
    accessToken,
    idToken,
    refreshToken,
    expiresIn: r.expires_in ?? r.ExpiresIn,
  };
}
