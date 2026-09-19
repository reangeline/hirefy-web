"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CircularScore } from "@/components/resume/CircularScore";
import { PdfImportUpload } from "@/components/resume/PdfImportUpload";
import { PREMIUM_LOCKED_FEATURES } from "@/components/resume/CreditLimitReachedCard";
import { trackEvent } from "@/lib/analytics";
import type { ManualResumeRequest } from "@/types/resume";

// Chave de sessionStorage pra carregar o scan feito aqui (sem sessão) direto pra dentro de
// resume/new depois que a conta é criada — sem pedir upload de novo. Ver spec 020.
const PENDING_SCAN_KEY = "hfy_pending_scan";

export default function FreeScorePage() {
  const router = useRouter();
  const [data, setData] = useState<ManualResumeRequest | null>(null);

  function handleParsed(parsed: ManualResumeRequest) {
    setData(parsed);
    trackEvent("free_score_viewed", { ats_score: parsed.ats_score });
  }

  function handleSignupClick() {
    trackEvent("free_score_signup_clicked");
    try {
      sessionStorage.setItem(PENDING_SCAN_KEY, JSON.stringify(data));
    } catch {
      // sessionStorage indisponível — o usuário só precisa subir o PDF de novo depois de
      // criar conta, sem quebrar o fluxo.
    }
    router.push(`/signup?redirect=${encodeURIComponent("/resume/new?from=score")}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
      <Link href="/" className="text-lg font-bold tracking-tight">
        hirefy
      </Link>

      {!data && (
        <div className="mt-10">
          <h1 className="text-balance text-3xl font-bold tracking-tight">
            Veja o score de ATS do seu currículo — grátis
          </h1>
          <p className="mt-3 text-muted-foreground">
            Suba seu currículo em PDF e a IA calcula o score em segundos, sem precisar criar
            conta pra ver o resultado.
          </p>
          <div className="mt-8">
            <PdfImportUpload
              onParsed={handleParsed}
              onUploadStart={() => trackEvent("free_score_upload_started")}
            />
          </div>
        </div>
      )}

      {data && (
        <div className="mt-10 space-y-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
            <CircularScore value={data.ats_score ?? 0} size={140} />
            <p className="text-sm text-muted-foreground">Score de ATS do seu currículo</p>
          </div>

          {data.ats_improvements && data.ats_improvements.length > 0 && (
            <div>
              <h2 className="font-semibold">O que melhorar</h2>
              <ul className="mt-3 space-y-2">
                {data.ats_improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-muted/40 p-6">
            <p className="font-semibold">Crie sua conta grátis pra salvar e continuar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              3 otimizações de currículo/LinkedIn com IA grátis, mais Pipeline de candidaturas
              ilimitado. Com Premium, você também desbloqueia:
            </p>
            <ul className="mt-4 space-y-1.5">
              {PREMIUM_LOCKED_FEATURES.map((label) => (
                <li key={label} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleSignupClick}
              className={buttonVariants({ size: "lg" }) + " mt-6 w-full gap-2 sm:w-auto"}
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Seus dados ficam salvos — não precisa subir o PDF de novo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
