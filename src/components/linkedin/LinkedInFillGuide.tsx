import Link from "next/link";
import { Briefcase, GraduationCap, Lightbulb, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { CircularScore } from "@/components/resume/CircularScore";
import type { LinkedInOptimizedProfile } from "@/types/linkedin";

function formatPeriod(startDate: string, endDate: string | undefined, isCurrent: boolean): string {
  const end = isCurrent ? "atual" : endDate || "?";
  return `${startDate || "?"} — ${end}`;
}

interface LinkedInFillGuideProps {
  profile: LinkedInOptimizedProfile;
}

// Guia pronto-pra-copiar gerado a partir do currículo do usuário — spec 017. Diferente do
// Scan Report (spec 015, que audita um perfil que já existe), aqui a IA gera conteúdo novo
// pra preencher, seguindo a regra do prompt de nunca inventar experiência que o currículo
// base não tem (ver ai_service_impl.go, OptimizeForLinkedIn).
export function LinkedInFillGuide({ profile }: LinkedInFillGuideProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <CircularScore value={profile.profile_strength_score} size={112} />
              <p className="text-xs font-medium text-muted-foreground">Força do perfil sugerido</p>
            </div>
            <Link href="/linkedin/fill">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <RefreshCcw className="size-3.5" aria-hidden="true" />
                Gerar novo guia
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Headline</CardTitle>
              <CopyButton text={profile.headline} />
            </CardHeader>
            <CardContent>
              <p className="text-sm">{profile.headline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sobre</CardTitle>
              <CopyButton text={profile.about} />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{profile.about}</p>
            </CardContent>
          </Card>

          {profile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" aria-hidden="true" />
                  Experiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {profile.experiences.map((exp, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {exp.role} <span className="text-muted-foreground">· {exp.company}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPeriod(exp.start_date, exp.end_date, exp.is_current)}
                        </p>
                      </div>
                      <CopyButton text={exp.description.join("\n")} />
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {exp.description.map((line, j) => (
                        <li key={j}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {profile.skills.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Skills
                </CardTitle>
                <CopyButton text={profile.skills.join(", ")} label="Copiar todas" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                  Idiomas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {profile.languages.map((lang) => (
                    <li key={lang.name} className="flex items-center justify-between">
                      <span>{lang.name}</span>
                      <span className="text-muted-foreground">{lang.level}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {profile.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                  Sugestões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {profile.suggestions.map((suggestion, i) => (
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
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Conteúdo gerado a partir do currículo escolhido — dê uma revisada antes de colar no
        seu perfil do LinkedIn.
      </p>
    </div>
  );
}
