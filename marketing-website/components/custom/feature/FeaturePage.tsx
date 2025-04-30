import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Layout, Puzzle, Cpu, Users, Shield, Palette } from 'lucide-react';
import ContentContainer from '@/layouts/ContentContainer';
import PageLayout from '@/layouts/PageLayout';

// Type for icon component that matches Lucide icons structure
type IconComponent = React.ComponentType<{
  className?: string;
  size?: number | string;
  color?: string;
}>;

interface FeatureDetail {
  icon: IconComponent;
  title: string;
  description: string;
  details: string[];
}

interface FeatureSectionProps extends FeatureDetail {
  icon: IconComponent;
  title: string;
  description: string;
  details: string[];
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  details 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <motion.div 
      className="w-full p-6 mb-6 rounded-lg bg-card hover:bg-card-hover border border-border"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-blue-accent/10">
            <Icon className="w-6 h-6 text-blue-accent" />
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>
      
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pt-4 mt-4 border-t border-border">
          <p className="text-muted-foreground mb-4">{description}</p>
          <ul className="space-y-2">
            {details.map((detail, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-accent" />
                <span className="text-sm">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FeaturesPage: React.FC = () => {
  const features: FeatureDetail[] = [
    {
      icon: Layout,
      title: "Customizable Environments",
      description: "Create personalized workspaces tailored to your specific needs and workflows.",
      details: [
        "Role-specific interfaces and tools",
        "Customizable layouts and components",
        "Multiple derived environments",
        "Isolated workspaces for different projects"
      ]
    },
    {
      icon: Puzzle,
      title: "Third-Party Integration",
      description: "Seamlessly connect and integrate with your favorite tools and services.",
      details: [
        "Support for popular productivity tools",
        "API integration capabilities",
        "Custom interface for third-party apps",
        "Unified workflow management"
      ]
    },
    {
      icon: Cpu,
      title: "AI-Powered Features",
      description: "Leverage artificial intelligence to enhance productivity and streamline tasks.",
      details: [
        "Smart content summarization",
        "Intelligent question generation",
        "Context-aware assistance",
        "Automated workflow suggestions"
      ]
    },
    {
      icon: Users,
      title: "Real-Time Collaboration",
      description: "Work together with team members in real-time with advanced collaboration tools.",
      details: [
        "Live document editing",
        "Video and voice calls",
        "Team chat and messaging",
        "Screen sharing capabilities"
      ]
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Enterprise-grade security features to protect your data and communications.",
      details: [
        "End-to-end encryption",
        "Role-based access control",
        "Secure file sharing",
        "Data isolation between environments"
      ]
    },
    {
      icon: Palette,
      title: "Modern Interface",
      description: "A clean, intuitive interface designed for productivity and ease of use.",
      details: [
        "Dark and light themes",
        "Customizable UI components",
        "Responsive design",
        "Accessibility features"
      ]
    }
  ];

  return (
    <PageLayout fullHeight>
      <ContentContainer className="py-16">
        <div className="text-center mb-16">
          <h1 className="mb-6">Powerful Features for Modern Workspaces</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the tools and capabilities that make FusionSpace the ultimate workspace solution for students and professionals.
          </p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <FeatureSection key={index} {...feature} />
          ))}
        </div>
      </ContentContainer>
    </PageLayout>
  );
};

export default FeaturesPage;