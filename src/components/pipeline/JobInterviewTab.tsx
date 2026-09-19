"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { useInterviewKindLabels } from "@/lib/hooks/usePipelineLabels";
import {
  INTERVIEW_KINDS,
  type InterviewQuestion,
  type InterviewQuestionKind,
  type PipelineJob,
} from "@/types/pipeline";

interface JobInterviewTabProps {
  job: PipelineJob;
}

// Prática de entrevista (spec 010): gerar pergunta é grátis, só avaliar a resposta consome 1
// crédito no free tier — mesmo padrão de erro 402/403/422 do JobCoachTab.tsx.
export function JobInterviewTab({ job }: JobInterviewTabProps) {
  const t = useTranslations("Pipeline.jobInterviewTab");
  const interviewKindLabels = useInterviewKindLabels();
  const [history, setHistory] = useState<InterviewQuestion[] | null>(null);
  const [kind, setKind] = useState<InterviewQuestionKind>("behavioral");
  const [current, setCurrent] = useState<InterviewQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<InterviewQuestion[]>(`/api/pipeline/${job.id}/interview-practice`)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [job.id]);

  if (job.stage === "wishlist") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("wishlistGate")}
        </CardContent>
      </Card>
    );
  }

  async function generateQuestion() {
    setLoadingQuestion(true);
    setErrorStatus(null);
    setErrorMessage(null);
    setCurrent(null);
    setAnswerText("");

    try {
      const question = await apiFetchJson<InterviewQuestion>(
        `/api/pipeline/${job.id}/interview-practice/question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        },
      );
      setCurrent(question);
      trackEvent("interview_question_generated", { kind });
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMessage(err instanceof Error ? err.message : t("generateQuestionError"));
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function submitAnswer() {
    if (!current || !answerText.trim()) return;
    setLoadingAnswer(true);
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      const evaluated = await apiFetchJson<InterviewQuestion>(
        `/api/pipeline/${job.id}/interview-practice/${current.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answerText }),
        },
      );
      setCurrent(evaluated);
      setHistory((prev) => [evaluated, ...(prev ?? [])]);
      trackEvent("interview_answer_submitted", { kind: evaluated.kind, content_score: evaluated.content_score });
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMessage(err instanceof Error ? err.message : t("submitAnswerError"));
    } finally {
      setLoadingAnswer(false);
    }
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorStatus(null);
              setErrorMessage(null);
            }}
          >
            {t("backButton")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 py-6">
          {!current && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Sparkles className="size-8 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {t("intro")}
              </p>
              {job.missing_keywords && job.missing_keywords.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("gapsHint")}
                </p>
              )}
              <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
                <Select
                  items={interviewKindLabels}
                  value={kind}
                  onValueChange={(value) => setKind(value as InterviewQuestionKind)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {interviewKindLabels[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={generateQuestion} disabled={loadingQuestion} className="gap-2">
                  <Sparkles className="size-4" aria-hidden="true" />
                  {loadingQuestion ? t("generating") : t("newQuestionButton")}
                </Button>
              </div>
            </div>
          )}

          {current && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{interviewKindLabels[current.kind]}</Badge>
              </div>
              <p className="text-sm font-medium">{current.question}</p>
              {current.method_hint && (
                <p className="text-xs text-muted-foreground">💡 {current.method_hint}</p>
              )}

              {!current.answered ? (
                <div className="space-y-2">
                  <Textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={6}
                    placeholder={t("answerPlaceholder")}
                  />
                  <Button
                    type="button"
                    onClick={submitAnswer}
                    disabled={loadingAnswer || !answerText.trim()}
                    className="w-full sm:w-auto"
                  >
                    {loadingAnswer ? t("evaluating") : t("submitAnswerButton")}
                  </Button>
                </div>
              ) : (
                <InterviewEvaluation question={current} />
              )}

              {current.answered && (
                <Button type="button" variant="outline" size="sm" onClick={generateQuestion} disabled={loadingQuestion}>
                  {loadingQuestion ? t("generating") : t("nextQuestionButton")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history && history.filter((h) => h.answered && h.id !== current?.id).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("historyHeading")}</p>
          {history
            .filter((h) => h.answered && h.id !== current?.id)
            .map((h) => (
              <Card key={h.id} size="sm">
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10.5px]">
                      {interviewKindLabels[h.kind]}
                    </Badge>
                    {h.content_score != null && (
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {h.content_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px]">{h.question}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function InterviewEvaluation({ question }: { question: InterviewQuestion }) {
  const t = useTranslations("Pipeline.jobInterviewTab");
  const hasStar =
    question.kind === "behavioral" &&
    (question.star_situation != null ||
      question.star_task != null ||
      question.star_action != null ||
      question.star_result != null);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("evaluationHeading")}</p>
        {question.content_score != null && (
          <Badge variant={question.content_score >= 70 ? "default" : "secondary"} className="font-mono">
            {question.content_score}/100
          </Badge>
        )}
      </div>

      {hasStar && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreBar label={t("starSituation")} value={question.star_situation ?? 0} />
          <ScoreBar label={t("starTask")} value={question.star_task ?? 0} />
          <ScoreBar label={t("starAction")} value={question.star_action ?? 0} />
          <ScoreBar label={t("starResult")} value={question.star_result ?? 0} />
        </div>
      )}

      {question.strengths && question.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t("strengthsHeading")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {question.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {question.gaps && question.gaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t("gapsHeading")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {question.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {question.model_answer && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t("modelAnswerHeading")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{question.model_answer}</p>
        </div>
      )}

      {question.follow_up && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t("followUpHeading")}</p>
          <p className="mt-1 text-sm italic text-muted-foreground">{question.follow_up}</p>
        </div>
      )}
    </div>
  );
}
