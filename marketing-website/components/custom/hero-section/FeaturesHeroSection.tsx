"use client"

import React from 'react';
import { motion } from 'framer-motion';
import ContentContainer from '@/layouts/ContentContainer';
import TypewriterText from '../shared/TypewriterText';

interface FeaturesHeroProps {
    className?: string;
}

const FeaturesHeroSection: React.FC<FeaturesHeroProps> = ({ className = '' }) => {
    const typingMessages = [
        "streamline your workflow",
        "enhance collaboration",
        "customize your experience",
        "boost productivity"
    ];

    return (
        <div className={`relative min-h-[calc(100vh-4rem)] w-full overflow-hidden ${className}`}>
            <ContentContainer className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-4xl mx-auto text-center"
                >
                    <div className="mb-4 text-small font-semibold uppercase tracking-wider text-blue-accent">
                        FEATURES
                    </div>

                    <h1 className="h1-hero mb-4 text-balance">
                        Powerful Tools for <br />
                        <span className="text-blue-accent">Enhanced Productivity</span>
                    </h1>

                    <h2 className="h2-hero mb-6 text-balance text-muted-foreground">
                        Discover how to{' '}
                        <TypewriterText messages={typingMessages} />
                    </h2>

                    <p className="mx-auto mb-8 max-w-2xl text-body-lg text-muted-foreground text-balance">
                        {`FusionSpace's innovative features transform your workflow,
                        boost collaboration, and help you accomplish more in less time.`}
                    </p>


                </motion.div>
            </ContentContainer>
        </div>
    );
};

export default FeaturesHeroSection;