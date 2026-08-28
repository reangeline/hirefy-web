"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard } from "lucide-react";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Currículos", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 pb-4">
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
  );
}
