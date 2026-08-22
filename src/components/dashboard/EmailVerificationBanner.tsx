import Link from "next/link";
import { MailWarning } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <MailWarning className="size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium">Confirme seu email</p>
        <p className="text-sm text-muted-foreground">
          Verifique sua caixa de entrada pra desbloquear todos os recursos.
        </p>
      </div>
      <Link
        href={`/signup/confirm?email=${encodeURIComponent(email)}`}
        className={buttonVariants({ size: "sm" })}
      >
        Confirmar
      </Link>
    </div>
  );
}
