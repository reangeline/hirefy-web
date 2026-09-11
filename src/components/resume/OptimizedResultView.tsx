import { AlertCircle, CheckCircle2, CircleAlert, DollarSign, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularScore } from "@/components/resume/CircularScore";
import { AddGapToResumeRow } from "@/components/resume/AddGapToResumeRow";
import type { OptimizedResume } from "@/types/resume";

interface OptimizedResultViewProps {
  optimized: OptimizedResume;
  // Só disponíveis quando a otimização está ligada a uma vaga do Pipeline (spec 005) — a
  // visão standalone de "currículo otimizado" (fora do Pipeline) não tem isso, então os
  // dois ficam opcionais e a seção de palavras-chave some quando ausentes.
  matchedKeywords?: string[];
  missingKeywords?: string[];
  // Contexto pro botão "Adicionar ao currículo" (spec 014) — resumeId precisa vir do
  // currículo BASE (não do OptimizedResume), já que é ele que fica editável. Sem resumeId,
  // o botão simplesmente não aparece (ex: visão standalone sem vaga do Pipeline por trás).
  resumeId?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}

// Barra de proporção real (batidas vs. faltando) — só desenhada quando dá pra calcular uma
// razão honesta a partir de dado que já temos. Nada de sub-score inventado tipo
// "Searchability"/"Formatting" sem uma métrica real por trás.
function ProportionBar({ matched, total }: { matched: number; total: number }) {
  const pct = total > 0 ? Math.round((matched / total) * 100) : 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SidebarStat({
  label,
  value,
  bar,
}: {
  label: string;
  value: string;
  bar?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      {bar}
    </div>
  );
}

function ChecklistRow({
  ok,
  children,
  action,
}: {
  ok: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <span>{children}</span>
        {action}
      </div>
    </li>
  );
}

export function OptimizedResultView({
  optimized,
  matchedKeywords,
  missingKeywords,
  resumeId,
  jobTitle,
  companyName,
  jobDescription,
}: OptimizedResultViewProps) {
  const salary = optimized.salary_estimate;
  const hasKeywordData = (matchedKeywords?.length ?? 0) > 0 || (missingKeywords?.length ?? 0) > 0;
  const keywordTotal = (matchedKeywords?.length ?? 0) + (missingKeywords?.length ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      {/* Sidebar — score em destaque + resumo do que tem pra revisar, no mesmo espírito de
          um relatório de scanner de currículo: número grande primeiro, detalhe depois. */}
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <CircularScore value={optimized.match_score} />
            <p className="text-xs font-medium text-muted-foreground">Match com a vaga</p>
          </div>

          <div className="w-full space-y-4 border-t border-border pt-4">
            {hasKeywordData && (
              <SidebarStat
                label="Palavras-chave"
                value={`${matchedKeywords?.length ?? 0}/${keywordTotal}`}
                bar={<ProportionBar matched={matchedKeywords?.length ?? 0} total={keywordTotal} />}
              />
            )}
            {optimized.suggestions.length > 0 && (
              <SidebarStat
                label="Sugestões"
                value={`${optimized.suggestions.length} pra revisar`}
              />
            )}
            {optimized.missing_requirements.length > 0 && (
              <SidebarStat
                label="Requisitos"
                value={`${optimized.missing_requirements.length} faltando`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal — checklist agrupado por seção, igual o padrão de relatório de
          scanner: linha com ícone verde (ok) ou âmbar (revisar) + texto explicando o porquê. */}
      <div className="space-y-6">
        {hasKeywordData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleAlert className="size-4 text-primary" aria-hidden="true" />
                Palavras-chave da vaga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {matchedKeywords?.map((kw) => (
                  <ChecklistRow key={`matched-${kw}`} ok>
                    <strong className="font-medium">{kw}</strong> — encontrada no seu currículo.
                  </ChecklistRow>
                ))}
                {missingKeywords?.map((kw) => (
                  <ChecklistRow
                    key={`missing-${kw}`}
                    ok={false}
                    action={
                      resumeId && (
                        <AddGapToResumeRow
                          gap={kw}
                          resumeId={resumeId}
                          jobTitle={jobTitle}
                          companyName={companyName}
                          jobDescription={jobDescription}
                        />
                      )
                    }
                  >
                    <strong className="font-medium">{kw}</strong> — a vaga pede, seu currículo não
                    menciona.
                  </ChecklistRow>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {optimized.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                Sugestões de melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {optimized.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {optimized.missing_requirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-4 text-warning" aria-hidden="true" />
                Requisitos faltando no currículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {optimized.missing_requirements.map((req) => (
                  <ChecklistRow
                    key={req}
                    ok={false}
                    action={
                      resumeId && (
                        <AddGapToResumeRow
                          gap={req}
                          resumeId={resumeId}
                          jobTitle={jobTitle}
                          companyName={companyName}
                          jobDescription={jobDescription}
                        />
                      )
                    }
                  >
                    {req}
                  </ChecklistRow>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {salary?.found && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-4 text-success" aria-hidden="true" />
                Estimativa salarial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold tabular-nums">
                {salary.currency} {salary.min_salary?.toLocaleString("pt-BR")} –{" "}
                {salary.max_salary?.toLocaleString("pt-BR")}
                {salary.period && (
                  <span className="text-sm font-normal text-muted-foreground"> / {salary.period}</span>
                )}
              </p>
              {salary.location && (
                <p className="mt-1 text-sm text-muted-foreground">{salary.location}</p>
              )}
              {salary.disclaimer && (
                <p className="mt-2 text-xs text-muted-foreground">{salary.disclaimer}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
