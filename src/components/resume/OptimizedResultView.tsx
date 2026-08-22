import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OptimizedResume } from "@/types/resume";

function scoreVariant(score: number): "default" | "secondary" {
  return score >= 70 ? "default" : "secondary";
}

export function OptimizedResultView({ optimized }: { optimized: OptimizedResume }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Match com a vaga</CardTitle>
            {optimized.targetRole && (
              <p className="mt-1 text-sm text-muted-foreground">
                {optimized.targetRole}
                {optimized.targetCompany ? ` · ${optimized.targetCompany}` : ""}
              </p>
            )}
          </div>
          <Badge variant={scoreVariant(optimized.matchScore)} className="h-7 px-3 text-sm">
            {optimized.matchScore}%
          </Badge>
        </CardHeader>
      </Card>

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

      {optimized.missingRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4 text-warning" aria-hidden="true" />
              Requisitos faltando no currículo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {optimized.missingRequirements.map((req) => (
              <Badge key={req} variant="outline">
                {req}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {optimized.salaryEstimate?.found && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-4 text-success" aria-hidden="true" />
              Estimativa salarial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">
              {optimized.salaryEstimate.currency}{" "}
              {optimized.salaryEstimate.minSalary?.toLocaleString("pt-BR")} –{" "}
              {optimized.salaryEstimate.maxSalary?.toLocaleString("pt-BR")}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {optimized.salaryEstimate.period}
              </span>
            </p>
            {optimized.salaryEstimate.location && (
              <p className="mt-1 text-sm text-muted-foreground">
                {optimized.salaryEstimate.location}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
