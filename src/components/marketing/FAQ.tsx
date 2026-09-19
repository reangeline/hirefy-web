import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

export async function FAQ() {
  const t = await getTranslations("Marketing.faq");
  const FAQS = t.raw("items") as { question: string; answer: string }[];

  return (
    <section id="faq" className="border-b border-border/60">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t("heading")}
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.question} delayMs={Math.min(i, 4) * 60}>
              <details className="group rounded-xl border border-border bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.question}
                  <Plus
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
