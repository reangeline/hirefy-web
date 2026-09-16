import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CircularScore } from "@/components/resume/CircularScore";

const STATS = [
  { value: "10.000+", label: "candidatos" },
  { value: "3x", label: "mais entrevistas" },
  { value: "89%", label: "aprovação no ATS" },
];

const SCAN_CHECKS = [
  { ok: true, label: "Palavras-chave da vaga presentes" },
  { ok: true, label: "Verbos de ação e métricas" },
  { ok: false, label: "Formatação em tabela confunde o parser" },
];

export function Hero() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-10">
          <div>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
              Passe pelo ATS antes de{" "}
              <span className="text-primary">chegar ao recrutador</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              O Hirefy usa IA pra otimizar seu currículo pra cada vaga, gerenciar sua
              candidatura de ponta a ponta e te dizer exatamente o que fazer a seguir.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link href="/signup" className={buttonVariants({ size: "lg" }) + " cta-signature gap-2"}>
                Otimizar meu currículo grátis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href="#como-funciona" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Ver como funciona
              </a>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Sem cartão de crédito. Score de ATS grátis.
            </p>

            <dl className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  {i > 0 && <span className="mr-4 text-border" aria-hidden="true">·</span>}
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-xl font-bold tabular-nums">{stat.value}</dd>
                  <dd className="text-xs text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Artefato real do produto — mesmo componente de score usado no ATS Match, não
              uma ilustração decorativa. Mostra o que o Hirefy de fato calcula. */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-8px_rgba(0,0,0,0.12)] lg:rotate-1 dark:rounded-[16px] dark:shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Análise de ATS
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                curriculo.pdf
              </span>
            </div>

            <div className="mt-5 flex justify-center">
              <CircularScore value={94} size={112} />
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
              {SCAN_CHECKS.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-sm">
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  )}
                  <span className={check.ok ? "" : "text-muted-foreground"}>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
