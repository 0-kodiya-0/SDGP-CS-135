"use client";

import { Feature } from '@/components/custom/about/about.types';
import { AboutFeatureCard } from '@/components/custom/about/AboutFeatureCard';
import { SectionTitle } from '@/components/custom/about/SectionTitle';
import { TeamMarquee } from '@/components/custom/about/TeamMarquee';
import { Timeline } from '@/components/custom/about/TimelineItem';
import { VisionSection } from '@/components/custom/about/VisionSection';

import { containerVariants } from '@/lib/animationConstants';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Palette, Database, Cpu, Users } from 'lucide-react';


export const features: Feature[] = [
  { 
    icon: <GraduationCap className="h-8 w-8" />, 
    title: "Education Focus", 
    description: "Empowering academic success with specialized tools." 
  },
  { 
    icon: <Briefcase className="h-8 w-8" />, 
    title: "Task Isolation", 
    description: "Organize tasks effectively and minimize distractions." 
  },
  { 
    icon: <Palette className="h-8 w-8" />, 
    title: "Intuitive UI", 
    description: "User-friendly design for seamless navigation." 
  },
  { 
    icon: <Database className="h-8 w-8" />, 
    title: "Secure Storage", 
    description: "Keep your data safe with state-of-the-art security." 
  },
  { 
    icon: <Cpu className="h-8 w-8" />, 
    title: "AI Integration", 
    description: "Advanced AI tools for smarter productivity." 
  },
  { 
    icon: <Users className="h-8 w-8" />, 
    title: "Collaboration", 
    description: "Connect and work together effortlessly." 
  }
];

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.section 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-6 md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
            About FusionSpace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            We're building the future of digital workspaces, making it easier for students 
            to manage their academic life and collaborate effectively.
          </p>
        </motion.section>

        {/* Features Grid */}
        <section className="mb-20">
          <SectionTitle title="Key Features" />
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <AboutFeatureCard key={index} feature={feature} />
            ))}
          </motion.div>
        </section>

        {/* Timeline Section */}
        <Timeline/>

        {/* Vision Section */}
        <VisionSection />

        {/* Team Section */}
        <TeamMarquee />
      </div>
    </main>
  );
}
