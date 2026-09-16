import { Plus } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const FAQS = [
  {
    question: "O que é ATS e por que isso importa?",
    answer:
      "ATS (Applicant Tracking System) é o software usado pela maioria das grandes empresas pra filtrar currículos automaticamente antes de um humano ver. Ele analisa palavras-chave, formatação e outros critérios — se seu currículo não estiver otimizado, ele é rejeitado automaticamente, não importa sua qualificação.",
  },
  {
    question: "Como o Hirefy funciona?",
    answer:
      "Envie seu currículo e a IA analisa em segundos, mostrando seu score de ATS, palavras-chave faltando, problemas de formatação e recomendações específicas de melhoria. Você revisa as sugestões e decide o que aplicar.",
  },
  {
    question: "O plano grátis é grátis mesmo?",
    answer:
      "Sim! Otimizações de currículo com IA ilimitadas, score de ATS e pipeline de candidaturas, tudo sem precisar de cartão de crédito. Pra prática de entrevista com IA e coach em todas as etapas ilimitados, tem o Premium.",
  },
  {
    question: "Quais formatos de arquivo são aceitos?",
    answer:
      "PDF é o formato recomendado pra importar seu currículo — a IA extrai os dados automaticamente e já calcula um score de ATS inicial.",
  },
  {
    question: "O Hirefy muda o conteúdo do meu currículo sozinho?",
    answer:
      "Não. O Hirefy sugere melhorias, mas você sempre revisa e decide o que aplicar antes de salvar — nada é alterado automaticamente sem sua confirmação.",
  },
  {
    question: "Posso cancelar minha assinatura quando quiser?",
    answer:
      "Sim, o cancelamento é imediato pelo próprio painel, sem burocracia. Você continua com acesso Premium até o fim do período já pago.",
  },
  {
    question: "Meus dados de currículo ficam seguros?",
    answer:
      "Levamos privacidade a sério — seus dados ficam armazenados de forma segura e você pode excluir sua conta e todos os seus dados a qualquer momento.",
  },
  {
    question: "Funciona pra qualquer área ou cargo?",
    answer:
      "Sim, o Hirefy funciona pra qualquer setor e nível de carreira — a IA se adapta à descrição da vaga que você colar, seja tech, saúde, financeiro ou outra área.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border/60">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Perguntas frequentes
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
