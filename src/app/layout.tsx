import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { AnalyticsPageview } from "@/components/AnalyticsPageview";

// Mesma fonte do app mobile (AppTheme, GoogleFonts.inter) e da landing page.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Substituto gratuito de "Signifier" (paga) pro redesign Steep — o próprio DESIGN.md cita
// Source Serif 4 como alternativa válida pra títulos/display (spec 020).
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

// Dados/números (créditos, score de ATS, datas) — sinal visual de ferramenta técnica,
// spec 006.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hirefy",
  description: "Otimize seu currículo com IA para passar em ATS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsPageview />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
