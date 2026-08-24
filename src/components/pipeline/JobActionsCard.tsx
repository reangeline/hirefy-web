"use client";

import { useState, type FormEvent } from "react";
import { Ghost, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api/client";
import {
  INTERVIEW_TYPE_LABELS,
  PIPELINE_STAGES,
  STAGE_LABELS,
  type InterviewType,
  type PipelineJob,
  type PipelineJobStage,
} from "@/types/pipeline";

const INTERVIEW_TYPES = Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[];

interface JobActionsCardProps {
  job: PipelineJob;
  onUpdated: (job: PipelineJob) => void;
}

export function JobActionsCard({ job, onUpdated }: JobActionsCardProps) {
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStage(stage: PipelineJobStage) {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetchJson<PipelineJob>(`/api/pipeline/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível mudar o estágio.");
    } finally {
      setBusy(false);
    }
  }

  async function markGhosted() {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetchJson<PipelineJob>(`/api/pipeline/${job.id}/ghost`, { method: "POST" });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível marcar como ghosted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-40 flex-1 space-y-1.5">
            <Label>Estágio</Label>
            <Select
              items={STAGE_LABELS}
              value={job.stage}
              onValueChange={(v) => changeStage(v as PipelineJobStage)}
            >
              <SelectTrigger className="w-full" disabled={busy}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!job.is_ghosted && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={markGhosted} className="gap-1.5">
              <Ghost className="size-4" aria-hidden="true" />
              Marcar como ghosted
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowInterviewForm((v) => !v)}>
            Registrar entrevista
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowFollowUpForm((v) => !v)}>
            Registrar follow-up
          </Button>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {showInterviewForm && (
          <LogInterviewForm
            jobId={job.id}
            onDone={(updated) => {
              onUpdated(updated);
              setShowInterviewForm(false);
            }}
          />
        )}

        {showFollowUpForm && (
          <LogFollowUpForm jobId={job.id} onDone={() => setShowFollowUpForm(false)} />
        )}
      </CardContent>
    </Card>
  );
}

function LogInterviewForm({ jobId, onDone }: { jobId: string; onDone: (job: PipelineJob) => void }) {
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("phone_screen");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiFetchJson<PipelineJob>(`/api/pipeline/${jobId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_at: `${interviewAt}:00`,
          interview_type: interviewType,
          detail: detail || undefined,
        }),
      });
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a entrevista.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="interviewAt">Data/hora</Label>
          <Input
            id="interviewAt"
            type="datetime-local"
            required
            value={interviewAt}
            onChange={(e) => setInterviewAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            items={INTERVIEW_TYPE_LABELS}
            value={interviewType}
            onValueChange={(v) => setInterviewType(v as InterviewType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {INTERVIEW_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="interviewDetail">Detalhes (opcional)</Label>
        <Textarea id="interviewDetail" rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} />
      </div>
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

function LogFollowUpForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetchJson(`/api/pipeline/${jobId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detail: detail || undefined }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o follow-up.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="space-y-1.5">
        <Label htmlFor="followUpDetail">O que você fez (opcional)</Label>
        <Textarea
          id="followUpDetail"
          rows={2}
          placeholder="Ex: enviei mensagem no LinkedIn pro recrutador"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}
