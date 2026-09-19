"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Troca de idioma preservando a rota atual (inclusive com params dinâmicos, tipo /resume/123)
 * — usado no MarketingNavbar e no Topbar da área logada (spec 021). Sem `pathnames`
 * configurado no routing (mesma estrutura de path nos 3 idiomas, só prefixo muda), então
 * `usePathname()` já devolve o caminho resolvido (sem o prefixo de locale, com os valores
 * reais dos params) — não precisa de `params` separado no replace. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common.localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  // Base UI Select mostra o value cru no trigger fechado se não souber mapear valor → label
  // (mesmo bug já encontrado e corrigido no Select de estágio do pipeline) — items resolve.
  const items = Object.fromEntries(routing.locales.map((loc) => [loc, t(loc)]));

  return (
    <Select
      items={items}
      value={locale}
      onValueChange={(next) => {
        if (!next) return;
        router.replace(pathname ?? "/", { locale: next as (typeof routing.locales)[number] });
      }}
    >
      <SelectTrigger aria-label={t("label")} className="w-auto gap-1.5 border-none shadow-none">
        <Globe className="size-4" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {t(loc)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
