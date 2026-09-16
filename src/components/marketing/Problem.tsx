import { AlertTriangle, Clock, FileX, XCircle } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const PROBLEMS = [
  {
    icon: FileX,
    title: "75% dos currículos são rejeitados",
    description:
      "Seu currículo é filtrado por um ATS antes de chegar a um humano. Sem um score otimizado, sua candidatura nem existe — não importa sua qualificação.",
  },
  {
    icon: AlertTriangle,
    title: "Formatação invisível pro ATS",
    description:
      "Tabelas, colunas e layouts criativos confundem o parser do ATS — suas habilidades e experiências somem pro sistema que decide primeiro.",
  },
  {
    icon: XCircle,
    title: "Currículo genérico não passa",
    description:
      "Cada vaga tem palavras-chave específicas. Sem adaptar o currículo pra cada uma, até candidatos qualificados são rejeitados automaticamente.",
  },
  {
    icon: Clock,
    title: "Nenhum controle das candidaturas",
    description:
      "Você aplica pra dezenas de vagas sem forma de rastrear estágio, agendar follow-up ou gerenciar contatos. Oportunidades se perdem.",
  },
];

export function Problem() {
  return (
    <section className="border-b border-border/60 bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Por que candidatos qualificados são rejeitados
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Não é sobre suas habilidades. É sobre passar pelos robôs que leem seu currículo
              primeiro.
            </p>

            {/* Claro: card sólido teal (como sempre foi). Escuro: segue o padrão "Statistic
                Counter" do Auros — número grande em lavender-phosphor sobre a superfície
                recuada, não um preenchimento sólido (isso é reservado pro CTA). */}
            <div className="mt-8 rounded-2xl bg-primary p-6 text-primary-foreground dark:rounded-[16px] dark:border dark:border-border dark:bg-muted dark:text-inherit">
              <div className="text-5xl font-bold tabular-nums dark:text-[#fde9ff]">98%</div>
              <p className="mt-2 font-medium dark:text-[#edfffe]">das empresas Fortune 500 usam ATS</p>
              <p className="mt-2 text-sm text-primary-foreground/80 dark:text-muted-foreground">
                Seu currículo precisa ser otimizado pra robôs antes de chegar a um recrutador
                de verdade.
              </p>
            </div>
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
