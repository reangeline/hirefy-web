import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-12">
      <div className="flex items-center justify-end gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
      <WelcomeHeader />
      <SubscriptionCard />
    </div>
  );
}
