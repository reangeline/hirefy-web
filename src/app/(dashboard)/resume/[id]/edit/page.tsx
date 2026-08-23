"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { apiFetchJson } from "@/lib/api/client";
import { resumeToFormData, type ManualResumeRequest, type Resume } from "@/types/resume";

export default function EditResumePage({ params }: PageProps<"/resume/[id]/edit">) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<ManualResumeRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Resume>(`/api/resumes/${id}`)
      .then((resume) => setInitialData(resumeToFormData(resume)))
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">Editar currículo</h1>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!initialData && !error && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Carregando…
        </p>
      )}
      {initialData && <ResumeForm mode="edit" resumeId={id} initialData={initialData} />}
    </div>
  );
}
