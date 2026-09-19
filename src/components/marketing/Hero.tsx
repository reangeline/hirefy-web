import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CircularScore } from "@/components/resume/CircularScore";
import { ParticleField } from "@/components/marketing/ParticleField";
import { ParallaxCard } from "@/components/marketing/ParallaxCard";

export async function Hero() {
  const t = await getTranslations("Marketing.hero");

  const STATS = [
    { value: "10.000+", label: t("statCandidates") },
    { value: "3x", label: t("statInterviews") },
    { value: "89%", label: t("statAtsApproval") },
  ];

  const SCAN_CHECKS = [
    { ok: true, label: t("checkKeywords") },
    { ok: true, label: t("checkVerbs") },
    { ok: false, label: t("checkFormatting") },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Blob de luz ambiente — só no tema escuro, atrás de tudo, decorativo. */}
      <div
        aria-hidden="true"
        className="aurora-blob pointer-events-none absolute -top-1/4 left-1/4 hidden size-[36rem] dark:block"
      />

      {/* Campo de partículas — só no tema escuro, atrás de tudo, não intercepta clique. */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="animate-in fade-in fill-mode-both size-full duration-[1600ms]">
          <ParticleField />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-10">
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both">
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
              {t.rich("headline", {
                em: (chunks) => <span className="text-primary">{chunks}</span>,
              })}
            </h1>

            <p
              className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-1000"
              style={{ animationDelay: "150ms" }}
            >
              {t("subheadline")}
            </p>

            <div
              className="mt-8 flex flex-col items-start gap-3 animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-1000 sm:flex-row sm:items-center"
              style={{ animationDelay: "300ms" }}
            >
              <Link href="/signup" className={buttonVariants({ size: "lg" }) + " cta-signature gap-2"}>
                {t("ctaPrimary")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href="#como-funciona" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("ctaSecondary")}
              </a>
            </div>
            <p
              className="mt-3 text-sm text-muted-foreground animate-in fade-in fill-mode-both duration-1000"
              style={{ animationDelay: "450ms" }}
            >
              {t("ctaFootnote")}
            </p>

            <dl
              className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono animate-in fade-in fill-mode-both duration-1000"
              style={{ animationDelay: "600ms" }}
            >
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
              uma ilustração decorativa. Mostra o que o Hirefy de fato calcula. Pop de entrada
              mais dramático (zoom-in-75) + flutuação idle (float-y) + leve paralaxe ao rolar
              (ParallaxCard), pra reforçar a sensação de profundidade/água da referência. */}
          <ParallaxCard strength={20}>
            <div
              className="animate-in fade-in zoom-in-75 fill-mode-both rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-8px_rgba(0,0,0,0.12)] duration-1000 lg:rotate-1 dark:rounded-[16px] dark:shadow-none dark:[animation:float-y_6s_ease-in-out_infinite]"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("cardLabel")}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t("cardFilename")}
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
          </ParallaxCard>
        </div>
      </div>
    </section>
  );
}
