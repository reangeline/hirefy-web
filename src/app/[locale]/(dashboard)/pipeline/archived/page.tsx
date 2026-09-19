"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { useStageLabels } from "@/lib/hooks/usePipelineLabels";
import type { PipelineJob } from "@/types/pipeline";

export default function ArchivedPipelineJobsPage() {
  const t = useTranslations("Pipeline.archivedJobsPage");
  const stageLabels = useStageLabels();
  const [jobs, setJobs] = useState<PipelineJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<PipelineJob[]>("/api/pipeline")
      .then((all) => setJobs(all.filter((j) => j.is_archived)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <Topbar title={t("topbarTitle")} />
      <div className="space-y-6 p-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backLink")}
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!jobs && !error && <p className="text-sm text-muted-foreground">{t("loading")}</p>}

        {jobs && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}

        <div className="space-y-2.5">
          {jobs?.map((job) => (
            <Link key={job.id} href={`/pipeline/${job.id}`}>
              <Card className="transition-colors hover:bg-muted">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{job.company_name}</p>
                    <p className="text-sm text-muted-foreground">{job.job_title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{stageLabels[job.stage]}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
