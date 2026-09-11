"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetchJson } from "@/lib/api/client";
import { setUserProperty, trackEvent } from "@/lib/analytics";
import type { SubscriptionResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckoutResponse {
  checkout_url: string;
}

const PLAN_LABELS: Record<SubscriptionResponse["plan"], string> = {
  free: "Plano Free",
  basic: "Plano Basic",
  premium: "Premium",
};

interface SubscriptionCardProps {
  /** "sm" — versão compacta pro rodapé da sidebar (spec 006), sem ícone/descrição longa. */
  size?: "default" | "sm";
}

export function SubscriptionCard({ size = "default" }: SubscriptionCardProps) {
  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetchJson<SubscriptionResponse>("/api/subscription")
      .then((data) => {
        setSub(data);
        setUserProperty("subscription_tier", data.plan);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleUpgrade() {
    setActionError(null);
    setBusy(true);
    try {
      trackEvent("upgrade_button_clicked");
      const { checkout_url } = await apiFetchJson<CheckoutResponse>("/api/subscription/checkout", {
        method: "POST",
      });
      window.location.href = checkout_url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Falha ao iniciar checkout");
      setBusy(false);
    }
  }

  async function handleCancel() {
    setActionError(null);
    setBusy(true);
    try {
      await apiFetchJson<SubscriptionResponse>("/api/subscription", { method: "DELETE" });
      trackEvent("subscription_cancelled");
      const refreshed = await apiFetchJson<SubscriptionResponse>("/api/subscription");
      setSub(refreshed);
      setUserProperty("subscription_tier", refreshed.plan);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Falha ao cancelar assinatura");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Card size={size}>
        <CardContent>
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            Falha ao carregar assinatura: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sub) {
    return (
      <Card size={size}>
        <CardContent>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando assinatura…
          </p>
        </CardContent>
      </Card>
    );
  }

  // `is_active` não existe no JSON do backend (é um método Go, não um campo serializado) —
  // calculamos aqui. Ver .spec/004-dashboard-home/spec.md.
  const isPremium = sub.plan !== "free" && sub.status === "active";
  const credits = sub.credits ?? 0;
  // `plan` fica "premium" mesmo depois de cancelar (é o histórico do que a conta já teve —
  // ver Subscription.Cancel() no backend, que só muda o status). O rótulo mostrado usa o
  // estado efetivo, senão a UI mostraria "Premium" junto com créditos/botão de upgrade.
  const planLabel = isPremium ? PLAN_LABELS[sub.plan] : PLAN_LABELS.free;

  if (size === "sm") {
    return (
      <Card size="sm">
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-semibold">{planLabel}</span>
          </div>
          {!isPremium && (
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Créditos</span>
              <span className="font-mono text-foreground">{credits}</span>
            </div>
          )}
          {actionError && (
            <p role="alert" aria-live="polite" className="text-[11px] text-destructive">
              {actionError}
            </p>
          )}
          {isPremium ? (
            <Button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {busy ? "Cancelando…" : "Cancelar assinatura"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleUpgrade}
              disabled={busy}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {busy ? "Redirecionando…" : "Fazer upgrade"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          {planLabel}
        </CardTitle>
        <Badge variant={isPremium ? "default" : "secondary"}>
          {credits} {credits === 1 ? "crédito" : "créditos"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Prática de entrevista e coach de pipeline ilimitados."
            : credits === 1
              ? "1 consulta de IA disponível pra prática de entrevista e coach."
              : credits > 1
                ? `${credits} consultas de IA disponíveis pra prática de entrevista e coach.`
                : "Sem consultas de IA disponíveis no momento pra prática de entrevista e coach."}
        </p>

        {actionError && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {actionError}
          </p>
        )}

        {isPremium ? (
          <Button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {busy ? "Cancelando…" : "Cancelar assinatura"}
          </Button>
        ) : (
          <Button type="button" onClick={handleUpgrade} disabled={busy} className="w-full sm:w-auto">
            {busy ? "Redirecionando…" : "Fazer upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
