import React from 'react';

interface AnimatedBeamProps {
    className?: string;
    fromClassName?: string;
    toClassName?: string;
    endElement?: React.ReactNode;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
    className = "",
    fromClassName = "left-0 top-1/2",
    toClassName = "right-0 top-1/2",
    endElement
}) => {
    return (
        <div className={`relative ${className}`}>
            <div className={`absolute size-2 rounded-full bg-blue-500 ${fromClassName}`} />
            <div className="absolute h-px w-full bg-gradient-to-r from-blue-500 to-blue-500/0 animate-pulse" />
            <div className={`absolute size-2 rounded-full ${toClassName}`}>
                {endElement ? (
                    endElement
                ) : (
                    <div className="size-2 rounded-full bg-blue-500" />
                )}
            </div>
        </div>
    );
};