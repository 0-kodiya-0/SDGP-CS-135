// layouts/PageLayout.tsx
import React from 'react';
import { PageLayoutProps } from './page.types';

const PageLayout: React.FC<PageLayoutProps> = ({ 
    children, 
    className = '', 
    fullHeight = false,
    as: Component = 'div'
}) => {
    return (
        <Component 
            className={`
                relative w-full 
                ${fullHeight ? 'min-h-[calc(100vh-4rem)]' : ''} 
                ${className}
            `}
        >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full">
                    {children}
                </div>
            </div>
        </Component>
    );
};

export default PageLayout;