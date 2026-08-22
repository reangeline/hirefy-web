"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeCard } from "@/components/resume/ResumeCard";
import { MOCK_RESUMES } from "@/lib/mock/resumes";
import type { Resume } from "@/types/resume";

// UI da spec 002 com dados mock — sem ligação com o backend ainda (ver .spec/002-resume-optimization/spec.md).
export default function ResumeListPage() {
  const [resumes, setResumes] = useState<Resume[]>(MOCK_RESUMES);

  function handleDelete(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus currículos</h1>
        <Link href="/resume/new">
          <Button type="button" className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Novo currículo
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-medium">Nenhum currículo ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie seu primeiro currículo pra começar a otimizar pra vagas.
          </p>
          <Link href="/resume/new">
            <Button type="button" className="mt-6 gap-2">
              <Plus className="size-4" aria-hidden="true" />
              Criar currículo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
