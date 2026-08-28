"use client";

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
import {
  INTERVIEW_KIND_LABELS,
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
          A prática de entrevista fica disponível depois que a vaga sai da Wishlist.
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
      setErrorMessage(err instanceof Error ? err.message : "Não foi possível gerar a pergunta.");
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
      setErrorMessage(err instanceof Error ? err.message : "Não foi possível avaliar a resposta.");
    } finally {
      setLoadingAnswer(false);
    }
  }

  if (errorStatus) {
    const title =
      errorStatus === 402
        ? "Você não tem créditos suficientes"
        : errorStatus === 403
          ? "Assinatura indisponível"
          : "Não foi possível continuar";
    const description =
      errorStatus === 402
        ? "Faça upgrade ou compre mais créditos pra avaliar sua resposta."
        : errorStatus === 403
          ? "Sua assinatura precisa estar ativa pra praticar entrevista."
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
            Voltar
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
                Pratique perguntas de entrevista pra esta vaga, com avaliação da IA baseada no
                seu currículo real.
              </p>
              <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
                <Select
                  items={INTERVIEW_KIND_LABELS}
                  value={kind}
                  onValueChange={(value) => setKind(value as InterviewQuestionKind)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {INTERVIEW_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={generateQuestion} disabled={loadingQuestion} className="gap-2">
                  <Sparkles className="size-4" aria-hidden="true" />
                  {loadingQuestion ? "Gerando…" : "Nova pergunta"}
                </Button>
              </div>
            </div>
          )}

          {current && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{INTERVIEW_KIND_LABELS[current.kind]}</Badge>
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
                    placeholder="Responda como você responderia numa entrevista de verdade…"
                  />
                  <Button
                    type="button"
                    onClick={submitAnswer}
                    disabled={loadingAnswer || !answerText.trim()}
                    className="w-full sm:w-auto"
                  >
                    {loadingAnswer ? "Avaliando…" : "Enviar resposta"}
                  </Button>
                </div>
              ) : (
                <InterviewEvaluation question={current} />
              )}

              {current.answered && (
                <Button type="button" variant="outline" size="sm" onClick={generateQuestion} disabled={loadingQuestion}>
                  {loadingQuestion ? "Gerando…" : "Próxima pergunta"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history && history.filter((h) => h.answered && h.id !== current?.id).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Histórico</p>
          {history
            .filter((h) => h.answered && h.id !== current?.id)
            .map((h) => (
              <Card key={h.id} size="sm">
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10.5px]">
                      {INTERVIEW_KIND_LABELS[h.kind]}
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
  const hasStar =
    question.kind === "behavioral" &&
    (question.star_situation != null ||
      question.star_task != null ||
      question.star_action != null ||
      question.star_result != null);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Avaliação</p>
        {question.content_score != null && (
          <Badge variant={question.content_score >= 70 ? "default" : "secondary"} className="font-mono">
            {question.content_score}/100
          </Badge>
        )}
      </div>

      {hasStar && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreBar label="Situação" value={question.star_situation ?? 0} />
          <ScoreBar label="Tarefa" value={question.star_task ?? 0} />
          <ScoreBar label="Ação" value={question.star_action ?? 0} />
          <ScoreBar label="Resultado" value={question.star_result ?? 0} />
        </div>
      )}

      {question.strengths && question.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Pontos fortes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {question.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {question.gaps && question.gaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Pra melhorar</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {question.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {question.model_answer && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Resposta-modelo</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{question.model_answer}</p>
        </div>
      )}

      {question.follow_up && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Provável follow-up</p>
          <p className="mt-1 text-sm italic text-muted-foreground">{question.follow_up}</p>
        </div>
      )}
    </div>
  );
}
