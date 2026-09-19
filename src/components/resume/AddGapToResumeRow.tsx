"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import type { ManualResumeRequest, Resume } from "@/types/resume";

interface AddGapToResumeRowProps {
  gap: string;
  resumeId: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}

type RowState = "idle" | "loading" | "editing" | "saving" | "done";

// Spec 014: cada gap (palavra-chave ou requisito faltando) ganha um botão que gera uma
// frase via IA pra incorporar no resumo profissional — o usuário revisa/edita antes de
// confirmar. Sem editor de rich-text/diff (decisão do usuário, escopo bem mais simples que
// a referência visual trazida).
export function AddGapToResumeRow({ gap, resumeId, jobTitle, companyName, jobDescription }: AddGapToResumeRowProps) {
  const t = useTranslations("Resume");
  const [state, setState] = useState<RowState>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setState("loading");
    setError(null);
    try {
      const res = await apiFetchJson<{ suggested_text: string }>(`/api/resumes/${resumeId}/suggest-addition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gap,
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
        }),
      });
      setText(res.suggested_text);
      setState("editing");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("addGap.suggestError"));
      setState("idle");
    }
  }

  async function handleConfirm() {
    setState("saving");
    setError(null);
    try {
      const resume = await apiFetchJson<Resume>(`/api/resumes/${resumeId}`);
      const parsed = resume.parsed_data;
      const currentSummary = parsed.personal?.summary?.trim();
      const newSummary = currentSummary ? `${currentSummary} ${text}` : text;

      // PUT /resumes/manual/{id} é replace, não patch — reenvia tudo que já existia, só
      // trocando personal.summary.
      const body: ManualResumeRequest = {
        nickname: parsed.nickname ?? "",
        personal: { ...parsed.personal, summary: newSummary },
        experiences: parsed.experiences ?? [],
        education: parsed.education ?? [],
        projects: parsed.projects ?? [],
        languages: parsed.languages ?? [],
        ats_score: parsed.ats_score,
        ats_improvements: parsed.ats_improvements,
      };

      await apiFetchJson(`/api/resumes/manual/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      trackEvent("resume_addition_applied");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("addGap.saveError"));
      setState("editing");
    }
  }

  if (state === "done") {
    return <p className="mt-1 text-xs text-success">{t("addGap.done")}</p>;
  }

  if (state === "editing" || state === "saving") {
    return (
      <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/30 p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={state === "saving"}
          className="text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" size="xs" onClick={handleConfirm} disabled={state === "saving" || !text.trim()}>
            {state === "saving" ? t("addGap.saving") : t("addGap.addToResume")}
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => setState("idle")} disabled={state === "saving"}>
            {t("addGap.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0.5">
      <Button type="button" variant="link" size="xs" className="h-auto gap-1 p-0" onClick={handleSuggest} disabled={state === "loading"}>
        <Plus className="size-3" aria-hidden="true" />
        {state === "loading" ? t("addGap.generating") : t("addGap.addToResume")}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
