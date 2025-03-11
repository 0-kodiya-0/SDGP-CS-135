import React, { Suspense } from 'react';
import { Tab } from '../types/data.ts';

interface TabContentProps {
    tab: Tab;
}

const TabContent: React.FC<TabContentProps> = ({ tab }) => {
    const LoadComponent = React.useMemo(() => {
        return React.lazy(() => {
            try {
                return import(/* @vite-ignore */ `${tab.contentPath}`)
                    .then(module => ({
                        default: (props: any) => {
                            const Component = module.default;
                            return <Component {...props} {...tab.contentState} />;
                        }
                    }));
            } catch (error) {
                console.error('Error loading component:', error);
                throw error;
            }
        });
    }, [tab.contentPath, tab.contentState]);

    return (
        <div className="h-full w-full overflow-auto">
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            }>
                <ErrorBoundary>
                    <LoadComponent />
                </ErrorBoundary>
            </Suspense>
        </div>
    );
};

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-red-500">
                    <p>Error loading content.</p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-2 text-sm">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default TabContent;