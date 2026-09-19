"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { CreditLimitReachedCard } from "@/components/resume/CreditLimitReachedCard";
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
  const t = useTranslations("Pipeline.addJobWizard");
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
        setError(t("pollTimeout"));
        return;
      }
      try {
        const updated = await apiFetchJson<OptimizationJob>(`/api/resumes/optimize/jobs/${job.id}`);
        setJob(updated);
        if (updated.status === "completed" && updated.optimized_resume_id) {
          await createPipelineJob(updated.optimized_resume_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("pollError"));
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
      setError(err instanceof Error ? err.message : t("saveAfterOptimizeError"));
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
      setError(err instanceof Error ? err.message : t("startError"));
      setStep("resume");
    }
  }

  if (step === "details") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">{t("companyLabel")}</Label>
            <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">{t("jobTitleLabel")}</Label>
            <Input id="jobTitle" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("locationLabel")}</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobDescription">{t("jobDescriptionLabel")}</Label>
          <Textarea
            id="jobDescription"
            required
            rows={8}
            placeholder={t("jobDescriptionPlaceholder")}
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
            {t("continueButton")}
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
          {t("backButton")}
        </button>

        <p className="text-sm text-muted-foreground">{t("chooseResumePrompt")}</p>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!resumes && !error && <p className="text-sm text-muted-foreground">{t("loadingResumes")}</p>}

        {resumes && resumes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("noResumes")}
          </p>
        )}

        <div className="space-y-2">
          {resumes?.map((resume) => {
            const title = resume.parsed_data.nickname || resume.parsed_data.personal?.full_name || t("untitledResume");
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
            {t("optimizeAndAddButton")}
          </Button>
        </div>
      </div>
    );
  }

  // step === "optimizing"
  if (job && job.status === "failed") {
    if (job.error === "subscription is not active") {
      return <CreditLimitReachedCard feature="resume_optimize" />;
    }
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
          <div aria-live="polite">
            <p className="font-medium">{t("optimizationFailedTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.error ?? t("optimizationFailedFallback")}
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
            {t("tryAgainButton")}
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
            {t("trySaveAgainButton")}
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
            {t("backButton")}
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
              ? t("savingJob")
              : job?.status === "processing"
                ? t("optimizingResume")
                : t("queued")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("mayTakeAMinute")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
