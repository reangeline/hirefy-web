import { defineRouting } from "next-intl/routing";

// pt sem prefixo (preserva todas as URLs já indexadas — hirefy sempre foi só PT até aqui);
// en/es ganham prefixo (/en/..., /es/...). Sem detecção automática por Accept-Language: o
// mercado atual é PT, um visitante com o navegador em inglês não deve ser desviado do
// conteúdo padrão sem escolher isso explicitamente no seletor de idioma (spec 021).
export const routing = defineRouting({
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
