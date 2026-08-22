import { LayoutDashboard, Upload, Wand2 } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Envie e veja seu score",
    description:
      "Suba seu currículo em PDF e receba um score de ATS instantâneo, com uma lista do que melhorar.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Otimize pra vaga",
    description:
      "Escolha o currículo base, cole a descrição da vaga e a IA ajusta cada palavra-chave e bullet.",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Acompanhe e receba coaching",
    description:
      "Adicione a candidatura ao Kanban e receba sugestões da IA em cada etapa do processo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-b border-border/60 bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            Comece em 3 passos simples
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Do upload ao pipeline de candidaturas otimizado — em minutos.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-xl border border-border bg-background p-6">
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
          ))}
        </div>
      </div>
    </section>
  );
}
