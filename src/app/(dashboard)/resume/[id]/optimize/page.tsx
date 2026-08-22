import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OptimizeForm } from "@/components/resume/OptimizeForm";
import { getResumeById } from "@/lib/mock/resumes";

export default async function OptimizeResumePage({ params }: PageProps<"/resume/[id]/optimize">) {
  const { id } = await params;
  const resume = getResumeById(id);
  if (!resume) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">Otimizar currículo</h1>
      <OptimizeForm resumeName={resume.nickname} />
    </div>
  );
}
