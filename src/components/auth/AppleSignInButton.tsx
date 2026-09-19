"use client";

import Script from "next/script";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

interface AppleSignInButtonProps {
  onCredential: (idToken: string, name?: string) => void;
  disabled?: boolean;
}

// Sign in with Apple JS exige domínio HTTPS verificado no Apple Developer (Services ID +
// Return URL) — não funciona em localhost. Ver .spec/001-auth/spec.md.
export function AppleSignInButton({ onCredential, disabled }: AppleSignInButtonProps) {
  const t = useTranslations("Auth.social");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.AppleID) return;
    setLoading(true);

    try {
      const result = await window.AppleID.auth.signIn();
      const name = result.user?.name
        ? [result.user.name.firstName, result.user.name.lastName].filter(Boolean).join(" ")
        : undefined;
      onCredential(result.authorization.id_token, name);
    } catch {
      // Usuário cancelou o popup ou o SDK falhou — sem tratamento especial, o botão volta
      // ao estado normal e o usuário pode tentar de novo.
    } finally {
      setLoading(false);
    }
  }

  if (!CLIENT_ID) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className="w-full"
        title={t("appleConfigPending")}
      >
        <AppleIcon />
        {t("appleContinue")}
      </Button>
    );
  }

  return (
    <>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.AppleID?.auth.init({
            clientId: CLIENT_ID!,
            scope: "name email",
            redirectURI: typeof window !== "undefined" ? window.location.origin : "",
            usePopup: true,
          });
          setReady(true);
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || !ready || loading}
        className="w-full"
      >
        <AppleIcon />
        {loading ? t("appleConnecting") : t("appleContinue")}
      </Button>
    </>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.87-.13 1.72-.85 3.11-.8 1.68.14 2.94.85 3.71 2.14-2.87 1.74-2.34 5.86.48 7.02-.46 1.35-1.08 2.7-2.38 3.81zM12.03 7.25c-.15-2.23 1.66-4.09 3.74-4.25.29 2.38-2.14 4.15-3.74 4.25z" />
    </svg>
  );
}
