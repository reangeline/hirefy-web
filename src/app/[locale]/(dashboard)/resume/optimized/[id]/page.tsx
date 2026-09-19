"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { OptimizedResultView } from "@/components/resume/OptimizedResultView";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import type { OptimizedResume } from "@/types/resume";

export default function OptimizedResumePage({ params }: PageProps<"/[locale]/resume/optimized/[id]">) {
  const t = useTranslations("Resume");
  const { id } = use(params);
  const [optimized, setOptimized] = useState<OptimizedResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<OptimizedResume>(`/api/resumes/optimized/${id}`)
      .then(setOptimized)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <>
      <Topbar title={t("page.optimized.topbarTitle")} />
      <div className="space-y-6 p-6">
        <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backToList")}
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!optimized && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {t("loading")}
          </p>
        )}
        {optimized && <OptimizedResultView optimized={optimized} />}
      </div>
    </>
  );
}
