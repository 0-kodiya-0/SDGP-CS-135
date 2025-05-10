import React from 'react';
import { HeroProps } from './heroSection.types';
import TypewriterText from '../shared/TypewriterText';
import ContentContainer from '@/layouts/ContentContainer';
import DotGrid from '../shared/DotGrid';

const HomeHeroSection: React.FC<HeroProps> = ({
    className = ''
}) => {
    const typingMessages = [
        "streamline your workflow",
        "boost productivity",
        "collaborate seamlessly",
        "customize your workspace"
    ];

    return (
        <div className={`relative min-h-[calc(100vh-4rem)] w-full overflow-hidden ${className}`}>
            {/* Dot Grid contained within hero section */}
            <div className="absolute inset-0 z-0">
                <DotGrid />
            </div>

            {/* Hero Content */}
            <ContentContainer className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
                <div className="w-full max-w-4xl mx-auto text-center">
                    <div className="mb-4 text-small font-semibold uppercase tracking-wider text-blue-accent">
                        WELCOME TO
                    </div>
                    <h1 className="h1-hero mb-4 text-balance">
                        FusionSpace
                    </h1>
                    <h2 className="h2-hero mb-6 text-balance text-muted-foreground">
                        The intelligent workspace to{' '}
                        <TypewriterText messages={typingMessages} />
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-body-lg text-muted-foreground text-balance">
                        Experience a new era of productivity with our AI-powered workspace.
                        Unify your tools, automate your workflow, and focus on what matters most.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center mb-12">
                        <button className="group relative rounded-lg bg-blue-accent px-8 py-3 text-body font-semibold text-white transition-all hover:bg-blue-accent-hover">
                            <span className="relative z-10">Start Free Trial</span>
                            <div className="absolute inset-0 h-full w-full rounded-lg bg-gradient-to-r from-blue-accent to-blue-accent-hover opacity-0 blur transition-opacity group-hover:opacity-30"></div>
                        </button>
                        <button className="rounded-lg border border-border-color px-8 py-3 text-body font-semibold text-foreground transition-all hover:bg-card-hover">
                            Watch Demo
                        </button>
                    </div>
                </div>
            </ContentContainer>
        </div>
    );
};

export default HomeHeroSection;