import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    pluginId: string;
    viewType: string;
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Plugin Components
 * Catches errors in plugin components and displays a fallback UI
 */
class PluginErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to an error reporting service
        console.error(
            `Plugin Error (${this.props.pluginId}, ${this.props.viewType}): ${error.message}`,
            error,
            errorInfo
        );

        this.setState({
            errorInfo
        });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="bg-red-50 text-red-700 p-4 rounded border border-red-300">
                    <h3 className="text-lg font-semibold mb-2">
                        Plugin Error: {this.props.viewType}
                    </h3>
                    <div className="mb-2">
                        {this.state.error?.message || "An unknown error occurred"}
                    </div>
                    <div className="text-sm">
                        <details className="cursor-pointer">
                            <summary className="mb-1">Technical Details</summary>
                            <pre className="whitespace-pre-wrap text-xs p-2 bg-red-100 rounded">
                                {this.state.error?.stack || "No stack trace available"}
                            </pre>
                        </details>
                    </div>
                    <div className="mt-4 text-sm">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => {
                                this.setState({
                                    hasError: false,
                                    error: null,
                                    errorInfo: null
                                });
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default PluginErrorBoundary;