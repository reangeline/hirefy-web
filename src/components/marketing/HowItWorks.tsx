import { getTranslations } from "next-intl/server";
import { LayoutDashboard, Upload, Wand2 } from "lucide-react";
import { ConvergeOnScroll } from "@/components/marketing/ConvergeOnScroll";
import { Reveal } from "@/components/marketing/Reveal";

const STEP_ICONS = [Upload, Wand2, LayoutDashboard];
const STEP_NUMBERS = ["01", "02", "03"];

export async function HowItWorks() {
  const t = await getTranslations("Marketing.howItWorks");
  const rawSteps = t.raw("steps") as { title: string; description: string }[];
  const STEPS = rawSteps.map((step, i) => ({
    ...step,
    number: STEP_NUMBERS[i],
    icon: STEP_ICONS[i],
  }));

  return (
    <section id="como-funciona" className="border-b border-border/60 bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subheading")}
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <ConvergeOnScroll key={step.number} direction={i === 0 ? "left" : i === 2 ? "right" : "up"}>
              <div className="h-full rounded-xl border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30 tabular-nums">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </ConvergeOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
