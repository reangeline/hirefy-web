import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// Mensagens divididas por domínio (um arquivo por namespace por idioma) em vez de um só JSON
// gigante por idioma — permite trabalhar em áreas diferentes do site em paralelo sem dois
// processos escreverem no mesmo arquivo (spec 021). Mapeamento explícito (não
// auto-capitalize) porque "linkedin" → "LinkedIn" tem duas maiúsculas — um `capitalize()`
// ingênuo gera "Linkedin" e quebra toda chamada `useTranslations("LinkedIn")` em runtime.
const NAMESPACE_KEYS = {
  common: "Common",
  marketing: "Marketing",
  auth: "Auth",
  dashboard: "Dashboard",
  resume: "Resume",
  pipeline: "Pipeline",
  linkedin: "LinkedIn",
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const entries = Object.entries(NAMESPACE_KEYS) as [keyof typeof NAMESPACE_KEYS, string][];
  const modules = await Promise.all(
    entries.map(([file]) => import(`../messages/${locale}/${file}.json`)),
  );

  const messages = Object.fromEntries(
    entries.map(([, key], i) => [key, modules[i].default]),
  );

  return { locale, messages };
});
