"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Briefcase, GraduationCap, Lightbulb, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { CircularScore } from "@/components/resume/CircularScore";
import { cn } from "@/lib/utils";
import type { LinkedInOptimizedProfile } from "@/types/linkedin";

function formatPeriod(
  startDate: string,
  endDate: string | undefined,
  isCurrent: boolean,
  currentLabel: string,
): string {
  const end = isCurrent ? currentLabel : endDate || "?";
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
  const t = useTranslations("LinkedIn");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggleSuggestion(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const selectedSuggestionsText = profile.suggestions
    .filter((_, i) => selected.has(i))
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <CircularScore value={profile.profile_strength_score} size={112} />
              <p className="text-xs font-medium text-muted-foreground">{t("fillGuide.profileStrengthLabel")}</p>
            </div>
            <Link href="/linkedin/fill">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <RefreshCcw className="size-3.5" aria-hidden="true" />
                {t("fillGuide.generateNewGuide")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("fillGuide.headline")}</CardTitle>
              <CopyButton text={profile.headline} />
            </CardHeader>
            <CardContent>
              <p className="text-sm">{profile.headline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("fillGuide.about")}</CardTitle>
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
                  {t("fillGuide.experience")}
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
                          {formatPeriod(exp.start_date, exp.end_date, exp.is_current, t("fillGuide.periodCurrent"))}
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
                  {t("fillGuide.skills")}
                </CardTitle>
                <CopyButton text={profile.skills.join(", ")} label={t("fillGuide.copyAllSkills")} />
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
                  {t("fillGuide.languages")}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                  {t("fillGuide.suggestions")}
                </CardTitle>
                <CopyButton
                  text={selectedSuggestionsText}
                  label={t("fillGuide.copySelected")}
                  disabled={selected.size === 0}
                />
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("fillGuide.suggestionsHint")}
                </p>
                <ul className="space-y-1">
                  {profile.suggestions.map((suggestion, i) => {
                    const isSelected = selected.has(i);
                    return (
                      <li key={i}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                            isSelected && "bg-primary/5",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 size-3.5 shrink-0 accent-primary"
                            checked={isSelected}
                            onChange={() => toggleSuggestion(i)}
                          />
                          <span className={cn(!isSelected && "text-muted-foreground")}>{suggestion}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("fillGuide.footerNote")}</p>
    </div>
  );
}
