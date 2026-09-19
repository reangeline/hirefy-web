"use client";

import { useTranslations } from "next-intl";
import type { PipelineJobStage, InterviewQuestionKind } from "@/types/pipeline";
import { PIPELINE_STAGES, INTERVIEW_KINDS } from "@/types/pipeline";

// STAGE_LABELS/INTERVIEW_KIND_LABELS viraram hooks (em vez de constantes de módulo) porque
// tradução depende de contexto de React (useTranslations) — spec 021.
export function useStageLabels(): Record<PipelineJobStage, string> {
  const t = useTranslations("Pipeline.stages");
  return Object.fromEntries(PIPELINE_STAGES.map((s) => [s, t(s)])) as Record<PipelineJobStage, string>;
}

export function useInterviewKindLabels(): Record<InterviewQuestionKind, string> {
  const t = useTranslations("Pipeline.interviewKinds");
  return Object.fromEntries(INTERVIEW_KINDS.map((k) => [k, t(k)])) as Record<InterviewQuestionKind, string>;
}
