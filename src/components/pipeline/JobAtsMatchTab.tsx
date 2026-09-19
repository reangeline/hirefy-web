"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedResultView } from "@/components/resume/OptimizedResultView";
import { apiFetchJson } from "@/lib/api/client";
import type { OptimizedResume } from "@/types/resume";
import type { PipelineJob } from "@/types/pipeline";

export function JobAtsMatchTab({ job }: { job: PipelineJob }) {
  const t = useTranslations("Pipeline.atsMatchTab");
  const [optimized, setOptimized] = useState<OptimizedResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job.optimized_resume_id) return;
    apiFetchJson<OptimizedResume>(`/api/resumes/optimized/${job.optimized_resume_id}`)
      .then(setOptimized)
      .catch((err: Error) => setError(err.message));
  }, [job.optimized_resume_id]);

  if (!job.optimized_resume_id) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Sparkles className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("notOptimizedMessage")}</p>
          <Link href="/pipeline/new">
            <Button type="button" variant="outline">
              {t("optimizeButton")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <p role="alert" aria-live="polite" className="text-sm text-destructive">
        {t("loadError", { error })}
      </p>
    );
  }

  if (!optimized) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <OptimizedResultView
      optimized={optimized}
      matchedKeywords={job.matched_keywords}
      missingKeywords={job.missing_keywords}
      resumeId={job.resume_id}
      jobTitle={job.job_title}
      companyName={job.company_name}
      jobDescription={job.job_description}
    />
  );
}
