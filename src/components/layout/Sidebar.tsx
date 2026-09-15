"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FileText, LayoutDashboard, ScanSearch, type LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

interface NavSubItem {
  href: string;
  label: string;
}

interface NavSection {
  href: string;
  label: string;
  icon: LucideIcon;
  // Prefixos extras que também contam como "essa seção está ativa" — ex: /pipeline/* é
  // conceitualmente parte do Dashboard (o board vive embutido lá, spec 005), mas não
  // compartilha o prefixo /dashboard.
  matchPrefixes: string[];
  items: NavSubItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard", "/pipeline"],
    items: [
      { href: "/pipeline/new", label: "Nova candidatura" },
      { href: "/pipeline/archived", label: "Arquivadas" },
    ],
  },
  {
    href: "/resume",
    label: "Currículos",
    icon: FileText,
    matchPrefixes: ["/resume"],
    items: [{ href: "/resume/new", label: "Novo currículo" }],
  },
  {
    href: "/linkedin",
    label: "LinkedIn",
    icon: ScanSearch,
    matchPrefixes: ["/linkedin"],
    items: [
      { href: "/linkedin/fill", label: "Guia de preenchimento" },
      { href: "/linkedin/posts", label: "Ideias de publicação" },
    ],
  },
];

function NavSectionRow({ section, pathname, onNavigate }: { section: NavSection; pathname: string; onNavigate: () => void }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;
  const sectionActive = section.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const hasSubItems = section.items.length > 0;

  const link = (
    <Link
      href={section.href}
      onClick={onNavigate}
      className={cn(
        "flex flex-1 items-center gap-2.5 rounded px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        sectionActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
      )}
    >
      <Icon className="size-[15px]" aria-hidden="true" />
      {section.label}
    </Link>
  );

  if (!hasSubItems) {
    return link;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-0.5">
        {link}
        <CollapsibleTrigger
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={open ? `Recolher ${section.label}` : `Expandir ${section.label}`}
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 py-0.5 pl-7">
          {section.items.map((item) => {
            const itemActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "rounded px-2 py-1 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  itemActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Abaixo de md a sidebar é um drawer — em telas estreitas ela não cabe fixa ao lado
          do conteúdo sem espremer tudo (achado ao testar em telas pequenas). */}
      {isOpen && (
        <div
          role="presentation"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4 transition-transform duration-200 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/dashboard" onClick={close} className="flex items-center gap-2 px-2 pb-4">
          <span className="flex size-5 items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
            Hf
          </span>
          <span className="text-[13.5px] font-semibold tracking-tight">Hirefy</span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV_SECTIONS.map((section) => (
            <NavSectionRow key={section.href} section={section} pathname={pathname} onNavigate={close} />
          ))}
        </nav>

        <div className="mt-auto border-t border-border pt-3">
          <SubscriptionCard size="sm" />
        </div>
      </aside>
    </>
  );
}
