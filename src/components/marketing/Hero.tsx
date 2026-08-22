import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const STATS = [
  { value: "10.000+", label: "candidatos" },
  { value: "3x", label: "mais entrevistas" },
  { value: "89%", label: "taxa de aprovação no ATS" },
];

export function Hero() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Otimização de currículo com IA
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Passe pelo ATS antes de{" "}
            <span className="text-primary">chegar ao recrutador</span>
          </h1>

          <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
            O Hirefy usa IA pra otimizar seu currículo pra cada vaga, gerenciar sua
            candidatura de ponta a ponta e te dizer exatamente o que fazer a seguir.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg" }) + " gap-2"}>
              Otimizar meu currículo grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href="#como-funciona" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Ver como funciona
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Sem cartão de crédito. Score de ATS grátis.
          </p>
        </div>

        <dl className="mx-auto mt-20 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-xl border border-border">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-bold tabular-nums md:text-4xl">{stat.value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
