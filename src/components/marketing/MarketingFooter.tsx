import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Privacidade", href: "https://hirefy.careers/privacy" },
  { label: "Termos", href: "https://hirefy.careers/terms" },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            hirefy
          </Link>
          <p className="text-sm text-background/60">© {year} Hirefy</p>
        </div>

        <div className="flex items-center gap-6 text-sm text-background/60">
          {LEGAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-background">
              {link.label}
            </a>
          ))}
          <a href="mailto:contact@hirefy.careers" className="hover:text-background">
            contact@hirefy.careers
          </a>
        </div>
      </div>
    </footer>
  );
}
