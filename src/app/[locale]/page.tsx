import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Hero } from "@/components/marketing/Hero";
import { Problem } from "@/components/marketing/Problem";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingGradientBackdrop } from "@/components/marketing/MarketingGradientBackdrop";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <div className="relative">
          <MarketingGradientBackdrop />
          <Hero />
          <Problem />
          <Features />
        </div>
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
