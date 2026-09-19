import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/layout/Topbar";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { CheckoutStatusBanner } from "@/components/dashboard/CheckoutStatusBanner";
import { PipelineSection } from "@/components/pipeline/PipelineSection";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard.topbarTitles");

  return (
    <>
      <Topbar title={t("dashboard")} />
      <div className="space-y-6 p-6">
        <CheckoutStatusBanner />
        <WelcomeHeader />
        <PipelineSection />
      </div>
    </>
  );
}
