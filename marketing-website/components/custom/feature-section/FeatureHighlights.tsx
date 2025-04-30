import React from 'react';
import { motion } from 'framer-motion';
import {
    Layers,
    Layout,
    Plug,
    BrainCircuit,
    PanelRight,
    ShieldCheck
} from 'lucide-react';
import ContentContainer from '@/layouts/ContentContainer';
import GridCell from "../shared/GridCell";

export const FeatureHighlights: React.FC = () => {
    const features = [
        {
            icon: <Layers className="w-6 h-6 text-blue-accent" />,
            title: "Multiple Environments",
            description: "Switch between different work environments tailored to specific roles and projects."
        },
        {
            icon: <Layout className="w-6 h-6 text-blue-accent" />,
            title: "Customizable Interface",
            description: "Personalize your workspace layout to match your workflow and preferences."
        },
        {
            icon: <Plug className="w-6 h-6 text-blue-accent" />,
            title: "Third-Party Integration",
            description: "Connect your favorite tools and services for a seamless experience."
        },
        {
            icon: <BrainCircuit className="w-6 h-6 text-blue-accent" />,
            title: "AI-Powered Features",
            description: "Intelligent assistance to help you work smarter and more efficiently."
        },
        {
            icon: <PanelRight className="w-6 h-6 text-blue-accent" />,
            title: "Tab-Based Interface",
            description: "Organize your work in tabs for quick access and better multitasking."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-blue-accent" />,
            title: "Secure Workspace",
            description: "Your data is protected with end-to-end encryption and strict access controls."
        }
    ];

    return (
        <section className="py-24 bg-background">
            <ContentContainer>
                {/* Title Section */}
                <div className="relative mx-auto mb-16 max-w-2xl text-center">
                    <motion.h2
                        className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Why Choose FusionSpace?
                    </motion.h2>
                    <motion.p
                        className="mt-4 text-lg text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        A revolutionary approach to workspace management that adapts to your needs
                    </motion.p>

                    {/* Background Effect */}
                    <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-accent/5 blur-3xl" />
                </div>

                {/* Features Grid */}
                <div className="relative mb-8">
                    {/* Grid Background Pattern */}
                    <div className="absolute inset-0 grid grid-cols-1 gap-8 pointer-events-none md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="border border-blue-accent/5 rounded-2xl backdrop-blur-sm"
                            />
                        ))}
                    </div>

                    {/* Content Grid */}
                    <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
                            >
                                <GridCell
                                    hasMarker={true}
                                    markerPosition={index % 2 === 0 ? 'top-left' : 'bottom-right'}
                                    className="h-full backdrop-blur-sm"
                                >
                                    <div className="flex h-full flex-col rounded-xl bg-white/50 p-6 transition-all duration-300 hover:bg-white/80 dark:bg-gray-900/50 dark:hover:bg-gray-900/80">
                                        <div className="flex-1">
                                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-accent/10">
                                                {feature.icon}
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold text-foreground">
                                                {feature.title}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </GridCell>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </ContentContainer>
        </section>
    );
};

export default FeatureHighlights;