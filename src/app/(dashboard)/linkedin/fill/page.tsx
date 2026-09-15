"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import type { OptimizationJob, Resume } from "@/types/resume";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 45; // ~3min

export default function LinkedInFillPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [job, setJob] = useState<OptimizationJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    apiFetchJson<Resume[]>("/api/resumes")
      .then((list) => {
        setResumes(list);
        if (list.length > 0) setSelectedResumeId(list[0].id);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const timer = setTimeout(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        setError("A geração está demorando mais que o esperado. Tente de novo em instantes.");
        return;
      }
      try {
        const updated = await apiFetchJson<OptimizationJob>(`/api/resumes/optimize/jobs/${job.id}`);
        setJob(updated);
        if (updated.status === "completed" && updated.optimized_resume_id) {
          trackEvent("linkedin_fill_guide_completed");
          router.push(`/linkedin/fill/${updated.optimized_resume_id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao consultar o status da geração.");
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [job, router]);

  async function handleGenerate() {
    if (!selectedResumeId) return;
    setError(null);
    setSubmitting(true);
    trackEvent("linkedin_fill_guide_started");

    try {
      const created = await apiFetchJson<OptimizationJob>("/api/resumes/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: selectedResumeId }),
      });
      attemptsRef.current = 0;
      setJob(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o guia.");
    } finally {
      setSubmitting(false);
    }
  }

  const resumeOptions = Object.fromEntries(
    (resumes ?? []).map((r) => [r.id, r.parsed_data.nickname || "Currículo sem nome"]),
  );

  return (
    <>
      <Topbar title="LinkedIn" />
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">Guia de preenchimento</h1>
          <p className="text-sm text-muted-foreground">
            A IA gera o que colocar em cada campo do seu perfil do LinkedIn, com base num
            currículo já salvo — você revisa e copia pra lá.
          </p>
        </div>

        {job && job.status === "failed" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
              <div aria-live="polite">
                <p className="font-medium">A geração falhou</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {job.error ?? "Tente novamente em alguns instantes."}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setJob(null)}>
                Tentar de novo
              </Button>
            </CardContent>
          </Card>
        )}

        {job && job.status !== "failed" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
              <div aria-live="polite">
                <p className="font-medium">
                  {job.status === "queued" && "Na fila de processamento…"}
                  {job.status === "processing" && "A IA está montando seu guia…"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Isso leva menos de um minuto.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!job && resumes && resumes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">Você ainda não tem um currículo salvo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie um currículo primeiro pra gerar o guia a partir dele.
                </p>
              </div>
              <Link href="/resume/new">
                <Button type="button">Criar currículo</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!job && resumes && resumes.length > 0 && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-1.5">
                <Label>Currículo base</Label>
                <Select items={resumeOptions} value={selectedResumeId} onValueChange={(v) => setSelectedResumeId(v ?? "")}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.parsed_data.nickname || "Currículo sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="button" disabled={submitting || !selectedResumeId} onClick={handleGenerate} className="gap-2">
                <Sparkles className="size-4" aria-hidden="true" />
                {submitting ? "Enviando…" : "Gerar guia"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!job && !resumes && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}
      </div>
    </>
  );
}
