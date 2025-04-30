"use client"

import FAQSummaryAccordion from "@/components/custom/faq/FAQSummaryAccordion";
import FeatureSummary from "@/components/custom/feature/FeatureSummary";
import FoundationsSection from "@/components/custom/foundation/FoundationsSection";
import HeroSection from "@/components/custom/hero-section/HeroSection";
import StatsSection from "@/components/custom/stats/StatsSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeatureSummary />
      <FoundationsSection />
      <FAQSummaryAccordion/>
    </>
  );
}
