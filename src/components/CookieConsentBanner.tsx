"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent, subscribeConsent, type ConsentValue } from "@/lib/analytics";

function getServerSnapshot(): ConsentValue | null {
  return null;
}

export function CookieConsentBanner() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerSnapshot);

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies essenciais e, com sua permissão, cookies de analytics pra entender
          como o Hirefy é usado.{" "}
          <a
            href="https://hirefy.careers/cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Saiba mais
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setConsent("declined")}>
            Recusar
          </Button>
          <Button type="button" size="sm" onClick={() => setConsent("accepted")}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
