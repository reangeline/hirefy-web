"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { DashboardThemeToggle } from "@/components/dashboard-theme-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/sidebar-context";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { toggle } = useSidebar();

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-[13.5px] font-semibold">{title}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <DashboardThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
