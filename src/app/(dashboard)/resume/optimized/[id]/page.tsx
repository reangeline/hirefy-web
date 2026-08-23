"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { OptimizedResultView } from "@/components/resume/OptimizedResultView";
import { apiFetchJson } from "@/lib/api/client";
import type { OptimizedResume } from "@/types/resume";

export default function OptimizedResumePage({ params }: PageProps<"/resume/optimized/[id]">) {
  const { id } = use(params);
  const [optimized, setOptimized] = useState<OptimizedResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<OptimizedResume>(`/api/resumes/optimized/${id}`)
      .then(setOptimized)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">Currículo otimizado</h1>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!optimized && !error && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Carregando…
        </p>
      )}
      {optimized && <OptimizedResultView optimized={optimized} />}
    </div>
  );
}
