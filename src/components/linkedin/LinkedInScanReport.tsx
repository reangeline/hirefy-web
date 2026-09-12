import { CheckCircle2, Lightbulb, RefreshCcw, Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularScore } from "@/components/resume/CircularScore";
import type { LinkedInScan } from "@/types/linkedin";

function CheckRow({ label, passed, explanation }: { label: string; passed: boolean; explanation: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {passed ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <strong className="font-medium">{label}</strong>
        <p className="text-muted-foreground">{explanation}</p>
      </div>
    </li>
  );
}

interface LinkedInScanReportProps {
  scan: LinkedInScan;
  onRescan: () => void;
}

// Relatório em formato de checklist, inspirado no LinkedIn Scan Report do Jobscan (imagem
// de referência trazida pelo usuário) — mas restrito ao que dá pra derivar de texto puro:
// o parser de PDF não processa imagem, então não há check de foto/capa de perfil aqui
// (spec 015).
export function LinkedInScanReport({ scan, onRescan }: LinkedInScanReportProps) {
  const total = scan.sections.reduce((acc, s) => acc + s.checks.length, 0);
  const passedCount = scan.sections.reduce(
    (acc, s) => acc + s.checks.filter((c) => c.passed).length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <CircularScore value={scan.score} />
              <p className="text-xs font-medium text-muted-foreground">Score do perfil</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {passedCount}/{total} itens bem feitos
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onRescan} className="gap-1.5">
              <RefreshCcw className="size-3.5" aria-hidden="true" />
              Novo scan
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {scan.sections.map((section) => (
            <Card key={section.name}>
              <CardHeader>
                <CardTitle>{section.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.checks.map((check) => (
                    <CheckRow
                      key={check.label}
                      label={check.label}
                      passed={check.passed}
                      explanation={check.explanation}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {scan.predicted_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Skills sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Sugestões da IA com base no seu perfil — não significa que já estão lá.
            </p>
            <div className="flex flex-wrap gap-2">
              {scan.predicted_skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scan.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-primary" aria-hidden="true" />
              Dicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {scan.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
