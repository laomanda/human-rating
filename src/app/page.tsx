import { LandingHeader } from "@/components/marketing/landing-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { MetricsBar } from "@/components/marketing/metrics-bar";
import { BentoFeatures } from "@/components/marketing/bento-features";
import { RatingSimulator } from "@/components/marketing/rating-simulator";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <MetricsBar />
        <BentoFeatures />
        <RatingSimulator />
      </main>
      <LandingFooter />
    </div>
  );
}
