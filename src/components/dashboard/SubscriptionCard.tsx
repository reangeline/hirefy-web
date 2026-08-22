"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetchJson } from "@/lib/api/client";
import type { SubscriptionResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAN_LABELS: Record<SubscriptionResponse["plan"], string> = {
  free: "Plano Free",
  basic: "Plano Basic",
  premium: "Premium",
};

export function SubscriptionCard() {
  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<SubscriptionResponse>("/api/subscription")
      .then(setSub)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card>
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
      <Card>
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          {PLAN_LABELS[sub.plan]}
        </CardTitle>
        <Badge variant={isPremium ? "default" : "secondary"}>
          {credits} {credits === 1 ? "crédito" : "créditos"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Otimizações ilimitadas e recursos premium ativos."
            : credits === 1
              ? "1 otimização disponível."
              : credits > 1
                ? `${credits} otimizações disponíveis.`
                : "Sem otimizações disponíveis no momento."}
        </p>

        {!isPremium && (
          <Button type="button" disabled title="Em breve" className="w-full sm:w-auto">
            Fazer upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
