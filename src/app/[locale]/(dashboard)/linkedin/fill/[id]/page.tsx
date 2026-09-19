"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { LinkedInFillGuide } from "@/components/linkedin/LinkedInFillGuide";
import { apiFetchJson } from "@/lib/api/client";
import type { LinkedInOptimizedProfile } from "@/types/linkedin";

// Shape crua de GET /resumes/optimized/{id} (domain.OptimizedResume) — só os campos usados
// aqui. Pra um resultado do tipo "linkedin", os campos específicos do guia vêm dentro de
// parsed_data (ver ProcessLinkedInOptimizationJob no backend, spec 017).
interface OptimizedResumeRaw {
  id: string;
  suggestions: string[];
  parsed_data: {
    type?: string;
    headline?: string;
    about?: string;
    experiences?: LinkedInOptimizedProfile["experiences"];
    skills?: string[];
    languages?: LinkedInOptimizedProfile["languages"];
    profile_strength_score?: number;
  };
}

export default function LinkedInFillResultPage({ params }: PageProps<"/[locale]/linkedin/fill/[id]">) {
  const { id } = use(params);
  const [profile, setProfile] = useState<LinkedInOptimizedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<OptimizedResumeRaw>(`/api/resumes/optimized/${id}`)
      .then((raw) => {
        if (raw.parsed_data.type !== "linkedin") {
          setError("Esse resultado não é um guia de LinkedIn.");
          return;
        }
        setProfile({
          id: raw.id,
          headline: raw.parsed_data.headline ?? "",
          about: raw.parsed_data.about ?? "",
          experiences: raw.parsed_data.experiences ?? [],
          skills: raw.parsed_data.skills ?? [],
          languages: raw.parsed_data.languages ?? [],
          suggestions: raw.suggestions ?? [],
          profile_strength_score: raw.parsed_data.profile_strength_score ?? 0,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <>
      <Topbar title="LinkedIn" />
      <div className="space-y-6 p-6">
        <Link href="/linkedin/fill" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Guia de preenchimento
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!profile && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}

        {profile && <LinkedInFillGuide profile={profile} />}
      </div>
    </>
  );
}
