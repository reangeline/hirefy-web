import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  CalendarDays,
  KanbanSquare,
  Lightbulb,
  Share2,
  Target,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const CATEGORY_ICONS = [
  [Zap, Target, Share2],
  [KanbanSquare, Lightbulb, CalendarDays],
  [BarChart3],
];

export async function Features() {
  const t = await getTranslations("Marketing.features");
  const rawCategories = t.raw("categories") as {
    label: string;
    items: { title: string; description: string }[];
  }[];
  const CATEGORIES = rawCategories.map((category, ci) => ({
    label: category.label,
    features: category.items.map((item, fi) => ({
      ...item,
      icon: CATEGORY_ICONS[ci][fi],
    })),
  }));

  return (
    <section id="recursos" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subheading")}
          </p>
        </Reveal>

        <div className="mt-16 space-y-16">
          {CATEGORIES.map((category) => (
            <div key={category.label}>
              <Reveal className="mb-6 flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">{category.label}</span>
                <div className="h-px flex-1 bg-border" />
              </Reveal>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.features.map((feature, i) => (
                  <Reveal key={feature.title} delayMs={i * 80}>
                    <div className="h-full rounded-xl border border-border p-6 dark:rounded-[16px] dark:bg-card dark:transition-colors dark:hover:bg-accent">
                      <div className="flex items-center gap-2.5">
                        <feature.icon className="size-[18px] text-primary" aria-hidden="true" />
                        <h3 className="font-semibold">{feature.title}</h3>
                      </div>
                      <p className="mt-2.5 text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
