import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OptimizedResume } from "@/types/resume";

function scoreVariant(score: number): "default" | "secondary" {
  return score >= 70 ? "default" : "secondary";
}

export function OptimizedResultView({ optimized }: { optimized: OptimizedResume }) {
  const salary = optimized.salary_estimate;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Match com a vaga</CardTitle>
          <Badge variant={scoreVariant(optimized.match_score)} className="h-7 px-3 text-sm">
            {Math.round(optimized.match_score)}%
          </Badge>
        </CardHeader>
      </Card>

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
          <CardContent className="flex flex-wrap gap-2">
            {optimized.missing_requirements.map((req) => (
              <Badge key={req} variant="outline">
                {req}
              </Badge>
            ))}
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
  );
}
