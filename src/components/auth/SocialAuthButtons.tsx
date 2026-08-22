"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppleSignInButton } from "@/components/auth/AppleSignInButton";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface SocialAuthButtonsProps {
  redirectTo?: string;
}

// Usado em /login e /signup — Cognito social login cria a conta no primeiro acesso e loga
// nas vezes seguintes, então não existe distinção "signup social" vs "login social" aqui
// (mesmo comportamento do mobile, ver auth_service.dart: signInWithSocial).
export function SocialAuthButtons({ redirectTo = "/dashboard" }: SocialAuthButtonsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(provider: "google" | "apple", idToken: string, name?: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, id_token: idToken, name }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.message ?? body.error ?? "Não foi possível continuar.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <GoogleSignInButton
          disabled={loading}
          onCredential={(idToken) => submit("google", idToken)}
        />
        <AppleSignInButton
          disabled={loading}
          onCredential={(idToken, name) => submit("apple", idToken, name)}
        />
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
