import React, { useState, useEffect } from 'react';
import { HeroProps, MousePosition, GridConfig } from './heroSection.types';
import TypewriterText from '../shared/TypewriterText';
import ContentContainer from '@/layouts/ContentContainer';
import PageLayout from '@/layouts/PageLayout';

const HeroSection: React.FC<HeroProps> = ({
    className = ''
}) => {
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const config: GridConfig = {
        dotSize: 1.5,
        spacing: 24,
        maxDistance: 100,
        maxScale: 4
    };

    useEffect(() => {
        setMounted(true);

        // Set initial dimensions
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
        });

        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const grid = {
        cols: Math.ceil(dimensions.width / config.spacing) || 0,
        rows: Math.ceil(dimensions.height / config.spacing) || 0
    };

    const getDotStyle = (x: number, y: number) => {
        const dotX = x * config.spacing;
        const dotY = y * config.spacing;
        const deltaX = mousePosition.x - dotX;
        const deltaY = mousePosition.y - dotY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scale = Math.max(
            1,
            config.maxScale * (1 - Math.min(distance / config.maxDistance, 1))
        );

        return {
            transform: `translate(${dotX}px, ${dotY}px) scale(${scale})`,
            transition: 'transform 0.3s ease-out'
        };
    };

    const typingMessages = [
        "streamline your workflow",
        "boost productivity",
        "collaborate seamlessly",
        "customize your workspace"
    ];

    // Initial render without dots
    if (!mounted) {
        return (
            <div className={`relative h-screen w-full overflow-hidden bg-black ${className}`}>
                <div className="relative z-10 flex h-full items-center justify-center px-4">
                    <div className="text-center">
                        <div className="mb-4 text-lg font-semibold text-blue-400">WELCOME TO</div>
                        <h1 className="mb-4 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                            FusionSpace
                        </h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PageLayout className="bg-background" fullHeight>
            {/* Dot Grid */}
            <div className="absolute inset-0">
                <svg className="h-full w-full">
                    {grid.cols > 0 && grid.rows > 0 &&
                        Array.from({ length: grid.rows }).map((_, y) =>
                            Array.from({ length: grid.cols }).map((_, x) => (
                                <circle
                                    key={`${x}-${y}`}
                                    cx="0"
                                    cy="0"
                                    r={config.dotSize}
                                    fill="currentColor"
                                    className="text-foreground opacity-20"
                                    style={getDotStyle(x, y)}
                                />
                            ))
                        )
                    }
                </svg>
            </div>

            {/* Hero Content */}
            <ContentContainer className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
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
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
        </PageLayout>
    );
};

export default HeroSection;