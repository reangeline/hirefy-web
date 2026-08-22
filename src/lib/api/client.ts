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

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string }).message ??
      (body as { message?: string; error?: string }).error ??
      `Erro ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}
