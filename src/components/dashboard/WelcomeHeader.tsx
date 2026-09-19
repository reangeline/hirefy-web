"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetchJson } from "@/lib/api/client";
import { identify } from "@/lib/analytics";
import type { MeResponse } from "@/types/api";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";

export function WelcomeHeader() {
  const t = useTranslations("Dashboard.welcomeHeader");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<MeResponse>("/api/me")
      .then((data) => {
        setMe(data);
        identify(data.id);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {me ? t("greeting", { name: me.name.split(" ")[0] }) : t("greetingFallback")}
      </h1>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {t("loadError", { error })}
        </p>
      )}

      {me && !me.email_verified && <EmailVerificationBanner email={me.email} />}
    </div>
  );
}
