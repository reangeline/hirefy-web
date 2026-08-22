import { AlertTriangle, Clock, FileX, XCircle } from "lucide-react";

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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            Por que candidatos qualificados são rejeitados
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Não é sobre suas habilidades. É sobre passar pelos robôs que leem seu currículo
            primeiro.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
          {PROBLEMS.map((problem) => (
            <div key={problem.title} className="rounded-xl border border-border bg-background p-6">
              <problem.icon className="size-6 text-destructive" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{problem.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{problem.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <div className="text-6xl font-bold tabular-nums md:text-7xl">98%</div>
          <p className="mt-3 text-lg font-medium md:text-xl">
            das empresas Fortune 500 usam ATS
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/80">
            Ou seja: seu currículo precisa ser otimizado pra robôs antes de chegar a um
            recrutador de verdade.
          </p>
        </div>
      </div>
    </section>
  );
}
