"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";

interface Me {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

// Prova o loop de auth ponta a ponta: chama /api/me via apiFetchJson, que passa por
// lib/api/client.ts — se o access_token tiver expirado, o 401 dispara refresh automático
// (single-flight) e a chamada é reenviada, sem derrubar o usuário.
export function MeCard() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Me>("/api/me")
      .then(setMe)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p role="alert" aria-live="polite" className="text-sm text-destructive">
        Falha ao carregar perfil: {error}
      </p>
    );
  }

  if (!me) {
    return (
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Carregando perfil…
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="text-sm">
        <p>
          <span className="text-muted-foreground">Nome:</span> {me.name}
        </p>
        <p>
          <span className="text-muted-foreground">Email:</span> {me.email}{" "}
          {me.email_verified ? (
            <span aria-hidden="true">✓</span>
          ) : (
            <span>(não confirmado)</span>
          )}
          <span className="sr-only">
            {me.email_verified ? " — email confirmado" : " — email não confirmado"}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
