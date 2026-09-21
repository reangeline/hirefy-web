"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, apiFetchJson } from "@/lib/api/client";
import type { CoachResponse, PipelineJob } from "@/types/pipeline";

interface JobCoachTabProps {
  job: PipelineJob;
}

// Coach não é gated por plano/Premium no backend — consome 1 crédito igual a otimização de
// currículo, disponível pro free tier com crédito. Único caso determinístico de bloqueio é o
// estágio "wishlist" (422 sempre) — escondemos a ação nesse caso em vez de deixar o usuário
// tentar e tomar erro. 402 (sem crédito) e 403 (assinatura inativa) só aparecem depois de
// tentar, tratados com mensagens distintas. Ver .spec/005-pipeline-candidaturas/spec.md.
//
// Conteúdo gerado fica salvo no backend (ver spec de cache de IA) — ao montar, checa se já
// existe uma sugestão pra esse (job, stage) via GET antes de mostrar a tela de "Gerar", pra
// não pedir pro usuário clicar de novo em algo que ele já pediu antes.
export function JobCoachTab({ job }: JobCoachTabProps) {
  const t = useTranslations("Pipeline.jobCoachTab");
  const [result, setResult] = useState<CoachResponse | null>(null);
  const [hasCheckedCache, setHasCheckedCache] = useState(() => job.stage === "wishlist");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (job.stage === "wishlist") return;

    let cancelled = false;
    apiFetchJson<CoachResponse>(`/api/pipeline/${job.id}/coach?stage=${encodeURIComponent(job.stage)}`)
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch(() => {
        // Nada salvo ainda pra esse (job, stage) — segue pra tela normal de "Gerar".
      })
      .finally(() => {
        if (!cancelled) setHasCheckedCache(true);
      });

    return () => {
      cancelled = true;
    };
  }, [job.id, job.stage]);

  if (job.stage === "wishlist") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("wishlistGate")}
        </CardContent>
      </Card>
    );
  }

  async function generateCoaching(force: boolean) {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    const daysSinceApplied = Math.max(
      0,
      Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86_400_000),
    );

    try {
      const res = await apiFetchJson<CoachResponse>(`/api/pipeline/${job.id}/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: job.stage,
          job_title: job.job_title,
          company_name: job.company_name,
          location: job.location,
          ats_score: job.ats_score,
          job_description: job.job_description,
          matched_keywords: job.matched_keywords,
          missing_keywords: job.missing_keywords,
          days_since_applied: daysSinceApplied,
          tone: "default",
          force,
        }),
      });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
      }
      setErrorMessage(err instanceof Error ? err.message : t("generateError"));
    } finally {
      setLoading(false);
    }
  }

  if (!hasCheckedCache) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t("checkingSaved")}
        </CardContent>
      </Card>
    );
  }

  if (errorStatus) {
    const title =
      errorStatus === 402
        ? t("creditsErrorTitle")
        : errorStatus === 403
          ? t("subscriptionErrorTitle")
          : t("genericErrorTitle");
    const description =
      errorStatus === 402
        ? t("creditsErrorDescription")
        : errorStatus === 403
          ? t("subscriptionErrorDescription")
          : errorMessage;

    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">{title}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button type="button" variant="outline" onClick={() => generateCoaching(true)} disabled={loading}>
            {t("tryAgainButton")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <p className="whitespace-pre-wrap text-sm">{result.content}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => generateCoaching(true)} disabled={loading}>
            {t("regenerateButton")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <Sparkles className="size-8 text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {t("intro")}
        </p>
        <Button type="button" onClick={() => generateCoaching(false)} disabled={loading} className="gap-2">
          <Sparkles className="size-4" aria-hidden="true" />
          {loading ? t("generating") : t("generateButton")}
        </Button>
      </CardContent>
    </Card>
  );
}
