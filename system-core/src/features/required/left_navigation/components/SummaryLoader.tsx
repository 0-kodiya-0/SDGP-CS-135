import React, { Suspense } from 'react';

interface SummaryLoaderProps {
    featurePath: string;
    props: Record<string, any>;
}

const SummaryLoader: React.FC<SummaryLoaderProps> = ({ featurePath, props }) => {
    const LoadComponent = React.useMemo(() => {
        return React.lazy(() => {
            try {
                return import(/* @vite-ignore */ `${featurePath}`)
                    .then(module => ({
                        default: (componentProps: any) => {
                            const Component = module.default;
                            return <Component {...componentProps} />;
                        }
                    }));
            } catch (error) {
                console.error(`Error loading feature component from ${featurePath}:`, error);
                throw error;
            }
        });
    }, [featurePath]);

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700" />
            </div>
        }>
            <ErrorBoundary>
                <LoadComponent {...props} />
            </ErrorBoundary>
        </Suspense>
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
                <div className="p-3 text-red-500 text-sm">
                    <p>Failed to load summary component</p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-2 text-xs overflow-auto max-h-32">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default SummaryLoader;