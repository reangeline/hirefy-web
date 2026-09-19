"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { useStageLabels } from "@/lib/hooks/usePipelineLabels";
import { PIPELINE_STAGES, type PipelineJob, type PipelineJobStage } from "@/types/pipeline";

// Adiciona a vaga direto, sem passar pela otimização de currículo — não gasta crédito.
// Replica o "pular otimização" do wizard mobile (add_job_bottom_sheet.dart), mas com dados
// reais desde o início (sem ats_score/keywords, já que não passou por otimização nenhuma).
export function AddJobQuickForm() {
  const t = useTranslations("Pipeline.addJobQuickForm");
  const stageLabels = useStageLabels();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<PipelineJobStage>("wishlist");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const job = await apiFetchJson<PipelineJob>("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          job_title: jobTitle,
          location: location || undefined,
          stage,
        }),
      });
      trackEvent("pipeline_job_added", { method: "quick" });
      router.push(`/pipeline/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("addError"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{t("companyLabel")}</Label>
          <Input
            id="companyName"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">{t("jobTitleLabel")}</Label>
          <Input id="jobTitle" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("locationLabel")}</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("initialStageLabel")}</Label>
          <Select items={stageLabels} value={stage} onValueChange={(v) => setStage(v as PipelineJobStage)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {stageLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("adding") : t("addButton")}
        </Button>
      </div>
    </form>
  );
}
