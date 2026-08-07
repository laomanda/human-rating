import { LandingHeader } from "@/components/marketing/landing-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { MetricsBar } from "@/components/marketing/metrics-bar";
import { BentoFeatures } from "@/components/marketing/bento-features";
import { ValueProposition } from "@/components/marketing/value-proposition";
import { RatingSimulator } from "@/components/marketing/rating-simulator";
import { CommunityPreview } from "@/components/marketing/community-preview";
import { SocialProof } from "@/components/marketing/social-proof";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <MetricsBar />
        <BentoFeatures />
        <ValueProposition />
        <RatingSimulator />
        <CommunityPreview />
        <SocialProof />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
