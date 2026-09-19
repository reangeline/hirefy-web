"use client";

import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";

interface CheckoutResponse {
  checkout_url: string;
}

export const PREMIUM_LOCKED_FEATURES = [
  "Otimizações de currículo/LinkedIn ilimitadas",
  "Prática de entrevista com IA ilimitada",
  "Coach de IA em cada etapa da candidatura",
  "Analytics do pipeline de candidaturas",
];

interface CreditLimitReachedCardProps {
  /** Qual fluxo bateu o limite — só pra analytics (spec 020). */
  feature: "resume_optimize" | "linkedin_optimize";
}

/** Aparece no lugar do card de erro genérico quando um job assíncrono falha por falta de
 * crédito (job.error === "subscription is not active", ver domain.ErrSubscriptionInactive).
 * Em vez de só informar a falha, mostra o que o Premium libera — "mostre o teto pago, não só
 * o piso grátis" (spec 020). */
export function CreditLimitReachedCard({ feature }: CreditLimitReachedCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("credit_limit_reached", { feature });
  }, [feature]);

  async function handleUpgrade() {
    setError(null);
    setBusy(true);
    try {
      trackEvent("upgrade_button_clicked", { source: "credit_limit_reached" });
      const { checkout_url } = await apiFetchJson<CheckoutResponse>("/api/subscription/checkout", {
        method: "POST",
      });
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar checkout");
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="size-6 text-primary" aria-hidden="true" />
        </div>

        <div>
          <p className="font-medium">Suas 3 otimizações grátis acabaram</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assine o Premium pra continuar otimizando currículos e desbloquear:
          </p>
        </div>

        <ul className="space-y-1.5 text-left">
          {PREMIUM_LOCKED_FEATURES.map((label) => (
            <li key={label} className="flex items-start gap-2 text-sm">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="button" onClick={handleUpgrade} disabled={busy} className="gap-2">
          {busy ? "Redirecionando…" : "Assinar Premium"}
        </Button>
      </CardContent>
    </Card>
  );
}
