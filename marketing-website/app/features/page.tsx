"use client"

import { CTAUseProduct } from "@/components/custom/cta/CTAUseProduct";
import { AIFeatures } from "@/components/custom/feature-section/AIFeatures";
import { CustomizableInterface } from "@/components/custom/feature-section/CustomizableInterface";
import { EnvironmentSwitcher } from "@/components/custom/feature-section/EnvironmentSwitcher";
import { InterfaceOverview } from "@/components/custom/feature-section/InterfaceOverview";
import { TabLayout } from "@/components/custom/feature-section/TabLayout";
import { ThirdPartyIntegration } from "@/components/custom/feature-section/ThirdPartyIntegration";
import { WorkspaceSelection } from "@/components/custom/feature-section/WorkspaceSelection";
import FeaturesHeroSection from "@/components/custom/hero-section/FeaturesHeroSection";
import PageLayout from "@/layouts/PageLayout";

export default function Feature() {
  return (
    <PageLayout>
      <FeaturesHeroSection />
      <InterfaceOverview />
      <EnvironmentSwitcher />
      <WorkspaceSelection />
      <CustomizableInterface />
      <TabLayout />
      <ThirdPartyIntegration />
      <AIFeatures />
      <CTAUseProduct />
    </PageLayout>
  );
}