"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "hirefy-dashboard-theme";
const CHANGE_EVENT = "hirefy-dashboard-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): Theme {
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage indisponível (modo privado etc.) — a escolha só não persiste entre sessões.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const DashboardThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

/** Tema da área logada — independente do provider da Home (next-themes não suporta providers
 * aninhados de verdade: um `<ThemeProvider>` dentro de outro simplesmente ignora suas props e
 * reusa o contexto do pai). Chave de localStorage própria, abre escuro por padrão (mais
 * confortável pra uso prolongado). `useSyncExternalStore` evita mismatch de hidratação sem
 * precisar de um script bloqueante — mesmo padrão já usado em theme-toggle.tsx e
 * use-reduced-motion.ts. */
export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme: setStoredTheme }}>
      <div className={cn(theme, "flex min-h-screen bg-background text-foreground")}>{children}</div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme deve ser usado dentro de DashboardThemeProvider");
  }
  return ctx;
}
