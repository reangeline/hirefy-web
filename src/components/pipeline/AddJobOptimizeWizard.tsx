"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import type { OptimizationJob, OptimizedResume, Resume } from "@/types/resume";
import type { PipelineJob } from "@/types/pipeline";

type Step = "details" | "resume" | "optimizing";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 45; // ~3min

// Fluxo completo: dados da vaga -> escolher currículo -> otimizar de verdade (gasta 1
// crédito) -> cria a vaga no pipeline já com o resultado real da IA (ats_score = match_score,
// missing_keywords = missing_requirements). Não reaproveita o OptimizeForm porque o
// comportamento pós-conclusão é diferente (aqui cria a vaga, lá navega pro resultado).
export function AddJobOptimizeWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const [job, setJob] = useState<OptimizationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (step !== "resume" || resumes) return;
    apiFetchJson<Resume[]>("/api/resumes")
      .then(setResumes)
      .catch((err: Error) => setError(err.message));
  }, [step, resumes]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const timer = setTimeout(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        setError("A otimização está demorando mais que o esperado. Tente de novo em instantes.");
        return;
      }
      try {
        const updated = await apiFetchJson<OptimizationJob>(`/api/resumes/optimize/jobs/${job.id}`);
        setJob(updated);
        if (updated.status === "completed" && updated.optimized_resume_id) {
          await createPipelineJob(updated.optimized_resume_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao consultar o status da otimização.");
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  async function createPipelineJob(optimizedResumeId: string) {
    setCreatingJob(true);
    try {
      const optimized = await apiFetchJson<OptimizedResume>(`/api/resumes/optimized/${optimizedResumeId}`);
      const created = await apiFetchJson<PipelineJob>("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          job_title: jobTitle,
          location: location || undefined,
          job_description: jobDescription,
          stage: "applied",
          resume_id: selectedResumeId,
          optimized_resume_id: optimizedResumeId,
          ats_score: Math.round(optimized.match_score),
          missing_keywords: optimized.missing_requirements,
        }),
      });
      trackEvent("pipeline_job_added", { method: "optimize" });
      router.push(`/pipeline/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Currículo otimizado, mas não foi possível salvar a vaga.");
      setCreatingJob(false);
    }
  }

  async function startOptimization() {
    if (!selectedResumeId) return;
    setStep("optimizing");
    setError(null);
    try {
      const created = await apiFetchJson<OptimizationJob>("/api/resumes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_description: jobDescription,
          target_company: companyName || undefined,
          target_role: jobTitle || undefined,
        }),
      });
      attemptsRef.current = 0;
      setJob(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a otimização.");
      setStep("resume");
    }
  }

  if (step === "details") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Empresa</Label>
            <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Cargo</Label>
            <Input id="jobTitle" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Localização (opcional)</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobDescription">Descrição da vaga</Label>
          <Textarea
            id="jobDescription"
            required
            rows={8}
            placeholder="Cole aqui a descrição completa da vaga…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!companyName || !jobTitle || !jobDescription}
            onClick={() => setStep("resume")}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (step === "resume") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStep("details")}
          className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar
        </button>

        <p className="text-sm text-muted-foreground">Qual currículo usar de base?</p>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!resumes && !error && <p className="text-sm text-muted-foreground">Carregando currículos…</p>}

        {resumes && resumes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem nenhum currículo. Crie um em “Meus currículos” antes de otimizar.
          </p>
        )}

        <div className="space-y-2">
          {resumes?.map((resume) => {
            const title = resume.parsed_data.nickname || resume.parsed_data.personal?.full_name || "Currículo sem nome";
            const selected = selectedResumeId === resume.id;
            return (
              <button
                type="button"
                key={resume.id}
                onClick={() => setSelectedResumeId(resume.id)}
                className="block w-full cursor-pointer text-left"
              >
                <Card className={selected ? "border-primary" : undefined}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium">{title}</span>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button type="button" disabled={!selectedResumeId} onClick={startOptimization} className="gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            Otimizar e adicionar
          </Button>
        </div>
      </div>
    );
  }

  // step === "optimizing"
  if (job && job.status === "failed") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
          <div aria-live="polite">
            <p className="font-medium">A otimização falhou</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.error ?? "Tente novamente em alguns instantes."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setJob(null);
              setStep("resume");
            }}
          >
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (job?.status === "completed" && error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => job.optimized_resume_id && createPipelineJob(job.optimized_resume_id)}
          >
            Tentar salvar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error && !job) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
          <Button type="button" variant="outline" onClick={() => setStep("resume")}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        <div aria-live="polite">
          <p className="font-medium">
            {creatingJob
              ? "Salvando vaga no pipeline…"
              : job?.status === "processing"
                ? "A IA está otimizando seu currículo…"
                : "Na fila de processamento…"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Isso pode levar até um minuto.</p>
        </div>
      </CardContent>
    </Card>
  );
}
