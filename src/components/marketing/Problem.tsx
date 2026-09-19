import { getTranslations } from "next-intl/server";
import { AlertTriangle, Clock, FileX, XCircle } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { ParallaxCard } from "@/components/marketing/ParallaxCard";

const PROBLEM_ICONS = [FileX, AlertTriangle, XCircle, Clock];

export async function Problem() {
  const t = await getTranslations("Marketing.problem");
  const items = t.raw("items") as { title: string; description: string }[];
  const PROBLEMS = items.map((item, i) => ({ ...item, icon: PROBLEM_ICONS[i] }));

  return (
    <section className="relative border-b border-border/60 bg-muted/50 dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {t("heading")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("subheading")}
            </p>

            {/* Claro: card sólido teal (como sempre foi). Escuro: segue o padrão "Statistic
                Counter" do Auros — número grande em lavender-phosphor sobre a superfície
                recuada, não um preenchimento sólido (isso é reservado pro CTA). */}
            <ParallaxCard strength={16} className="mt-8">
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground dark:rounded-[16px] dark:border dark:border-border dark:bg-muted dark:text-inherit">
                <div className="text-5xl font-bold tabular-nums dark:text-[#fde9ff]">{t("statValue")}</div>
                <p className="mt-2 font-medium dark:text-[#edfffe]">{t("statLabel")}</p>
                <p className="mt-2 text-sm text-primary-foreground/80 dark:text-muted-foreground">
                  {t("statDescription")}
                </p>
              </div>
            </ParallaxCard>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {PROBLEMS.map((problem, i) => (
              <Reveal key={problem.title} delayMs={i * 80}>
                <div className="h-full rounded-xl border border-border bg-background p-6 dark:rounded-[16px] dark:bg-card dark:transition-colors dark:hover:bg-accent">
                  <problem.icon className="size-6 text-destructive" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">{problem.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{problem.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
