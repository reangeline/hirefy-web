"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { CreditLimitReachedCard } from "@/components/resume/CreditLimitReachedCard";
import type { OptimizationJob } from "@/types/resume";

interface OptimizeFormProps {
  resumeId: string;
  resumeName: string;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 45; // ~3min

export function OptimizeForm({ resumeId, resumeName }: OptimizeFormProps) {
  const t = useTranslations("Resume");
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [job, setJob] = useState<OptimizationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const timer = setTimeout(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        setError(t("optimizeForm.pollTimeoutError"));
        return;
      }
      try {
        const updated = await apiFetchJson<OptimizationJob>(
          `/api/resumes/optimize/jobs/${job.id}`,
        );
        setJob(updated);
        if (updated.status === "completed" && updated.optimized_resume_id) {
          trackEvent("resume_optimize_completed");
          router.push(`/resume/optimized/${updated.optimized_resume_id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("optimizeForm.pollError"));
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [job, router, t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const created = await apiFetchJson<OptimizationJob>("/api/resumes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeId,
          job_description: jobDescription,
          target_company: targetCompany || undefined,
          target_role: targetRole || undefined,
        }),
      });
      attemptsRef.current = 0;
      setJob(created);
      trackEvent("resume_optimize_started");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("optimizeForm.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (job && job.status === "failed") {
    if (job.error === "subscription is not active") {
      return <CreditLimitReachedCard feature="resume_optimize" />;
    }
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
          <div aria-live="polite">
            <p className="font-medium">{t("optimizeForm.failedTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.error ?? t("optimizeForm.failedFallback")}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setJob(null)}>
            {t("optimizeForm.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (job) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
          <div aria-live="polite">
            <p className="font-medium">
              {job.status === "queued" && t("optimizeForm.statusQueued")}
              {job.status === "processing" && t("optimizeForm.statusProcessing")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("optimizeForm.processingHint")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("optimizeForm.optimizingPrefix")} <span className="font-medium text-foreground">{resumeName}</span>
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">{t("optimizeForm.jobDescriptionLabel")}</Label>
        <Textarea
          id="jobDescription"
          name="jobDescription"
          required
          rows={8}
          placeholder={t("optimizeForm.jobDescriptionPlaceholder")}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="targetCompany">{t("optimizeForm.targetCompanyLabel")}</Label>
          <Input
            id="targetCompany"
            name="targetCompany"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetRole">{t("optimizeForm.targetRoleLabel")}</Label>
          <Input
            id="targetRole"
            name="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="gap-2">
          <Sparkles className="size-4" aria-hidden="true" />
          {submitting ? t("optimizeForm.submitting") : t("optimizeForm.submit")}
        </Button>
      </div>
    </form>
  );
}
