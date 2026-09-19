"use client";

import { useTranslations } from "next-intl";
import { MailWarning } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

interface EmailVerificationBannerProps {
  email: string;
}

// Componente puramente apresentacional (sem chamada de API própria), mas só é usado a partir
// do WelcomeHeader ("use client") — importar um Server Component ali quebraria em runtime
// (next-intl/server exige contexto de servidor indisponível no bundle do client). Por isso
// "use client" + useTranslations aqui, mesmo sem outro motivo de interatividade (spec 021).
export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const t = useTranslations("Dashboard.emailVerification");

  return (
    <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <MailWarning className="size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Link
        href={`/signup/confirm?email=${encodeURIComponent(email)}`}
        className={buttonVariants({ size: "sm" })}
      >
        {t("cta")}
      </Link>
    </div>
  );
}
