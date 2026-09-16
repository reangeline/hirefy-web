"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

/** Mesmo desenho do ThemeToggle da Home, mas ligado ao tema independente da área logada
 * (ver dashboard-theme-provider.tsx) — trocar aqui não afeta a Home, e vice-versa. */
export function DashboardThemeToggle() {
  const { theme, setTheme } = useDashboardTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
