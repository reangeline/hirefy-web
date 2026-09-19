import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: string;
}

// Estilização do conteúdo do markdown via classes utilitárias direto no wrapper — não há
// plugin de tipografia do Tailwind instalado no web-app, e não vale a pena adicionar um só
// pra 4 páginas de texto legal.
export async function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const t = await getTranslations("Marketing.legal");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("backToHome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdatedLabel", { date: lastUpdated })}</p>

        <div
          className="mt-8 space-y-4 text-sm leading-relaxed text-foreground
            [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold
            [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold
            [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold
            [&_p]:text-muted-foreground
            [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground
            [&_li]:marker:text-muted-foreground
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_a]:text-primary [&_a]:underline
            [&_table]:w-full [&_table]:border-collapse [&_table]:text-left
            [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-4 [&_th]:font-semibold
            [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:pr-4 [&_td]:text-muted-foreground"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <Link href="/privacy" className="hover:text-foreground">
            {t("footerPrivacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("footerTerms")}
          </Link>
          <Link href="/refund" className="hover:text-foreground">
            {t("footerRefund")}
          </Link>
          <Link href="/cookies" className="hover:text-foreground">
            {t("footerCookies")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
