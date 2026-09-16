import {
  BarChart3,
  CalendarDays,
  KanbanSquare,
  Lightbulb,
  Share2,
  Target,
  Zap,
} from "lucide-react";

const CATEGORIES = [
  {
    label: "Currículo & ATS",
    features: [
      {
        icon: Zap,
        title: "Score de ATS instantâneo",
        description:
          "Envie seu PDF e receba um score em segundos, com uma lista numerada do que melhorar.",
      },
      {
        icon: Target,
        title: "Otimização por vaga",
        description:
          "Cole a descrição da vaga e a IA ajusta cada palavra-chave e bullet pro cargo exato.",
      },
      {
        icon: Share2,
        title: "Gerador de perfil LinkedIn",
        description:
          "Gera Headline, Sobre, Experiência e Skills otimizados a partir do seu currículo.",
      },
    ],
  },
  {
    label: "Pipeline de candidaturas",
    features: [
      {
        icon: KanbanSquare,
        title: "Kanban completo",
        description:
          "Lista de desejos → Aplicado → Entrevista → Oferta/Rejeitado, com linha do tempo por vaga.",
      },
      {
        icon: Lightbulb,
        title: "Coach de IA por etapa",
        description:
          "Sugestões contextuais pra cada vaga, baseadas no estágio e nos dias desde a candidatura.",
      },
      {
        icon: CalendarDays,
        title: "Entrevistas e contatos",
        description:
          "Registre entrevistas, acompanhe follow-ups e gerencie contatos por candidatura.",
      },
    ],
  },
  {
    label: "Analytics",
    features: [
      {
        icon: BarChart3,
        title: "Métricas de candidatura",
        description:
          "Taxa de resposta, score médio de ATS, entrevistas e qual versão de currículo funciona melhor.",
      },
    ],
  },
];

export function Features() {
  return (
    <section id="recursos" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Tudo que você precisa pra passar pelo ATS
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Do score instantâneo ao gerenciamento do pipeline, o Hirefy cobre cada etapa da
            sua busca por emprego.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {CATEGORIES.map((category) => (
            <div key={category.label}>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">{category.label}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.features.map((feature) => (
                  <div key={feature.title} className="rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2.5">
                      <feature.icon className="size-[18px] text-primary" aria-hidden="true" />
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="mt-2.5 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
