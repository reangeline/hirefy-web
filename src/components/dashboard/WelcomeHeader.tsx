"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api/client";
import type { MeResponse } from "@/types/api";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";

export function WelcomeHeader() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<MeResponse>("/api/me")
      .then(setMe)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {me ? `Bem-vindo(a), ${me.name.split(" ")[0]}` : "Bem-vindo(a)"}
      </h1>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          Falha ao carregar perfil: {error}
        </p>
      )}

      {me && !me.email_verified && <EmailVerificationBanner email={me.email} />}
    </div>
  );
}
