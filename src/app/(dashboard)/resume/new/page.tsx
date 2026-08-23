import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { emptyManualResumeRequest } from "@/types/resume";

export default function NewResumePage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">Novo currículo</h1>
      <ResumeForm mode="create" initialData={emptyManualResumeRequest()} />
    </div>
  );
}
