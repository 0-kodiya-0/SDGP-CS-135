import { JSX } from "react";

// layouts/page.types.ts
export interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
    fullHeight?: boolean;  // Controls if layout should be full height
    as?: keyof JSX.IntrinsicElements;  // Allows changing the HTML element
}