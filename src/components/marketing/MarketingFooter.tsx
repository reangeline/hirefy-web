import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function MarketingFooter() {
  const t = await getTranslations("Marketing.footer");
  const year = new Date().getFullYear();

  const LEGAL_LINKS = [
    { label: t("linkPrivacy"), href: "/privacy" },
    { label: t("linkTerms"), href: "/terms" },
    { label: t("linkCookies"), href: "/cookies" },
    { label: t("linkRefund"), href: "/refund" },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            {t("brand")}
          </Link>
          <p className="text-sm text-background/60">{t("copyright", { year })}</p>
        </div>

        <div className="flex items-center gap-6 text-sm text-background/60">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-background">
              {link.label}
            </Link>
          ))}
          <a href={`mailto:${t("email")}`} className="hover:text-background">
            {t("email")}
          </a>
        </div>
      </div>
    </footer>
  );
}
