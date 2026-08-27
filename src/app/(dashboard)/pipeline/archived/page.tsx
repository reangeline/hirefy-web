"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { STAGE_LABELS, type PipelineJob } from "@/types/pipeline";

export default function ArchivedPipelineJobsPage() {
  const [jobs, setJobs] = useState<PipelineJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<PipelineJob[]>("/api/pipeline")
      .then((all) => setJobs(all.filter((j) => j.is_archived)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <Topbar title="Vagas arquivadas" />
      <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Pipeline
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!jobs && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {jobs && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma vaga arquivada.</p>
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
                  <span className="text-xs text-muted-foreground">{STAGE_LABELS[job.stage]}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
