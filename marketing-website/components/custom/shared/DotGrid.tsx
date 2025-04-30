"use client"

import React, { useState, useEffect } from 'react';

interface MousePosition {
    x: number;
    y: number;
}

interface GridConfig {
    dotSize: number;
    spacing: number;
    maxDistance: number;
    maxScale: number;
}

interface DotGridProps {
    className?: string;
    config?: Partial<GridConfig>;
}

const DotGrid: React.FC<DotGridProps> = ({
    className = '',
    config: userConfig = {}
}) => {
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const config: GridConfig = {
        dotSize: 1.5,
        spacing: 24,
        maxDistance: 100,
        maxScale: 4,
        ...userConfig
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

    if (!mounted) return null;

    return (
        <div className={`absolute inset-0 ${className}`}>
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
    );
};

export default DotGrid;