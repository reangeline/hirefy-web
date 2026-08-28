"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Free + Premium só (spec 007) — sem Basic/Pro/Yearly. US$19,99/mês é o preço real
// configurado no Stripe (achado registrado no log da spec 008: a versão anterior desta
// seção, na hirefy_lading, mostrava $9.99/mês e $79.99/ano, que nunca existiram de verdade).
const PLANS = [
  {
    name: "Free",
    price: "US$0",
    period: "pra sempre",
    description: "Pra começar a organizar sua busca de emprego",
    icon: Sparkles,
    features: [
      "Pipeline de candidaturas (Kanban) ilimitado",
      "Contatos e histórico por vaga",
      "3 otimizações de currículo com IA inclusas",
      "Score de ATS e sugestões de melhoria",
    ],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Premium",
    price: "US$19,99",
    period: "por mês",
    description: "Pra quem está aplicando ativamente",
    icon: Zap,
    features: [
      "Otimizações de currículo com IA ilimitadas",
      "Coach de IA ilimitado em cada etapa da vaga",
      "Gerador de perfil LinkedIn",
      "Analytics do pipeline de candidaturas",
    ],
    cta: "Assinar Premium",
    popular: true,
  },
];

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent("pricing_viewed");
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Preço simples
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Comece grátis, faça upgrade quando quiser. Cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border bg-card p-8",
                plan.popular ? "border-primary shadow-lg" : "border-border",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Mais popular
                </span>
              )}

              <plan.icon className="size-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.period}</span>
              </div>

              <Link
                href="/signup"
                onClick={() => trackEvent("pricing_cta_clicked", { plan: plan.name.toLowerCase() })}
                className={cn(
                  buttonVariants({ variant: plan.popular ? "default" : "outline" }),
                  "mt-6 w-full",
                )}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
