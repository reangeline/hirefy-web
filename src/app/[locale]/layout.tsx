import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { AnalyticsPageview } from "@/components/AnalyticsPageview";
import { routing } from "@/i18n/routing";

// Mesma fonte do app mobile (AppTheme, GoogleFonts.inter) e da landing page.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Dados/números (créditos, score de ATS, datas) — sinal visual de ferramenta técnica,
// spec 006.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Common" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Habilita renderização estática por locale (recomendação do next-intl) — precisa vir
  // antes de qualquer uso de useTranslations/getTranslations na árvore.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AnalyticsPageview />
            {children}
            <CookieConsentBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
