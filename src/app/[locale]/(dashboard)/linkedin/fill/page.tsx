"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { CreditLimitReachedCard } from "@/components/resume/CreditLimitReachedCard";
import type { OptimizationJob, Resume } from "@/types/resume";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 45; // ~3min

// Shape crua de GET /resumes/optimized — só os campos usados pra listar guias já gerados
// (ver mesmo shape em linkedin/fill/[id]/page.tsx, que lê um único item).
interface OptimizedResumeRaw {
  id: string;
  created_at: string;
  parsed_data?: { type?: string; headline?: string };
}

export default function LinkedInFillPage() {
  const t = useTranslations("LinkedIn");
  const locale = useLocale();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [job, setJob] = useState<OptimizationJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastGuides, setPastGuides] = useState<OptimizedResumeRaw[]>([]);
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
    apiFetchJson<OptimizedResumeRaw[]>("/api/resumes/optimized")
      .then((list) => {
        const guides = list
          .filter((item) => item.parsed_data?.type === "linkedin")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPastGuides(guides);
      })
      .catch(() => {
        // Lista de guias antigos é só um atalho — se falhar, a tela de gerar um novo
        // continua funcionando normalmente.
      });
  }, []);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const timer = setTimeout(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        setError(t("fillPage.timeoutError"));
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
        setError(err instanceof Error ? err.message : t("fillPage.pollError"));
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [job, router, t]);

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
      setError(err instanceof Error ? err.message : t("fillPage.generateError"));
    } finally {
      setSubmitting(false);
    }
  }

  const resumeOptions = Object.fromEntries(
    (resumes ?? []).map((r) => [r.id, r.parsed_data.nickname || t("fillPage.unnamedResume")]),
  );

  return (
    <>
      <Topbar title="LinkedIn" />
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">{t("fillPage.heading")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("fillPage.subheading")}
          </p>
        </div>

        {job && job.status === "failed" && job.error === "subscription is not active" && (
          <CreditLimitReachedCard feature="linkedin_optimize" />
        )}

        {job && job.status === "failed" && job.error !== "subscription is not active" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
              <div aria-live="polite">
                <p className="font-medium">{t("fillPage.failedTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {job.error ?? t("fillPage.failedDefaultMessage")}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setJob(null)}>
                {t("fillPage.tryAgain")}
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
                  {job.status === "queued" && t("fillPage.queued")}
                  {job.status === "processing" && t("fillPage.processing")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t("fillPage.processingHint")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!job && pastGuides.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium">{t("fillPage.pastGuidesHeading")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {pastGuides.map((guide) => (
                <Link key={guide.id} href={`/linkedin/fill/${guide.id}`}>
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="space-y-1 py-4">
                      <p className="truncate font-medium">
                        {guide.parsed_data?.headline || t("fillPage.unnamedGuide")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(guide.created_at).toLocaleDateString(locale)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!job && resumes && resumes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">{t("fillPage.noResumesTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("fillPage.noResumesHint")}
                </p>
              </div>
              <Link href="/resume/new">
                <Button type="button">{t("fillPage.createResume")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!job && resumes && resumes.length > 0 && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-1.5">
                <Label>{t("fillPage.resumeLabel")}</Label>
                <Select items={resumeOptions} value={selectedResumeId} onValueChange={(v) => setSelectedResumeId(v ?? "")}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.parsed_data.nickname || t("fillPage.unnamedResume")}
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
                {submitting ? t("fillPage.submitting") : t("fillPage.generateGuide")}
              </Button>
            </CardContent>
          </Card>
        )}

        {!job && !resumes && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {t("fillPage.loading")}
          </p>
        )}
      </div>
    </>
  );
}
