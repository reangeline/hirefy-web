import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
          Pronto pra passar pelo ATS?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Crie sua conta grátis e veja o score do seu currículo em segundos.
        </p>
        <div className="mt-8">
          <Link href="/signup" className={buttonVariants({ size: "lg" }) + " gap-2"}>
            Criar conta grátis
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Sem cartão de crédito necessário
        </p>
      </div>
    </section>
  );
}
