import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ConvergeOnScroll } from "@/components/marketing/ConvergeOnScroll";

export async function CTASection() {
  const t = await getTranslations("Marketing.cta");

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <ConvergeOnScroll direction="scale">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("subheading")}
          </p>
          <div className="mt-8">
            <Link href="/signup" className={buttonVariants({ size: "lg" }) + " gap-2"}>
              {t("button")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("footnote")}
          </p>
        </ConvergeOnScroll>
      </div>
    </section>
  );
}
