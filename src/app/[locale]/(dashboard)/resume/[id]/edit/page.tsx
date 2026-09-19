"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetchJson } from "@/lib/api/client";
import { resumeToFormData, type ManualResumeRequest, type Resume } from "@/types/resume";

export default function EditResumePage({ params }: PageProps<"/[locale]/resume/[id]/edit">) {
  const t = useTranslations("Resume");
  const { id } = use(params);
  const [initialData, setInitialData] = useState<ManualResumeRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Resume>(`/api/resumes/${id}`)
      .then((resume) => setInitialData(resumeToFormData(resume)))
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <>
      <Topbar title={t("page.edit.topbarTitle")} />
      <div className="space-y-6 p-6">
        <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backToList")}
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!initialData && !error && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {t("loading")}
          </p>
        )}
        {initialData && <ResumeForm mode="edit" resumeId={id} initialData={initialData} />}
      </div>
    </>
  );
}
