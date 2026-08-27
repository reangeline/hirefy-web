"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { OptimizeForm } from "@/components/resume/OptimizeForm";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import type { Resume } from "@/types/resume";

export default function OptimizeResumePage({ params }: PageProps<"/resume/[id]/optimize">) {
  const { id } = use(params);
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Resume>(`/api/resumes/${id}`)
      .then(setResume)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const resumeName = resume?.parsed_data.nickname || resume?.parsed_data.personal?.full_name || "";

  return (
    <>
      <Topbar title="Otimizar currículo" />
      <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
        <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Meus currículos
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!resume && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}
        {resume && <OptimizeForm resumeId={id} resumeName={resumeName} />}
      </div>
    </>
  );
}
