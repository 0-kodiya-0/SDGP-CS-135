import { useEffect, useRef, useState } from 'react';
import '../styles/scrollingText.css';
import { ScrollingTextProps } from '../types/props.ts';

export function ScrollingText({ text, className = '' }: ScrollingTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && contentRef.current) {
                const isContentOverflowing = contentRef.current.scrollWidth > containerRef.current.clientWidth;
                setIsOverflowing(isContentOverflowing);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    const duration = contentRef.current ? `${contentRef.current.scrollWidth / 50}s` : '5s';

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={contentRef}
                className={`whitespace-nowrap transition-transform duration-300 ${isOverflowing && isHovered
                    ? 'animate-marquee'
                    : 'truncate'
                    }`}
                style={{
                    '--duration': duration,
                } as React.CSSProperties}
            >
                {text}
            </div>
        </div>
    );
}