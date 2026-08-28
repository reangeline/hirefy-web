import { Topbar } from "@/components/layout/Topbar";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { CheckoutStatusBanner } from "@/components/dashboard/CheckoutStatusBanner";
import { PipelineSection } from "@/components/pipeline/PipelineSection";

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />
      <div className="space-y-6 p-6">
        <CheckoutStatusBanner />
        <WelcomeHeader />
        <PipelineSection />
      </div>
    </>
  );
}
