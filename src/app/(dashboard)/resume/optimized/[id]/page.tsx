import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OptimizedResultView } from "@/components/resume/OptimizedResultView";
import { getOptimizedById } from "@/lib/mock/resumes";

export default async function OptimizedResumePage({ params }: PageProps<"/resume/optimized/[id]">) {
  const { id } = await params;
  const optimized = getOptimizedById(id);
  if (!optimized) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>
      <h1 className="text-2xl font-semibold">{optimized.sourceResumeName}</h1>
      <OptimizedResultView optimized={optimized} />
    </div>
  );
}
