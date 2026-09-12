"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, ScanSearch } from "lucide-react";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Currículos", icon: FileText },
  { href: "/linkedin", label: "LinkedIn", icon: ScanSearch },
];

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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center gap-2.5 rounded px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Icon className="size-[15px]" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-3">
          <SubscriptionCard size="sm" />
        </div>
      </aside>
    </>
  );
}
