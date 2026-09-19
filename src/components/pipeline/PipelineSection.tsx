"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { PipelineAnalyticsView } from "@/components/pipeline/PipelineAnalyticsView";
import { apiFetchJson } from "@/lib/api/client";
import type { PipelineAnalytics, PipelineJob, PipelineJobStage } from "@/types/pipeline";

export function PipelineSection() {
  const t = useTranslations("Pipeline.pipelineSection");
  const [jobs, setJobs] = useState<PipelineJob[] | null>(null);
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<PipelineJob[]>("/api/pipeline")
      .then(setJobs)
      .catch((err: Error) => setError(err.message));
    apiFetchJson<PipelineAnalytics>("/api/pipeline/analytics")
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleStageChange(jobId: string, stage: PipelineJobStage) {
    const previous = jobs;
    setJobs((current) => current?.map((j) => (j.id === jobId ? { ...j, stage } : j)) ?? current);
    try {
      const updated = await apiFetchJson<PipelineJob>(`/api/pipeline/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      setJobs((current) => current?.map((j) => (j.id === jobId ? updated : j)) ?? current);
    } catch {
      setJobs(previous);
    }
  }

  const archivedCount = jobs?.filter((j) => j.is_archived).length ?? 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13.5px] font-semibold">{t("heading")}</p>
          <div className="flex items-center gap-2">
            {archivedCount > 0 && (
              <Link
                href="/pipeline/archived"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Archive className="size-3.5" aria-hidden="true" />
                {t("archivedCount", { count: archivedCount })}
              </Link>
            )}
            <Link href="/pipeline/new">
              <Button type="button" size="sm" className="gap-1.5">
                <Plus className="size-4" aria-hidden="true" />
                {t("addJobButton")}
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {t("loadError", { error })}
          </p>
        )}

        {!error && (!jobs || !analytics) && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {t("loading")}
          </p>
        )}

        {jobs && analytics && (
          <Tabs defaultValue="board">
            <TabsList>
              <TabsTrigger value="board">{t("boardTab")}</TabsTrigger>
              <TabsTrigger value="analytics">{t("analyticsTab")}</TabsTrigger>
            </TabsList>
            <TabsContent value="board">
              {jobs.filter((j) => !j.is_archived).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("emptyBoard")}
                </p>
              ) : (
                <PipelineBoard jobs={jobs} onStageChange={handleStageChange} />
              )}
            </TabsContent>
            <TabsContent value="analytics">
              <PipelineAnalyticsView analytics={analytics} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
