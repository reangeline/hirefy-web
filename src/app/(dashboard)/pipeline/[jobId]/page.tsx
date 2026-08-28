"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobActionsCard } from "@/components/pipeline/JobActionsCard";
import { JobAtsMatchTab } from "@/components/pipeline/JobAtsMatchTab";
import { JobCoachTab } from "@/components/pipeline/JobCoachTab";
import { JobContactsTab } from "@/components/pipeline/JobContactsTab";
import { JobInterviewTab } from "@/components/pipeline/JobInterviewTab";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { STAGE_LABELS, type PipelineJob } from "@/types/pipeline";

export default function PipelineJobDetailPage({ params }: PageProps<"/pipeline/[jobId]">) {
  const { jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetchJson<PipelineJob>(`/api/pipeline/${jobId}`)
      .then(setJob)
      .catch((err: Error) => setError(err.message));
  }, [jobId]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetchJson(`/api/pipeline/${jobId}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a vaga.");
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar title={job?.company_name ?? "Vaga"} />
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

        {!job && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {job && (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold">{job.company_name}</h1>
                <p className="text-sm text-muted-foreground">{job.job_title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{STAGE_LABELS[job.stage]}</Badge>
                  {job.ats_score != null && (
                    <Badge variant={job.ats_score >= 70 ? "default" : "secondary"} className="font-mono">
                      {job.ats_score}% ATS
                    </Badge>
                  )}
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Excluir vaga" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4 text-destructive" aria-hidden="true" />}
              </Button>
            </div>

            <JobActionsCard job={job} onUpdated={setJob} />

            <Tabs defaultValue="coach">
              <TabsList>
                <TabsTrigger value="coach">Coach</TabsTrigger>
                <TabsTrigger value="interview">Entrevista</TabsTrigger>
                <TabsTrigger value="ats">ATS Match</TabsTrigger>
                <TabsTrigger value="contacts">Contatos</TabsTrigger>
              </TabsList>
              <TabsContent value="coach">
                <JobCoachTab job={job} />
              </TabsContent>
              <TabsContent value="interview">
                <JobInterviewTab job={job} />
              </TabsContent>
              <TabsContent value="ats">
                <JobAtsMatchTab job={job} />
              </TabsContent>
              <TabsContent value="contacts">
                <JobContactsTab jobId={job.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}
