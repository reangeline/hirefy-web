import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { mockResumeFormFor } from "@/lib/mock/resumes";

export default async function EditResumePage({ params }: PageProps<"/resume/[id]/edit">) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">Editar currículo</h1>
      <ResumeForm mode="edit" initialData={mockResumeFormFor(id)} />
    </div>
  );
}
