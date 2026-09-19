import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// Mensagens divididas por domínio (um arquivo por namespace por idioma) em vez de um só JSON
// gigante por idioma — permite trabalhar em áreas diferentes do site em paralelo sem dois
// processos escreverem no mesmo arquivo (spec 021). Mesclado aqui sob chaves top-level que
// batem com o namespace passado pra useTranslations/getTranslations em cada componente.
const NAMESPACES = ["common", "marketing", "auth", "dashboard", "resume", "pipeline", "linkedin"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const modules = await Promise.all(
    NAMESPACES.map((namespace) => import(`../messages/${locale}/${namespace}.json`)),
  );

  const messages = Object.fromEntries(
    NAMESPACES.map((namespace, i) => [
      namespace.charAt(0).toUpperCase() + namespace.slice(1),
      modules[i].default,
    ]),
  );

  return { locale, messages };
});
