"use client";

// Wrapper fetch pro lado do browser. Chama sempre nossas próprias Route Handlers
// (nunca o backend Go direto — ver web-app/CLAUDE.md), e intercepta 401 pra disparar
// refresh automático com single-flight, replicando o `_tokenRefresher` do mobile:
// se várias chamadas tomam 401 ao mesmo tempo, só uma dispara o refresh; as demais
// aguardam essa mesma promise antes de reenviar a chamada original.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Fetch autenticado com refresh automático em 401. `path` é uma rota nossa (/api/...). */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (res.status !== 401) return res;

  const refreshed = await refreshSession();
  if (!refreshed) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return res;
  }

  return fetch(path, init);
}

// Erro de resposta não-ok com o status HTTP anexado — permite branches específicos (ex.:
// 402/403/422 do coach de IA) sem parsear a mensagem. Continua sendo um `Error` normal pra
// quem só faz `err instanceof Error` / `err.message`.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string }).message ??
      (body as { message?: string; error?: string }).error ??
      `Erro ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}
