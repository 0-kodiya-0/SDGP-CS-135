import React, { Suspense } from 'react';
import { FeatureType } from '../types/store.ts';

interface DetailsLoaderProps {
    featurePath: string;
    featureType: FeatureType;
    props: Record<string, any>;
}

const DetailsLoader: React.FC<DetailsLoaderProps> = ({ featurePath, featureType, props }) => {
    const LoadComponent = React.useMemo(() => {
        return React.lazy(() => {
            try {
                return import(/* @vite-ignore */ `${featurePath}`)
                    .then(module => ({
                        default: (componentProps: any) => {
                            const Component = module.default;
                            return <Component {...componentProps} featureType={featureType} />;
                        }
                    }));
            } catch (error) {
                console.error(`Error loading feature details component from ${featurePath}:`, error);
                throw error;
            }
        });
    }, [featurePath, featureType]);

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700" />
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

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Feature details component failed to load:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-red-500">
                    <p>Failed to load feature details.</p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto max-h-48">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default DetailsLoader;