import { SiteHeader, SiteFooter } from "@/components/common/site-shell";
import HeroSection from "./hero-section";
import StartingPointsSection from "./starting-points-section";
import HowItWorksSection from "./how-it-works-section";
import CallToActionSection from "./call-to-action-section";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="text-sm">
        <div className="flex flex-col w-full">
          <HeroSection />
          <StartingPointsSection />
          <HowItWorksSection />
          <CallToActionSection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
