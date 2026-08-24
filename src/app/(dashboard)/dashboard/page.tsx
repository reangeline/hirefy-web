import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { ThemeToggle } from "@/components/theme-toggle";
import { PipelineSection } from "@/components/pipeline/PipelineSection";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-12">
      <div className="flex items-center justify-end gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <WelcomeHeader />
        <SubscriptionCard />
        <Link href="/resume">
          <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto">
            <FileText className="size-4" aria-hidden="true" />
            Meus currículos
          </Button>
        </Link>
      </div>
      <PipelineSection />
    </div>
  );
}
