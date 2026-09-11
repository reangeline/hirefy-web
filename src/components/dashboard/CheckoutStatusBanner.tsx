"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Mensagem de retorno do Stripe Checkout hospedado (?checkout=success|cancelled, ver
// payment_gateway_impl.go:CreateCheckoutSession). SubscriptionCard já busca o estado atual
// da assinatura por conta própria — aqui só confirmamos o resultado do redirect pro usuário.
export function CheckoutStatusBanner() {
  return (
    <Suspense>
      <CheckoutStatusBannerInner />
    </Suspense>
  );
}

function CheckoutStatusBannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  useEffect(() => {
    if (checkout === "success") trackEvent("checkout_completed");
    if (checkout === "cancelled") trackEvent("checkout_cancelled");
  }, [checkout]);

  if (checkout !== "success" && checkout !== "cancelled") return null;

  function dismiss() {
    router.replace("/dashboard");
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        checkout === "success"
          ? "flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          : "flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      }
    >
      <span>
        {checkout === "success"
          ? "Assinatura Premium ativada! Pode levar alguns segundos para refletir abaixo."
          : "Checkout cancelado — nenhuma cobrança foi feita."}
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-4 shrink-0 cursor-pointer text-xs underline-offset-4 hover:underline"
      >
        Fechar
      </button>
    </div>
  );
}
