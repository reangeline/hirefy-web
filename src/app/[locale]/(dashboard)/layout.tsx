import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { DashboardThemeProvider } from "@/components/dashboard-theme-provider";

export default function DashboardGroupLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    // Tema independente do da Home: a área logada abre escura por padrão (mais confortável
    // pra uso prolongado), com sua própria chave de localStorage — o toggle da Home continua
    // seguindo o sistema, sem afetar nem ser afetado por essa escolha. next-themes não
    // suporta providers aninhados de verdade (um dentro do outro simplesmente reusa o
    // contexto do pai), por isso o provider aqui é próprio — ver dashboard-theme-provider.tsx.
    <DashboardThemeProvider>
      <SidebarProvider>
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </SidebarProvider>
    </DashboardThemeProvider>
  );
}
