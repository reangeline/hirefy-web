"use client";

import { BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STAGE_LABELS, type PipelineAnalytics, type PipelineJobStage } from "@/types/pipeline";

interface PipelineAnalyticsViewProps {
  analytics: PipelineAnalytics;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function PipelineAnalyticsView({ analytics }: PipelineAnalyticsViewProps) {
  if (analytics.totalApplications === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart3 className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Adicione vagas ao pipeline pra ver as métricas aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Candidaturas" value={String(analytics.totalApplications)} />
        <StatCard label="Taxa de resposta" value={`${analytics.responseRate}%`} />
        <StatCard label="Score médio" value={`${analytics.averageAtsScore}%`} />
        <StatCard label="Entrevistas" value={String(analytics.interviewCount)} />
        <StatCard label="Ofertas" value={String(analytics.offerCount)} />
        <StatCard label="Ghosted" value={String(analytics.ghostedCount)} />
        <StatCard label="Esta semana" value={String(analytics.applicationsThisWeek)} />
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm">{analytics.coachInsight}</p>
        </CardContent>
      </Card>

      {analytics.bestResumeVersion && (
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-sm font-medium">Melhor currículo</p>
            <p className="text-sm text-muted-foreground">
              {analytics.bestResumeVersion.applicationCount} candidaturas,{" "}
              {analytics.bestResumeVersion.responseRate}% de resposta
            </p>
          </CardContent>
        </Card>
      )}

      {analytics.stageDistribution.length > 0 && (
        <Card>
          <CardContent className="space-y-2.5 p-4">
            <p className="text-sm font-medium">Distribuição por estágio</p>
            <div className="space-y-1.5">
              {analytics.stageDistribution.map((s) => (
                <div key={s.stage} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {STAGE_LABELS[s.stage as PipelineJobStage] ?? s.stage}
                  </span>
                  <span className="font-mono tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.weeklyActivity.length > 0 && (
        <Card>
          <CardContent className="space-y-2.5 p-4">
            <p className="text-sm font-medium">Atividade semanal</p>
            <div className="space-y-1.5">
              {analytics.weeklyActivity.map((w) => (
                <div key={w.weekLabel} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{w.weekLabel}</span>
                  <span>
                    {w.applicationCount} candidatura{w.applicationCount === 1 ? "" : "s"}
                    {w.responseCount > 0 && ` · ${w.responseCount} resposta${w.responseCount === 1 ? "" : "s"}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
