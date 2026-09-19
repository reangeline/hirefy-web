"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeCard } from "@/components/resume/ResumeCard";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import type { Resume } from "@/types/resume";

export default function ResumeListPage() {
  const t = useTranslations("Resume");
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Resume[]>("/api/resumes")
      .then(setResumes)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiFetchJson(`/api/resumes/${id}`, { method: "DELETE" });
      setResumes((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("page.list.deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Topbar title={t("page.list.topbarTitle")} />
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("page.list.heading")}</h1>
        <Link href="/resume/new">
          <Button type="button" size="sm" className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            {t("page.list.newResume")}
          </Button>
        </Link>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!resumes && !error && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}

      {resumes && resumes.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-medium">{t("page.list.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page.list.emptyDescription")}
          </p>
          <Link href="/resume/new">
            <Button type="button" className="mt-6 gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {t("page.list.createResume")}
            </Button>
          </Link>
        </div>
      )}

      {resumes && resumes.length > 0 && (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={handleDelete}
              deleting={deletingId === resume.id}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}
