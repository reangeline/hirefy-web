"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

interface SubscriptionCardProps {
  /** "sm" — versão compacta pro rodapé da sidebar (spec 006), sem ícone/descrição longa. */
  size?: "default" | "sm";
}

export function SubscriptionCard({ size = "default" }: SubscriptionCardProps) {
  const t = useTranslations("Dashboard.subscriptionCard");
  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const PLAN_LABELS: Record<SubscriptionResponse["plan"], string> = {
    free: t("planLabels.free"),
    basic: t("planLabels.basic"),
    premium: t("planLabels.premium"),
  };

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
      setActionError(err instanceof Error ? err.message : t("checkoutError"));
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
      setActionError(err instanceof Error ? err.message : t("cancelError"));
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Card size={size}>
        <CardContent>
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {t("loadError", { error })}
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
            {t("loading")}
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
              <span>{t("creditsLabel")}</span>
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
              {busy ? t("cancelling") : t("cancelSubscription")}
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
              {busy ? t("redirecting") : t("upgrade")}
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
          {t("credits", { count: credits })}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isPremium ? t("premiumDescription") : t("creditsAvailable", { count: credits })}
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
            {busy ? t("cancelling") : t("cancelSubscription")}
          </Button>
        ) : (
          <Button type="button" onClick={handleUpgrade} disabled={busy} className="w-full sm:w-auto">
            {busy ? t("redirecting") : t("upgrade")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
